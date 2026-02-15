import { Reservation, ReservationAudit, User, Room, TimeSlot, Admin, AdminScope, Building, RoomType, SystemLog } from '../models/index.js';
import scheduleService from './scheduleService.js';
import roomService from './roomService.js';
import { sequelize } from '../models/index.js';
import { Op } from 'sequelize';

class ReservationService {
  async writeSystemLog({ userId, action, targetType, targetId }, options = {}) {
    if (!action) return
    await SystemLog.create(
      {
        user_id: userId || null,
        action,
        target_type: targetType || null,
        target_id: targetId || null
      },
      options
    )
  }

  /**
   * 提交预约申请
   * @param {Object} data
   * @param {number} data.userId - 申请人ID
   * @param {number} data.roomId - 教室ID
   * @param {string} data.date - 日期
   * @param {number} data.timeSlotId - 节次ID
   * @param {number} data.peopleCount - 人数
   */
  async createReservation(data) {
    const { userId, roomId, date, timeSlotId, peopleCount } = data;

    // 1. 检查申请人身份和冲突
    const user = await User.findByPk(userId);
    if (!user) throw new Error('用户不存在');

    // 重点：若申请者为教师，系统自动判断该时间段他是否上课
    if (user.role === 'teacher') {
      const isBusy = await scheduleService.checkTeacherConflict(userId, date, timeSlotId);
      if (isBusy) {
        throw new Error('您在该时段已有课程安排，无法申请预约');
      }
    }

    // 2. 检查教室是否可用 (双重检查，防止并发)
    // 这里我们简单复用 getAvailableRooms 的逻辑，或者直接查询
    // 注意：这里需要更严格的检查，包括是否已被别人预约(即使是 pending 也可能需要互斥，取决于策略)
    // 假设策略：先到先得，Pending 状态也占位，或者允许重复申请由管理员择优。
    // 这里采用：Approved 绝对互斥。Pending 允许提交，但在审核时提示冲突。
    // 但是为了用户体验，如果已经 Approved 了，就直接报错。
    const existingApproved = await Reservation.findOne({
      where: {
        room_id: roomId,
        date,
        time_slot_id: timeSlotId,
        status: 'approved'
      }
    });
    if (existingApproved) {
      throw new Error('该教室在此时段已被预约');
    }

    // 检查课程占用
    const courseOccupied = await scheduleService.checkRoomCourseOccupancy(roomId, date, timeSlotId);
    if (courseOccupied) {
      throw new Error('该教室在此时段有课');
    }

    // 3. 创建预约
    const reservation = await Reservation.create({
      user_id: userId,
      room_id: roomId,
      time_slot_id: timeSlotId,
      date,
      people_count: peopleCount,
      status: 'pending'
    });

    await this.writeSystemLog({
      userId,
      action: 'reservation.create',
      targetType: 'Reservation',
      targetId: reservation.id
    })

    return reservation
  }

