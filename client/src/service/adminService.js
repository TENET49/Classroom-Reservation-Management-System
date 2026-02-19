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

  // 用户列表（用于下拉框）
  // params: { role, keyword }
  getUsers(params) {
    return request.get('/admin/users', { params });
  },

  // 用户管理（系统管理员）
  // params: { page, pageSize, role, keyword }
  getManagedUsers(params) {
    return request.get('/admin/user-management/users', { params });
  },

  // 创建用户（系统管理员）
  createManagedUser(data) {
    return request.post('/admin/user-management/users', data);
  },

  // 更新用户（系统管理员）
  updateManagedUser(id, data) {
    return request.put(`/admin/user-management/users/${id}`, data);
  },

  // 删除用户（系统管理员）
  deleteManagedUser(id) {
    return request.delete(`/admin/user-management/users/${id}`);
  },

  // 导出预约记录（预览/导出）
  // params: { startDate, endDate, status, buildingId, roomTypeId, keyword, page, pageSize, exportAll }
  exportReservationRecords(params) {
    return request.get('/admin/reservations/export', { params });
  },

  // 导入教师占用事项
  importTeacherSchedules(data) {
    return request.post('/admin/import/teacher-schedules', data);
  },

  // 导入课程表
  importCourses(data) {
    return request.post('/admin/import/courses', data);
  },

  // 占用状态总览
  // params: { date, buildingId, roomTypeId }
  getOccupancy(params) {
    return request.get('/admin/occupancy', { params });
  },

  // 获取利用率统计
  // params: { startDate, endDate }
  getUsageStats(params) {
    return request.get('/admin/stats/usage', { params });
  },

  // 统计页看板指标
  // params: { startDate, endDate, buildingId, roomTypeId, today }
  getDashboardStats(params) {
    return request.get('/admin/stats/dashboard', { params });
  }
};
