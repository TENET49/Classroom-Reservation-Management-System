import express from 'express';
import { getErr, getResult } from '../getSendResult.js';
import reservationService from '../../services/reservationService.js';
import scheduleService from '../../services/scheduleService.js';
import statisticsService from '../../services/statisticsService.js';
import { Admin, SystemLog, User } from '../../models/index.js';
import { Op } from 'sequelize';

const router = express.Router();

async function resolveAdminId(req) {
  const adminId = req.body?.adminId || req.query?.adminId
  if (adminId) return parseInt(adminId)
  if (!req.userId) return null
  const admin = await Admin.findOne({ where: { user_id: req.userId } })
  return admin?.id || null
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
      where.created_at = { [Op.between]: [`${startDate} 00:00:00`, `${endDate} 23:59:59`] }
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
      order: [['created_at', 'DESC']],
      limit,
      offset
    })
    res.send(getResult({ list: rows, total: count, page: Math.max(parseInt(page) || 1, 1), pageSize: limit }))
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
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
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.send(getErr('startDate and endDate are required', 400));
    }
    const result = await statisticsService.getRoomUsageStats(startDate, endDate);
    res.send(getResult(result));
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

export default router;
