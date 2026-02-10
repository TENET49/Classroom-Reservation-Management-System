import axios from 'axios';

// 创建 axios 实例
const instance = axios.create({
  baseURL: '/api', // 配合 Vite/Webpack 代理，或者写死 http://localhost:5010/api
  timeout: 5000
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 1. 发送请求的时候，如果有 token, 就添加到请求头中
    const token = localStorage.getItem('token');
    if (token) {
      // 注意：后端 jwt.js 直接 verify(token)，并没有处理 "Bearer " 前缀
      // 所以这里直接传 token 字符串即可，不需要加 Bearer 前缀
      // 如果后端支持 Bearer，则用 `Bearer ${token}`
      config.headers.authorization = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    // 2. 响应的时候，如果有 token, 保存 token 到本地（localStorage）
    // 后端 auth.js 返回体里也有 token，这里双重保险
    const authHeader = response.headers['authorization'];
    if (authHeader) {
      localStorage.setItem('token', authHeader);
    }

    // 统一解包：如果后端返回 { code: 0, data: ..., msg: ... }
    // 我们直接返回 response.data，方便业务层调用
    return response.data;
  },
  (error) => {
    // 3. 响应的时候，如果消息码是 403 (Forbidden) 或 401 (Unauthorized)
    if (error.response) {
      if (error.response.status === 403 || error.response.status === 401) {
        localStorage.removeItem('token');
        // 可选：重定向到登录页
        // window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