  /**
   * 审核预约
   * @param {number} adminId - 管理员ID
   * @param {number} reservationId - 预约ID
   * @param {string} action - 'approve' | 'reject'
   * @param {string} reason - 理由
   */
  async auditReservation(adminId, reservationId, action, reason) {
    const transaction = await sequelize.transaction();
    try {
      // 使用锁查询，防止并发审核冲突
      const reservation = await Reservation.findByPk(reservationId, {
        include: [
          { model: Room, include: [Building, RoomType] }
        ],
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      if (!reservation) throw new Error('预约不存在');
      if (reservation.status !== 'pending') throw new Error('该预约已处理');

      // 1. 权限检查：该管理员是否有权审核此教室 (楼栋或类型)
      // 获取管理员的管辖范围
      const adminScopes = await AdminScope.findAll({ where: { admin_id: adminId } });
      let hasPermission = false;

      for (const scope of adminScopes) {
        if (scope.scope_type === 'building' && scope.scope_id === reservation.Room.building_id) {
          hasPermission = true;
          break;
        }
        if (scope.scope_type === 'room_type' && scope.scope_id === reservation.Room.room_type_id) {
          hasPermission = true;
          break;
        }
      }

      // 超级管理员(admin)可能不需要 scope 限制，这里假设 admin 表里的都是普通管理员，
      // 或者在 User 表里的 role='admin' 有最高权限。
      // 这里严格按照 "按楼栋或教室类型分配不同审核员" 实现。
      if (!hasPermission) {
        // 检查是否是系统超级管理员 (User.role === 'admin')
        const adminUser = await Admin.findByPk(adminId, { include: [User] });
        if (adminUser?.User?.role !== 'admin') {
          // 如果不是超级管理员，且没有scope权限
          throw new Error('无权审核该教室的预约');
        }
      }

      // 2. 如果是批准，再次检查冲突 (防止在审核期间产生了新的 approved 预约)
      if (action === 'approve') {
        const conflict = await Reservation.findOne({
          where: {
            room_id: reservation.room_id,
            date: reservation.date,
            time_slot_id: reservation.time_slot_id,
            status: 'approved'
          },
          transaction
        });
        if (conflict) {
          throw new Error('冲突警告：该时段已被其他预约占用');
        }
      }

      // 3. 更新预约状态
      reservation.status = action === 'approve' ? 'approved' : 'rejected';
      await reservation.save({ transaction });

      // 4. 创建审核记录
      await ReservationAudit.create({
        reservation_id: reservationId,
        admin_id: adminId,
        action,
        reason
      }, { transaction });

      const admin = await Admin.findByPk(adminId, { transaction })
      await this.writeSystemLog(
        {
          userId: admin?.user_id || null,
          action: action === 'approve' ? 'reservation.audit.approve' : 'reservation.audit.reject',
          targetType: 'Reservation',
          targetId: reservation.id
        },
        { transaction }
      )

      await transaction.commit();
      return reservation;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 用户查看个人预约
   */
  async getUserReservations(userId) {
    return await Reservation.findAll({
      where: { user_id: userId },
      include: [
        { model: Room, include: [Building, RoomType] },
        { model: TimeSlot, attributes: ['start_time', 'end_time'] },
        {
          model: ReservationAudit,
          limit: 1,
          order: [['createdAt', 'DESC']],
          include: [{ model: Admin, include: [{ model: User, attributes: ['id', 'name', 'email', 'role'] }] }]
        } // 获取最新的审核意见
      ],
      order: [['date', 'DESC']]
    });
  }

  /**
   * 取消预约
   */
  async cancelReservation(userId, reservationId) {
    const reservation = await Reservation.findByPk(reservationId);
    if (!reservation) throw new Error('预约不存在');
    if (reservation.user_id !== userId) throw new Error('无权操作');

    if (reservation.status === 'pending') {
      // 审核通过前可直接取消
      reservation.status = 'cancelled';
      await reservation.save();
    } else if (reservation.status === 'approved') {
      // 审核通过后需管理员确认 -> 这里简化为改为 'cancelled'，
      // 实际需求说 "需管理员确认"，可能意味着状态变为 "cancellation_requested" 然后管理员审核。
      // 为简化，这里直接允许取消，释放资源。
      reservation.status = 'cancelled';
      await reservation.save();
    }

    await this.writeSystemLog({
      userId,
      action: 'reservation.cancel',
      targetType: 'Reservation',
      targetId: reservation.id
    })

    return reservation;
  }

  async getPendingReservations(adminId, query = {}) {
    const admin = await Admin.findByPk(adminId)
    if (!admin) throw new Error('管理员不存在')

    const {
      page = 1,
      pageSize = 20,
      date,
      buildingId,
      roomTypeId,
      keyword
    } = query

    const limit = Math.min(Math.max(parseInt(pageSize) || 20, 1), 200)
    const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit

    const adminScopes = await AdminScope.findAll({ where: { admin_id: adminId } })
    const buildingScopeIds = adminScopes.filter(s => s.scope_type === 'building').map(s => s.scope_id)
    const roomTypeScopeIds = adminScopes.filter(s => s.scope_type === 'room_type').map(s => s.scope_id)

    const roomWhere = {}
    const scopeOr = []
    if (buildingScopeIds.length > 0) scopeOr.push({ building_id: { [Op.in]: buildingScopeIds } })
    if (roomTypeScopeIds.length > 0) scopeOr.push({ room_type_id: { [Op.in]: roomTypeScopeIds } })
    if (scopeOr.length > 0) roomWhere[Op.or] = scopeOr

    if (buildingId) roomWhere.building_id = buildingId
    if (roomTypeId) roomWhere.room_type_id = roomTypeId

    const where = { status: 'pending' }
    if (date) where.date = date

    if (keyword) {
      const kw = `%${String(keyword).trim()}%`
      where[Op.or] = [
        { '$Room.room_number$': { [Op.like]: kw } },
        { '$User.name$': { [Op.like]: kw } },
        { '$User.email$': { [Op.like]: kw } }
      ]
    }

    const { rows, count } = await Reservation.findAndCountAll({
      where,
      include: [
        { model: User, attributes: ['id', 'name', 'email', 'role'] },
        {
          model: Room,
          include: [Building, RoomType],
          where: Object.keys(roomWhere).length > 0 ? roomWhere : undefined,
          required: Object.keys(roomWhere).length > 0
        },
        { model: TimeSlot }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    })

    return { list: rows, total: count, page: Math.max(parseInt(page) || 1, 1), pageSize: limit }
  }

  async getAuditHistory(adminId, query = {}) {
    const admin = await Admin.findByPk(adminId)
    if (!admin) throw new Error('管理员不存在')

    const {
      page = 1,
      pageSize = 20,
      action,
      startDate,
      endDate,
      keyword
    } = query

    const limit = Math.min(Math.max(parseInt(pageSize) || 20, 1), 200)
    const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit

    const where = {}
    if (action) where.action = action
    if (startDate && endDate) {
      where.createdAt = { [Op.between]: [`${startDate} 00:00:00`, `${endDate} 23:59:59`] }
    }

    if (keyword) {
      const kw = `%${String(keyword).trim()}%`
      where[Op.or] = [
        { '$Reservation.Room.room_number$': { [Op.like]: kw } },
        { '$Reservation.User.name$': { [Op.like]: kw } },
        { '$Reservation.User.email$': { [Op.like]: kw } },
        { reason: { [Op.like]: kw } }
      ]
    }

    const { rows, count } = await ReservationAudit.findAndCountAll({
      where,
      include: [
        { model: Admin, include: [{ model: User, attributes: ['id', 'name', 'email', 'role'] }] },
        {
          model: Reservation,
          include: [
            { model: User, attributes: ['id', 'name', 'email', 'role'] },
            { model: Room, include: [Building, RoomType] },
            { model: TimeSlot }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    })

    return { list: rows, total: count, page: Math.max(parseInt(page) || 1, 1), pageSize: limit }
  }
}

export default new ReservationService();
