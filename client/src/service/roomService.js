import request from './request.js';

export default {
  // 查询可用教室
  // params: { date, timeSlotId, roomTypeId, capacity }
  getAvailableRooms(params) {
    return request.get('/room/available', { params });
  },

  // 获取所有教室 (分页)
  // params: { page, pageSize, buildingId, roomTypeId, keyword }
  getAllRooms(params) {
    return request.get('/room/all', { params });
  },

  // 获取教室详情
  getRoomDetails(id) {
    return request.get(`/room/${id}`);
  },

  // 获取教室日程状态
  // params: { date }
  getRoomSchedule(id, params) {
    return request.get(`/room/${id}/schedule`, { params });
  },

  // --- 管理员接口 ---

  // 创建教室
  createRoom(data) {
    return request.post('/room', data);
  },

  // 更新教室 (管理员)
  updateRoom(id, data) {
    return request.put(`/room/${id}`, data);
  },

  // 删除教室 (管理员)
  deleteRoom(id) {
    return request.delete(`/room/${id}`);
  },

  // 创建楼栋
  createBuilding(data) {
    return request.post('/room/building', data);
  },

  // 获取楼栋列表 (管理员)
  // params: { page, pageSize, keyword }
  getBuildings(params) {
    return request.get('/room/buildings', { params });
  },

  // 更新楼栋 (管理员)
  updateBuilding(id, data) {
    return request.put(`/room/building/${id}`, data);
  },

  // 删除楼栋 (管理员)
  deleteBuilding(id) {
    return request.delete(`/room/building/${id}`);
  },

  // 创建教室类型
  createRoomType(data) {
    return request.post('/room/room-type', data);
  },

  // 获取教室类型列表 (管理员)
  // params: { page, pageSize, keyword }
  getRoomTypes(params) {
    return request.get('/room/room-types', { params });
  },

  // 更新教室类型 (管理员)
  updateRoomType(id, data) {
    return request.put(`/room/room-type/${id}`, data);
  },

  // 删除教室类型 (管理员)
  deleteRoomType(id) {
    return request.delete(`/room/room-type/${id}`);
  },

  // 设置教室不可用
  setRoomUnavailable(data) {
    return request.post('/room/unavailable', data);
  },

  // 获取不可用记录列表 (管理员)
  // params: { page, pageSize, date, startDate, endDate, roomId, buildingId, timeSlotId, keyword }
  getRoomUnavailables(params) {
    return request.get('/room/unavailable', { params });
  },

  // 删除不可用记录 (管理员)
  deleteRoomUnavailable(id) {
    return request.delete(`/room/unavailable/${id}`);
  }
};
