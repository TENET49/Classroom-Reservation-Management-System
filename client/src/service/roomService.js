import request from './request.js';

export default {
  // 查询可用教室
  // params: { date, timeSlotId, roomTypeId, capacity }
  getAvailableRooms(params) {
    return request.get('/room/available', { params });
  },

  // 获取所有教室 (分页)
  // params: { page, pageSize, buildingId, roomTypeId }
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

  // 创建楼栋
  createBuilding(data) {
    return request.post('/room/building', data);
  },

  // 创建教室类型
  createRoomType(data) {
    return request.post('/room/room-type', data);
  },

  // 设置教室不可用
  setRoomUnavailable(data) {
    return request.post('/room/unavailable', data);
  }
};
