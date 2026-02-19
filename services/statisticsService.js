import { Reservation, ReservationAudit, Admin, TimeSlot, Room, Building, RoomType, Course, User, sequelize } from '../models/index.js';
import { Op } from 'sequelize';

class StatisticsService {
  async getDashboardStats(query = {}) {
    const { startDate, endDate, buildingId, roomTypeId, today, allowedBuildingIds } = query
    if (!startDate || !endDate) throw new Error('startDate and endDate are required')

    const roomWhere = {}
    const allowedIds = Array.isArray(allowedBuildingIds)
      ? allowedBuildingIds.map((x) => parseInt(x)).filter((x) => Number.isFinite(x))
      : []
    if (allowedIds.length > 0) roomWhere.building_id = { [Op.in]: allowedIds }
    if (buildingId) {
      if (allowedIds.length > 0 && !allowedIds.includes(buildingId)) {
        roomWhere.building_id = -1
      } else {
        roomWhere.building_id = buildingId
      }
    }
    if (roomTypeId) roomWhere.room_type_id = roomTypeId

    const includeRoom = {
      model: Room,
      attributes: [],
      include: [
        { model: Building, attributes: [] },
        { model: RoomType, attributes: [] }
      ],
      where: Object.keys(roomWhere).length > 0 ? roomWhere : undefined,
      required: Object.keys(roomWhere).length > 0
    }

    const rangeWhere = { date: { [Op.between]: [startDate, endDate] } }

    const [totalReservations, approvedReservations, activeUsers] = await Promise.all([
      Reservation.count({ where: rangeWhere, include: [includeRoom] }),
      Reservation.count({ where: { ...rangeWhere, status: 'approved' }, include: [includeRoom] }),
      Reservation.findAll({
        attributes: [[sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('Reservation.user_id'))), 'count']],
        where: rangeWhere,
        include: [includeRoom],
        raw: true
      })
    ])

    const activeUserCount = parseInt(activeUsers?.[0]?.count) || 0

    const weekdayRaw = await Reservation.findAll({
      attributes: [
        [sequelize.fn('WEEKDAY', sequelize.col('Reservation.date')), 'weekday'],
        [sequelize.fn('COUNT', sequelize.col('Reservation.id')), 'count']
      ],
      where: rangeWhere,
      include: [includeRoom],
      group: [sequelize.fn('WEEKDAY', sequelize.col('Reservation.date'))],
      raw: true
    })

    const weekdayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    const weekdayMap = new Map()
    for (const x of weekdayRaw || []) weekdayMap.set(parseInt(x.weekday), parseInt(x.count) || 0)
    const weekdayStats = Array.from({ length: 7 }).map((_, i) => ({
      weekday: i,
      weekdayName: weekdayNames[i],
      label: weekdayNames[i],
      count: weekdayMap.get(i) || 0
    }))

    let todayReservationCount = 0
    if (today) {
      todayReservationCount = await Reservation.count({ where: { date: today }, include: [includeRoom] })
    }

    return {
      todayReservationCount,
      totalReservations,
      approvedReservations,
      activeUserCount,
      weekdayStats
    }
  }

  /**
   * 统计教室利用率
   * 利用率 = (课程占用节次 + 预约占用节次) / (总可用节次)
   * 这是一个复杂的统计，这里提供一个简化的按预约数量统计
   * @param {string} startDate 
   * @param {string} endDate 
   * @param {string} groupBy - roomType | building | weekday
   * @param {Object} filters
   * @param {number} filters.buildingId
   * @param {number} filters.roomTypeId
   */
  async getRoomUsageStats(startDate, endDate, groupBy = 'roomType', filters = {}) {
    const gb = groupBy || 'roomType'
    if (!['roomType', 'building', 'weekday'].includes(gb)) {
      throw new Error('groupBy is invalid')
    }

    const roomWhere = {}
    const allowedIds = Array.isArray(filters.allowedBuildingIds)
      ? filters.allowedBuildingIds.map((x) => parseInt(x)).filter((x) => Number.isFinite(x))
      : []
    if (allowedIds.length > 0) roomWhere.building_id = { [Op.in]: allowedIds }
    if (filters.buildingId) {
      if (allowedIds.length > 0 && !allowedIds.includes(filters.buildingId)) {
        roomWhere.building_id = -1
      } else {
        roomWhere.building_id = filters.buildingId
      }
    }
    if (filters.roomTypeId) roomWhere.room_type_id = filters.roomTypeId

    const includeRoom = {
      model: Room,
      attributes: [],
      include: [
        { model: Building, attributes: [] },
        { model: RoomType, attributes: [] }
      ],
      where: Object.keys(roomWhere).length > 0 ? roomWhere : undefined,
      required: Object.keys(roomWhere).length > 0
    }

    const where = {
      date: { [Op.between]: [startDate, endDate] },
      status: 'approved'
    }

    let groupCol = null
    let attributes = []
    let group = []

    if (gb === 'roomType') {
      groupCol = sequelize.col('Room.RoomType.name')
      attributes = [
        [groupCol, 'roomTypeName'],
        [sequelize.fn('COUNT', sequelize.col('Reservation.id')), 'count']
      ]
      group = [groupCol]
    } else if (gb === 'building') {
      groupCol = sequelize.col('Room.Building.name')
      attributes = [
        [groupCol, 'buildingName'],
        [sequelize.fn('COUNT', sequelize.col('Reservation.id')), 'count']
      ]
      group = [groupCol]
    } else if (gb === 'weekday') {
      groupCol = sequelize.fn('WEEKDAY', sequelize.col('Reservation.date'))
      attributes = [
        [groupCol, 'weekday'],
        [sequelize.fn('COUNT', sequelize.col('Reservation.id')), 'count']
      ]
      group = [groupCol]
    }

    const raw = await Reservation.findAll({
      attributes,
      include: [includeRoom],
      where,
      group,
      raw: true
    })

    const weekdayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    const result = raw.map((x) => {
      if (gb === 'roomType') {
        return { ...x, label: x.roomTypeName || '—' }
      }
      if (gb === 'building') {
        return { ...x, label: x.buildingName || '—' }
      }
      const idx = parseInt(x.weekday)
      const name = Number.isFinite(idx) && idx >= 0 && idx <= 6 ? weekdayNames[idx] : '—'
      return { ...x, weekdayName: name, label: name }
    })

    if (gb === 'weekday') {
      result.sort((a, b) => (parseInt(a.weekday) || 0) - (parseInt(b.weekday) || 0))
    } else {
      result.sort((a, b) => (parseInt(b.count) || 0) - (parseInt(a.count) || 0))
    }

    return result
  }

  /**
   * 导出预约记录 (用于报表)
   */
  async exportReservationRecords(query = {}) {
    const {
      startDate,
      endDate,
      status,
      buildingId,
      roomTypeId,
      keyword,
      page = 1,
      pageSize = 50,
      exportAll = false,
      allowedBuildingIds
    } = query

    if (!startDate || !endDate) throw new Error('startDate and endDate are required')

    const limit = exportAll ? undefined : Math.min(Math.max(parseInt(pageSize) || 50, 1), 200)
    const offset = exportAll ? undefined : (Math.max(parseInt(page) || 1, 1) - 1) * limit

    const where = {
      date: { [Op.between]: [startDate, endDate] }
    }
    if (status) where.status = status

    if (keyword) {
      const kw = `%${String(keyword).trim()}%`
      where[Op.or] = [
        { '$Room.room_number$': { [Op.like]: kw } },
        { '$User.name$': { [Op.like]: kw } },
        { '$User.email$': { [Op.like]: kw } }
      ]
    }

    const roomWhere = {}
    const allowedIds = Array.isArray(allowedBuildingIds)
      ? allowedBuildingIds.map((x) => parseInt(x)).filter((x) => Number.isFinite(x))
      : []
    if (allowedIds.length > 0) roomWhere.building_id = { [Op.in]: allowedIds }
    if (buildingId) {
      if (allowedIds.length > 0 && !allowedIds.includes(buildingId)) {
        roomWhere.building_id = -1
      } else {
        roomWhere.building_id = buildingId
      }
    }
    if (roomTypeId) roomWhere.room_type_id = roomTypeId

    const queryOptions = {
      where,
      include: [
        { model: User, attributes: ['id', 'name', 'email', 'role'] },
        {
          model: Room,
          include: [Building, RoomType],
          where: Object.keys(roomWhere).length > 0 ? roomWhere : undefined,
          required: Object.keys(roomWhere).length > 0
        },
        { model: TimeSlot, attributes: ['id', 'start_time', 'end_time'] },
        {
          model: ReservationAudit,
          limit: 1,
          order: [['createdAt', 'DESC']],
          include: [{ model: Admin, include: [{ model: User, attributes: ['id', 'name', 'email', 'role'] }] }]
        }
      ],
      order: [['date', 'ASC'], ['time_slot_id', 'ASC']]
    }

    if (!exportAll) {
      queryOptions.limit = limit
      queryOptions.offset = offset
    }

    if (exportAll) {
      const rows = await Reservation.findAll(queryOptions)
      return { list: rows, total: rows.length, page: 1, pageSize: rows.length }
    }

    const { rows, count } = await Reservation.findAndCountAll(queryOptions)
    return { list: rows, total: count, page: Math.max(parseInt(page) || 1, 1), pageSize: limit }
  }
}

export default new StatisticsService();
