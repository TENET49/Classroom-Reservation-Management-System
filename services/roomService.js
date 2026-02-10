import { Room, Building, RoomType, RoomUnavailable, Course, Reservation, TimeSlot } from '../models/index.js';
import { Op } from 'sequelize';

class RoomService {
  // ================= 资源管理 (管理员) =================

  /**
   * 创建楼栋
   */
  async createBuilding(data) {
    return await Building.create(data);
  }

  /**
   * 创建教室类型
   */
  async createRoomType(data) {
    return await RoomType.create(data);
  }

  /**
   * 创建教室
   */
  async createRoom(data) {
    return await Room.create(data);
  }

  /**
   * 获取教室详情
   */
  async getRoomDetails(roomId) {
    return await Room.findByPk(roomId, {
      include: [Building, RoomType]
    });
  }

  /**
   * 获取所有教室 (支持分页和筛选)
   */
  async getAllRooms(query = {}) {
    const { page = 1, pageSize = 10, buildingId, roomTypeId } = query;
    const offset = (page - 1) * pageSize;
    const where = {};

    if (buildingId) where.building_id = buildingId;
    if (roomTypeId) where.room_type_id = roomTypeId;

    const { count, rows } = await Room.findAndCountAll({
      where,
      include: [Building, RoomType],
      offset: parseInt(offset),
      limit: parseInt(pageSize),
      order: [['room_number', 'ASC']]
    });

    return {
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      list: rows
    };
  }

  // ================= 状态维护 =================

  /**
   * 设置教室不可用 (维修、临时征用等)
   * @param {Object} data - { roomId, date, timeSlotId (optional), reason }
   */
  async setRoomUnavailable(data) {
    return await RoomUnavailable.create(data);
  }

  // ================= 可用性查询 (核心业务) =================

  /**
   * 查询可用教室
   * 核心逻辑：排除 课程占用 + 预约占用(已批准) + 维修禁用
   * @param {Object} criteria - 查询条件
   * @param {string} criteria.date - 日期
   * @param {number} criteria.timeSlotId - 节次
   * @param {number} criteria.roomTypeId - (可选) 教室类型
   * @param {number} criteria.capacity - (可选) 最小容量
   */
  async getAvailableRooms({ date, timeSlotId, roomTypeId, capacity }) {
    // 1. 基础筛选条件
    const roomWhere = { is_active: true }; // 必须是启用的教室
    if (roomTypeId) roomWhere.room_type_id = roomTypeId;
    if (capacity) roomWhere.capacity = { [Op.gte]: capacity };

    // 2. 查找所有符合基础条件的教室
    const allRooms = await Room.findAll({
      where: roomWhere,
      include: [Building, RoomType]
    });

    // 3. 过滤掉被占用的教室
    const availableRooms = [];

    for (const room of allRooms) {
      // Check 1: 课程占用
      const isCourseOccupied = await Course.count({
        where: {
          room_id: room.id,
          date,
          time_slot_id: timeSlotId
        }
      });
      if (isCourseOccupied > 0) continue;

      // Check 2: 预约占用 (只考虑已批准的，或者 pending 的？需求通常是 approved 算占用，
      // 但为了防止超卖，有时候 pending 也算。这里假设 approved 才算硬占用，pending 在审核时判断)
      // 根据需求 "提交后自动发送给指定的审核管理员"，说明 pending 状态下教室可能还没被锁死，
      // 但为了用户体验，不应该展示已经有 pending 预约的教室？或者展示但提示排队？
      // 这里简化逻辑：已批准的算占用。
      const isReserved = await Reservation.count({
        where: {
          room_id: room.id,
          date,
          time_slot_id: timeSlotId,
          status: 'approved'
        }
      });
      if (isReserved > 0) continue;

      // Check 3: 维修/不可用记录
      const isUnavailable = await RoomUnavailable.count({
        where: {
          room_id: room.id,
          date,
          // 如果 time_slot_id 为空，表示整天不可用；如果不为空，表示特定节次不可用
          [Op.or]: [
            { time_slot_id: null },
            { time_slot_id: timeSlotId }
          ]
        }
      });
      if (isUnavailable > 0) continue;

      availableRooms.push(room);
    }

    return availableRooms;
  }

  /**
   * 获取某教室的详细状态 (今日/本周课表 + 预约 + 状态)
   */
  async getRoomSchedule(roomId, date) {
    // 获取当天的课程
    const courses = await Course.findAll({
      where: { room_id: roomId, date },
      include: [TimeSlot]
    });

    // 获取当天的预约
    const reservations = await Reservation.findAll({
      where: { room_id: roomId, date, status: 'approved' },
      include: [TimeSlot]
    });

    // 获取不可用记录
    const unavailables = await RoomUnavailable.findAll({
      where: { room_id: roomId, date }
    });

    return {
      courses,
      reservations,
      unavailables
    };
  }
}

export default new RoomService();
