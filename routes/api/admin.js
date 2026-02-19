import express from 'express';
import { getErr, getResult } from '../getSendResult.js';
import reservationService from '../../services/reservationService.js';
import scheduleService from '../../services/scheduleService.js';
import statisticsService from '../../services/statisticsService.js';
import roomService from '../../services/roomService.js';
import { Admin, AdminScope, SystemLog, User, Reservation, Room, Building, RoomType, TimeSlot } from '../../models/index.js';
import { Op } from 'sequelize';

const router = express.Router();

async function resolveAdminId(req) {
  if (!req.userId) return null
  const admin = await Admin.findOne({ where: { user_id: req.userId } })
  return admin?.id || null
}

async function requireSystemAdmin(req) {
  if (!req.userId) throw new Error('未登录')
  const admin = await Admin.findOne({ where: { user_id: req.userId } })
  if (!admin) throw new Error('无权访问此接口')
  if (!admin.is_system) throw new Error('仅系统管理员可操作')
  return admin
}

async function getAdminContext(req) {
  if (!req.userId) return null
  const admin = await Admin.findOne({ where: { user_id: req.userId } })
  if (!admin) return null
  if (admin.is_system) return { adminId: admin.id, isSystem: true, buildingIds: [] }
  const scopes = await AdminScope.findAll({ where: { admin_id: admin.id, scope_type: 'building' } })
  const buildingIds = (scopes || []).map((s) => s.scope_id).filter((x) => Number.isFinite(x))
  if (buildingIds.length === 0) return { adminId: admin.id, isSystem: false, buildingIds: [-1] }
  return { adminId: admin.id, isSystem: false, buildingIds }
}

/**
 * 审核预约
 * POST /reservations/:id/audit
 */
