import { Reservation, Room, Building, RoomType, Course, sequelize } from '../models/index.js';
import { Op } from 'sequelize';

class StatisticsService {
  /**
   * 统计教室利用率
   * 利用率 = (课程占用节次 + 预约占用节次) / (总可用节次)
   * 这是一个复杂的统计，这里提供一个简化的按预约数量统计
   * @param {string} startDate 
   * @param {string} endDate 
   */
  async getRoomUsageStats(startDate, endDate) {
    // 统计每种教室类型的预约成功次数
    const stats = await Reservation.findAll({
      attributes: [
        [sequelize.col('Room.RoomType.name'), 'roomTypeName'],
        [sequelize.fn('COUNT', sequelize.col('Reservation.id')), 'count']
      ],
      include: [{
        model: Room,
        attributes: [],
        include: [{
          model: RoomType,
          attributes: []
        }]
      }],
      where: {
        date: {
          [Op.between]: [startDate, endDate]
        },
        status: 'approved'
      },
      group: [sequelize.col('Room.RoomType.name')],
      raw: true
    });

    return stats;
  }

  /**
   * 导出预约记录 (用于报表)
   */
  async exportReservationRecords(startDate, endDate) {
    return await Reservation.findAll({
      where: {
        date: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        { model: User, attributes: ['name', 'role'] },
        { model: Room, include: [Building] }
      ],
      order: [['date', 'ASC']]
    });
  }
}

export default new StatisticsService();
