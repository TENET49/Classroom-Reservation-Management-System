import request from './request.js';

export default {
  // 审核预约
  // data: { action, reason, adminId? }
  auditReservation(id, data) {
    return request.post(`/admin/reservations/${id}/audit`, data);
  },

  // 待审核预约列表
  // params: { page, pageSize, date, buildingId, roomTypeId, keyword }
  getPendingReservations(params) {
    return request.get('/admin/reservations/pending', { params });
  },

  // 审核历史
  // params: { page, pageSize, action, startDate, endDate, keyword }
  getAuditHistory(params) {
    return request.get('/admin/audits', { params });
  },

  // 系统日志
  // params: { page, pageSize, userId, action, targetType, targetId, startDate, endDate, keyword }
  getSystemLogs(params) {
    return request.get('/admin/system-logs', { params });
  },

  // 导出预约记录（预览/导出）
  // params: { startDate, endDate, status, buildingId, roomTypeId, keyword, page, pageSize, exportAll }
  exportReservationRecords(params) {
    return request.get('/admin/reservations/export', { params });
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
