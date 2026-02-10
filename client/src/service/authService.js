import request from './request.js';

export default {
  // 注册
  register(data) {
    return request.post('/auth/register', data);
  },

  // 登录
  login(data) {
    return request.post('/auth/login', data);
  },

  // 获取当前用户信息
  whoami() {
    return request.get('/auth/whoami');
  }
};
