import { TeacherSchedule, Course, User, Room, TimeSlot } from '../models/index.js';
import { Op } from 'sequelize';

class ScheduleService {
  /**
   * 导入教师课表 (用于判断教师是否繁忙)
   * @param {Array} schedules - 课表数据数组
   */
  async importTeacherSchedules(schedules) {
    // 批量创建，实际逻辑可能需要先清除旧数据或进行更新
    return await TeacherSchedule.bulkCreate(schedules);
  }

  /**
   * 导入教室课程表 (用于判断教室占用)
   * @param {Array} courses - 课程数据数组
   */
  async importCourses(courses) {
    return await Course.bulkCreate(courses);
  }

  /**
   * 检查教师在指定时间段是否有课
   * @param {number} teacherId - 教师ID
   * @param {string} date - 日期 (YYYY-MM-DD)
   * @param {number} timeSlotId - 节次ID
   * @returns {Promise<boolean>} - true表示有冲突(忙)，false表示空闲
   */
  async checkTeacherConflict(teacherId, date, timeSlotId) {
    const [teacherScheduleCount, courseCount] = await Promise.all([
      TeacherSchedule.count({
        where: {
          teacher_id: teacherId,
          date,
          time_slot_id: timeSlotId
        }
      }),
      Course.count({
        where: {
          teacher_id: teacherId,
          date,
          time_slot_id: timeSlotId
        }
      })
    ])

    return teacherScheduleCount > 0 || courseCount > 0
  }

  /**
   * 检查教室在指定时间段是否被课程占用
   * @param {number} roomId - 教室ID
   * @param {string} date - 日期
   * @param {number} timeSlotId - 节次ID
   * @returns {Promise<boolean>} - true表示被占用
   */
  async checkRoomCourseOccupancy(roomId, date, timeSlotId) {
    const count = await Course.count({
      where: {
        room_id: roomId,
        date: date,
        time_slot_id: timeSlotId
      }
    });
    return count > 0;
  }
}

export default new ScheduleService();
