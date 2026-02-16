import { Room, Building, RoomType, RoomUnavailable, Course, Reservation, TimeSlot, sequelize } from '../models/index.js';
import { Op } from 'sequelize';

class RoomService {
  // ================= 资源管理 (管理员) =================

  async getBuildings(query = {}) {
    const { page = 1, pageSize = 20, keyword } = query
    const limit = Math.min(Math.max(parseInt(pageSize) || 20, 1), 200)
    const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit

    const where = {}
    if (keyword) {
      const kw = `%${String(keyword).trim()}%`
      where[Op.or] = [
        { name: { [Op.like]: kw } },
        { description: { [Op.like]: kw } }
      ]
    }

    const { count, rows } = await Building.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit,
      offset
    })

    const ids = rows.map((b) => b.id)
    const roomCounts = ids.length
      ? await Room.findAll({
        attributes: ['building_id', [sequelize.fn('COUNT', sequelize.col('Room.id')), 'count']],
        where: { building_id: { [Op.in]: ids } },
        group: ['building_id'],
        raw: true
      })
      : []
    const countMap = new Map(roomCounts.map((x) => [x.building_id, parseInt(x.count) || 0]))

    return {
      total: count,
      page: Math.max(parseInt(page) || 1, 1),
      pageSize: limit,
      list: rows.map((b) => ({ ...b.toJSON(), roomCount: countMap.get(b.id) || 0 }))
    }
  }

  async getRoomTypes(query = {}) {
    const { page = 1, pageSize = 20, keyword } = query
    const limit = Math.min(Math.max(parseInt(pageSize) || 20, 1), 200)
    const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit

    const where = {}
    if (keyword) {
      const kw = `%${String(keyword).trim()}%`
      where[Op.or] = [
        { name: { [Op.like]: kw } },
        { description: { [Op.like]: kw } }
      ]
    }

    const { count, rows } = await RoomType.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit,
      offset
    })

    const ids = rows.map((t) => t.id)
    const roomCounts = ids.length
      ? await Room.findAll({
        attributes: ['room_type_id', [sequelize.fn('COUNT', sequelize.col('Room.id')), 'count']],
        where: { room_type_id: { [Op.in]: ids } },
        group: ['room_type_id'],
        raw: true
      })
      : []
    const countMap = new Map(roomCounts.map((x) => [x.room_type_id, parseInt(x.count) || 0]))

    return {
      total: count,
      page: Math.max(parseInt(page) || 1, 1),
      pageSize: limit,
      list: rows.map((t) => ({ ...t.toJSON(), roomCount: countMap.get(t.id) || 0 }))
    }
  }

  /**
   * 创建楼栋
   */
  async createBuilding(data) {
    return await Building.create(data);
  }

  async updateBuilding(buildingId, data) {
    const building = await Building.findByPk(buildingId)
    if (!building) throw new Error('楼栋不存在')
    const { name, description } = data || {}
    if (name !== undefined) building.name = name
    if (description !== undefined) building.description = description
    await building.save()
    return building
  }

  async deleteBuilding(buildingId) {
    const building = await Building.findByPk(buildingId)
    if (!building) throw new Error('楼栋不存在')
    const roomCount = await Room.count({ where: { building_id: buildingId } })
    if (roomCount > 0) throw new Error('该楼栋下仍存在教室，无法删除')
    await building.destroy()
    return true
  }

  /**
   * 创建教室类型
   */
  async createRoomType(data) {
    return await RoomType.create(data);
  }

  async updateRoomType(roomTypeId, data) {
    const roomType = await RoomType.findByPk(roomTypeId)
    if (!roomType) throw new Error('教室类型不存在')
    const { name, description } = data || {}
    if (name !== undefined) roomType.name = name
    if (description !== undefined) roomType.description = description
    await roomType.save()
    return roomType
  }

  async deleteRoomType(roomTypeId) {
    const roomType = await RoomType.findByPk(roomTypeId)
    if (!roomType) throw new Error('教室类型不存在')
    const roomCount = await Room.count({ where: { room_type_id: roomTypeId } })
    if (roomCount > 0) throw new Error('该类型下仍存在教室，无法删除')
    await roomType.destroy()
    return true
  }

  /**
   * 创建教室
   */
  async createRoom(data) {
    return await Room.create(data);
  }

  async updateRoom(roomId, data) {
    const room = await Room.findByPk(roomId)
    if (!room) throw new Error('教室不存在')

    const {
      room_number,
      building_id,
      room_type_id,
      capacity,
      equipment,
      is_active
    } = data || {}

    if (room_number !== undefined) room.room_number = room_number
    if (building_id !== undefined) room.building_id = building_id
    if (room_type_id !== undefined) room.room_type_id = room_type_id
    if (capacity !== undefined) room.capacity = capacity
    if (equipment !== undefined) room.equipment = equipment
    if (is_active !== undefined) room.is_active = is_active

    await room.save()
    return await Room.findByPk(room.id, { include: [Building, RoomType] })
  }

  async deleteRoom(roomId) {
    const room = await Room.findByPk(roomId)
    if (!room) throw new Error('教室不存在')
    await room.destroy()
    return true
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
    const { page = 1, pageSize = 10, buildingId, roomTypeId, keyword } = query;
    const offset = (page - 1) * pageSize;
    const where = {};

    if (buildingId) where.building_id = buildingId;
    if (roomTypeId) where.room_type_id = roomTypeId;
    if (keyword) {
      const kw = `%${String(keyword).trim()}%`
      where.room_number = { [Op.like]: kw }
    }

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

  async setRoomUnavailable(data = {}) {
    const payload = {
      room_id: data.room_id ?? data.roomId,
      date: data.date,
      time_slot_id: data.time_slot_id ?? data.timeSlotId ?? null,
      reason: data.reason ?? ''
    }
    if (!payload.room_id) throw new Error('room_id is required')
    if (!payload.date) throw new Error('date is required')
    return await RoomUnavailable.create(payload);
  }

  async listRoomUnavailables(query = {}) {
    const {
      page = 1,
      pageSize = 20,
      date,
      startDate,
      endDate,
      roomId,
      buildingId,
      timeSlotId,
      keyword
    } = query

    const limit = Math.min(Math.max(parseInt(pageSize) || 20, 1), 200)
    const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit

    const where = {}
    if (date) {
      where.date = date
    } else if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] }
    } else if (startDate) {
      where.date = { [Op.gte]: startDate }
    } else if (endDate) {
      where.date = { [Op.lte]: endDate }
    }

    if (roomId) where.room_id = parseInt(roomId)
    if (timeSlotId !== undefined && timeSlotId !== null && timeSlotId !== '') {
      const v = parseInt(timeSlotId)
      where.time_slot_id = v === 0 ? null : v
    }
    if (keyword) {
      const kw = `%${String(keyword).trim()}%`
      where[Op.or] = [{ reason: { [Op.like]: kw } }]
    }

    const roomWhere = {}
    if (buildingId) roomWhere.building_id = parseInt(buildingId)

    const { count, rows } = await RoomUnavailable.findAndCountAll({
      where,
      include: [
        {
          model: Room,
          required: true,
          where: Object.keys(roomWhere).length > 0 ? roomWhere : undefined,
          include: [Building, RoomType]
        },
        { model: TimeSlot, required: false }
      ],
      order: [['date', 'DESC'], ['time_slot_id', 'ASC'], ['id', 'DESC']],
      limit,
      offset
    })

    return {
      total: count,
      page: Math.max(parseInt(page) || 1, 1),
      pageSize: limit,
      list: rows
    }
  }

  async deleteRoomUnavailable(id) {
    const row = await RoomUnavailable.findByPk(id)
    if (!row) throw new Error('记录不存在')
    await row.destroy()
    return true
  }

  // ================= 可用性查询 (核心业务) =================

  async getDailyOccupancy(date, query = {}) {
    if (!date) throw new Error('date is required')
    const { buildingId, roomTypeId } = query

    const roomWhere = {}
    if (buildingId) roomWhere.building_id = parseInt(buildingId)
    if (roomTypeId) roomWhere.room_type_id = parseInt(roomTypeId)

    const [timeSlots, rooms] = await Promise.all([
      TimeSlot.findAll({ order: [['id', 'ASC']] }),
      Room.findAll({
        where: roomWhere,
        include: [Building, RoomType],
        order: [['room_number', 'ASC']]
      })
    ])

    const roomIds = rooms.map((r) => r.id)
    if (roomIds.length === 0) {
      return {
        date,
        timeSlots,
        rooms: []
      }
    }

    const [unavailables, courses, reservations] = await Promise.all([
      RoomUnavailable.findAll({
        where: { date, room_id: { [Op.in]: roomIds } },
        order: [['id', 'DESC']]
      }),
      Course.findAll({
        where: { date, room_id: { [Op.in]: roomIds } }
      }),
      Reservation.findAll({
        where: { date, room_id: { [Op.in]: roomIds }, status: 'approved' }
      })
    ])

    const unavailableAllDay = new Map()
    const unavailableBySlot = new Map()
    for (const u of unavailables) {
      const rid = u.room_id
      if (u.time_slot_id == null) {
        if (!unavailableAllDay.has(rid)) unavailableAllDay.set(rid, u)
        continue
      }
      const key = `${rid}:${u.time_slot_id}`
      if (!unavailableBySlot.has(key)) unavailableBySlot.set(key, u)
    }

    const courseBySlot = new Map()
    for (const c of courses) {
      if (!c.time_slot_id) continue
      const key = `${c.room_id}:${c.time_slot_id}`
      if (!courseBySlot.has(key)) courseBySlot.set(key, c)
    }

    const reservationBySlot = new Map()
    for (const r of reservations) {
      if (!r.time_slot_id) continue
      const key = `${r.room_id}:${r.time_slot_id}`
      if (!reservationBySlot.has(key)) reservationBySlot.set(key, r)
    }

    const resultRooms = rooms.map((room) => {
      const plain = room.toJSON()
      const occupancy = {}
      const allDay = unavailableAllDay.get(room.id)
      for (const ts of timeSlots) {
        const sid = ts.id
        if (!plain.is_active) {
          occupancy[sid] = { status: 'disabled' }
          continue
        }
        if (allDay) {
          occupancy[sid] = { status: 'unavailable', reason: allDay.reason || '' }
          continue
        }
        const u = unavailableBySlot.get(`${room.id}:${sid}`)
        if (u) {
          occupancy[sid] = { status: 'unavailable', reason: u.reason || '' }
          continue
        }
        const c = courseBySlot.get(`${room.id}:${sid}`)
        if (c) {
          occupancy[sid] = { status: 'course', course_name: c.course_name || '' }
          continue
        }
        const rr = reservationBySlot.get(`${room.id}:${sid}`)
        if (rr) {
          occupancy[sid] = { status: 'reservation', people_count: rr.people_count ?? null }
          continue
        }
        occupancy[sid] = { status: 'free' }
      }
      return { ...plain, occupancy }
    })

    return {
      date,
      timeSlots,
      rooms: resultRooms
    }
  }

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
