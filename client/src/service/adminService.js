import request from './request.js';

export default {
  // 审核预约
  // data: { adminId, action, reason }
  auditReservation(id, data) {
    return request.post(`/admin/reservations/${id}/audit`, data);
  },

  // 导入教师课表
  importTeacherSchedules(data) {
    return request.post('/admin/import/teacher-schedules', data);
  },

  // 导入课程表
  importCourses(data) {
    return request.post('/admin/import/courses', data);
  },

  // 获取利用率统计
  // params: { startDate, endDate }
  getUsageStats(params) {
    return request.get('/admin/stats/usage', { params });
  }
};