router.post('/reservations/:id/audit', async (req, res) => {
  try {
    const { action, reason } = req.body;
    if (!action) return res.send(getErr('action is required', 400));
    const adminId = await resolveAdminId(req)
    if (!adminId) return res.status(403).send(getErr('adminId is required', 403))
    const result = await reservationService.auditReservation(
      adminId, req.params.id, action, reason
    );
    res.send(getResult(result));
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

router.get('/reservations/pending', async (req, res) => {
  try {
    const adminId = await resolveAdminId(req)
    if (!adminId) return res.status(403).send(getErr('adminId is required', 403))
    const result = await reservationService.getPendingReservations(adminId, req.query)
    res.send(getResult(result))
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
})

router.get('/audits', async (req, res) => {
  try {
    const adminId = await resolveAdminId(req)
    if (!adminId) return res.status(403).send(getErr('adminId is required', 403))
    const result = await reservationService.getAuditHistory(adminId, req.query)
    res.send(getResult(result))
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
})

router.get('/system-logs', async (req, res) => {
  try {
    const adminId = await resolveAdminId(req)
    if (!adminId) return res.status(403).send(getErr('adminId is required', 403))

    const {
      page = 1,
      pageSize = 20,
      userId,
      action,
      targetType,
      targetId,
      startDate,
      endDate,
      keyword
    } = req.query

    const limit = Math.min(Math.max(parseInt(pageSize) || 20, 1), 200)
    const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit

    const where = {}
    if (userId) where.user_id = parseInt(userId)
    if (action) where.action = { [Op.like]: `%${String(action).trim()}%` }
    if (targetType) where.target_type = String(targetType)
    if (targetId) where.target_id = parseInt(targetId)
    if (startDate && endDate) {
      where.createdAt = { [Op.between]: [`${startDate} 00:00:00`, `${endDate} 23:59:59`] }
    }
    if (keyword) {
      const kw = `%${String(keyword).trim()}%`
      where[Op.or] = [
        { action: { [Op.like]: kw } },
        { target_type: { [Op.like]: kw } }
      ]
    }

    const { rows, count } = await SystemLog.findAndCountAll({
      where,
      include: [{ model: User, attributes: ['id', 'name', 'email', 'role'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    })

    const reservationIds = Array.from(
      new Set(
        (rows || [])
          .filter((x) => x?.target_type === 'Reservation' && x?.target_id)
          .map((x) => x.target_id)
      )
    )
    const reservationMap = new Map()
    if (reservationIds.length > 0) {
      const reservations = await Reservation.findAll({
        where: { id: { [Op.in]: reservationIds } },
        include: [
          { model: User, attributes: ['id', 'name', 'email', 'role'] },
          { model: Room, include: [Building, RoomType] },
          { model: TimeSlot }
        ]
      })
      for (const r of reservations) reservationMap.set(r.id, r)
    }

    const list = (rows || []).map((x) => {
      const plain = x.toJSON()
      if (plain.target_type === 'Reservation' && plain.target_id) {
        plain.reservation = reservationMap.get(plain.target_id) || null
      }
      return plain
    })

    res.send(getResult({ list, total: count, page: Math.max(parseInt(page) || 1, 1), pageSize: limit }))
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
})

router.get('/users', async (req, res) => {
  try {
    const adminId = await resolveAdminId(req)
    if (!adminId) return res.status(403).send(getErr('adminId is required', 403))

    const { role, keyword } = req.query
    const where = {}
    if (role) where.role = String(role)
    if (keyword) {
      const kw = `%${String(keyword).trim()}%`
      where[Op.or] = [
        { name: { [Op.like]: kw } },
        { email: { [Op.like]: kw } }
      ]
    }

    const list = await User.findAll({
      where,
      attributes: ['id', 'name', 'email', 'role'],
      order: [['name', 'ASC'], ['id', 'ASC']]
    })
    res.send(getResult({ list }))
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
})

router.get('/user-management/users', async (req, res) => {
  try {
    await requireSystemAdmin(req)

    const { page = 1, pageSize = 20, role, keyword } = req.query
    const limit = Math.min(Math.max(parseInt(pageSize) || 20, 1), 200)
    const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit

    const where = {}
    if (role) where.role = String(role)
    if (keyword) {
      const kw = `%${String(keyword).trim()}%`
      where[Op.or] = [{ name: { [Op.like]: kw } }, { email: { [Op.like]: kw } }]
    }

    const { rows, count } = await User.findAndCountAll({
      where,
      include: [
        {
          model: Admin,
          required: false,
          include: [{ model: AdminScope, required: false }]
        }
      ],
      order: [['id', 'DESC']],
      limit,
      offset
    })

    res.send(getResult({ list: rows, total: count, page: Math.max(parseInt(page) || 1, 1), pageSize: limit }))
  } catch (error) {
    console.error(error)
    res.send(getErr(error.message))
  }
})

router.post('/user-management/users', async (req, res) => {
  try {
    await requireSystemAdmin(req)

    const { name, email, password, role, is_system, buildingIds } = req.body || {}
    if (!name || !email || !password || !role) return res.send(getErr('name, email, password and role are required', 400))

    const existing = await User.findOne({ where: { email } })
    if (existing) return res.send(getErr('邮箱已被注册', 400))

    const user = await User.create({ name, email, password_hash: password, role })

    if (role === 'admin') {
      const admin = await Admin.create({ user_id: user.id, is_system: !!is_system })
      if (!admin.is_system && Array.isArray(buildingIds)) {
        const ids = Array.from(new Set(buildingIds.map((x) => parseInt(x)).filter((x) => Number.isFinite(x))))
        if (ids.length > 0) {
          await AdminScope.bulkCreate(ids.map((id) => ({ admin_id: admin.id, scope_type: 'building', scope_id: id })))
        }
      }
    }

    const result = await User.findByPk(user.id, {
      include: [{ model: Admin, required: false, include: [{ model: AdminScope, required: false }] }]
    })
    res.send(getResult(result))
  } catch (error) {
    console.error(error)
    res.send(getErr(error.message))
  }
})

router.put('/user-management/users/:id', async (req, res) => {
  try {
    await requireSystemAdmin(req)

    const userId = parseInt(req.params.id)
    const { name, email, password, role, is_system, buildingIds } = req.body || {}
    const user = await User.findByPk(userId)
    if (!user) return res.send(getErr('用户不存在', 404))

    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email, id: { [Op.ne]: userId } } })
      if (existing) return res.send(getErr('邮箱已被注册', 400))
      user.email = email
    }
    if (name !== undefined) user.name = name
    if (role !== undefined) user.role = role
    if (password) user.password_hash = password
    await user.save()

    let admin = await Admin.findOne({ where: { user_id: user.id } })
    if (user.role === 'admin') {
      if (!admin) admin = await Admin.create({ user_id: user.id, is_system: !!is_system })
      if (is_system !== undefined) admin.is_system = !!is_system
      await admin.save()

      await AdminScope.destroy({ where: { admin_id: admin.id, scope_type: 'building' } })
      if (!admin.is_system && Array.isArray(buildingIds)) {
        const ids = Array.from(new Set(buildingIds.map((x) => parseInt(x)).filter((x) => Number.isFinite(x))))
        if (ids.length > 0) {
          await AdminScope.bulkCreate(ids.map((id) => ({ admin_id: admin.id, scope_type: 'building', scope_id: id })))
        }
      }
    } else {
      if (admin) {
        await AdminScope.destroy({ where: { admin_id: admin.id } })
        admin.is_system = false
        await admin.save()
      }
    }

    const result = await User.findByPk(user.id, {
      include: [{ model: Admin, required: false, include: [{ model: AdminScope, required: false }] }]
    })
    res.send(getResult(result))
  } catch (error) {
    console.error(error)
    res.send(getErr(error.message))
  }
})

router.delete('/user-management/users/:id', async (req, res) => {
  try {
    await requireSystemAdmin(req)

    const userId = parseInt(req.params.id)
    if (req.userId && userId === parseInt(req.userId)) return res.send(getErr('不能删除当前登录用户', 400))

    const user = await User.findByPk(userId)
    if (!user) return res.send(getErr('用户不存在', 404))

    const admin = await Admin.findOne({ where: { user_id: user.id } })
    if (admin) {
      await AdminScope.destroy({ where: { admin_id: admin.id } })
    }
    await user.destroy()
    res.send(getResult(true))
  } catch (error) {
    console.error(error)
    res.send(getErr(error.message))
  }
})

/**
 * 导入教师课表
 * POST /import/teacher-schedules
 */
router.post('/import/teacher-schedules', async (req, res) => {
  try {
    const schedules = req.body; // 假设直接传 JSON 数组
    if (!Array.isArray(schedules)) {
      return res.send(getErr('Body must be an array', 400));
    }
    const result = await scheduleService.importTeacherSchedules(schedules);
    res.send(getResult(result));
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

/**
 * 导入课程表
 * POST /import/courses
 */
router.post('/import/courses', async (req, res) => {
  try {
    const courses = req.body;
    if (!Array.isArray(courses)) {
      return res.send(getErr('Body must be an array', 400));
    }
    const result = await scheduleService.importCourses(courses);
    res.send(getResult(result));
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

/**
 * 获取教室利用率统计
 * GET /stats/usage
 */
router.get('/stats/usage', async (req, res) => {
  try {
    const ctx = await getAdminContext(req)
    if (!ctx) return res.send(getErr('无权访问此接口', 403))
    const { startDate, endDate, groupBy, buildingId, roomTypeId } = req.query;
    if (!startDate || !endDate) {
      return res.send(getErr('startDate and endDate are required', 400));
    }
    const result = await statisticsService.getRoomUsageStats(startDate, endDate, groupBy, {
      buildingId: buildingId ? parseInt(buildingId) : undefined,
      roomTypeId: roomTypeId ? parseInt(roomTypeId) : undefined,
      allowedBuildingIds: ctx && !ctx.isSystem ? ctx.buildingIds : undefined
    });
    res.send(getResult(result));
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

router.get('/stats/dashboard', async (req, res) => {
  try {
    const ctx = await getAdminContext(req)
    if (!ctx) return res.send(getErr('无权访问此接口', 403))
    const { startDate, endDate, buildingId, roomTypeId, today } = req.query
    if (!startDate || !endDate) {
      return res.send(getErr('startDate and endDate are required', 400))
    }
    const result = await statisticsService.getDashboardStats({
      startDate,
      endDate,
      today: today || undefined,
      buildingId: buildingId ? parseInt(buildingId) : undefined,
      roomTypeId: roomTypeId ? parseInt(roomTypeId) : undefined,
      allowedBuildingIds: ctx && !ctx.isSystem ? ctx.buildingIds : undefined
    })
    res.send(getResult(result))
  } catch (error) {
    console.error(error)
    res.send(getErr(error.message))
  }
})

router.get('/reservations/export', async (req, res) => {
  try {
    const ctx = await getAdminContext(req)
    if (!ctx) return res.send(getErr('无权访问此接口', 403))
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.send(getErr('startDate and endDate are required', 400));
    }

    const {
      status,
      buildingId,
      roomTypeId,
      keyword,
      page,
      pageSize,
      exportAll
    } = req.query

    const result = await statisticsService.exportReservationRecords({
      startDate,
      endDate,
      status: status || undefined,
      buildingId: buildingId ? parseInt(buildingId) : undefined,
      roomTypeId: roomTypeId ? parseInt(roomTypeId) : undefined,
      keyword: keyword || undefined,
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 50,
      exportAll: String(exportAll || '').toLowerCase() === 'true' || exportAll === '1',
      allowedBuildingIds: ctx && !ctx.isSystem ? ctx.buildingIds : undefined
    })
    res.send(getResult(result));
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

router.get('/occupancy', async (req, res) => {
  try {
    const ctx = await getAdminContext(req)
    if (!ctx) return res.send(getErr('无权访问此接口', 403))
    const { date, buildingId, roomTypeId } = req.query
    if (!date) return res.send(getErr('date is required', 400))
    const result = await roomService.getDailyOccupancy(date, {
      buildingId: buildingId ? parseInt(buildingId) : undefined,
      roomTypeId: roomTypeId ? parseInt(roomTypeId) : undefined
    }, ctx && !ctx.isSystem ? ctx.buildingIds : undefined)
    res.send(getResult(result))
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
})

export default router;
