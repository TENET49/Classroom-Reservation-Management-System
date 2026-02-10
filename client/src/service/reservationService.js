import request from './request.js';

export default {
  // 提交预约
  createReservation(data) {
    return request.post('/reservations', data);
  },

  // 我的预约
  // params: { userId } (实际应从 token 取，但目前接口可能需要传)
  getMyReservations(params) {
    return request.get('/reservations/my', { params });
  },

  // 取消预约
  cancelReservation(id, data) {
    // data: { userId }
    return request.post(`/reservations/${id}/cancel`, data);
  }
};
