import express from 'express';
import { getErr, getResult } from '../getSendResult.js';
import userService from '../../services/userService.js';
import jwt from '../jwt.js';
const router = express.Router();

/**
 * 用户注册
 * POST /register
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.send(getErr('name, email and password are required', 400));
    }
    const result = await userService.createUser({
      name, email, password, role
    });
    // 不返回密码哈希
    const user = result.toJSON();
    delete user.password_hash;

    res.send(getResult(user));
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

/**
 * 用户登录
 * POST /login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.send(getErr('email and password are required', 400));
    }
    const user = await userService.login(email, password);
    jwt.publish(res, 3600 * 24, { id: user.id, role: user.role });

    res.send(getResult({
      token: res.getHeader('Authorization'),
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    }));
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message, 401));
  }
});

/**
 * 获取当前用户信息 (WhoAmI)
 * GET /whoami
 */
router.get('/whoami', async (req, res) => {
  try {
    // req.userId 由 tokenMiddleware 注入
    if (!req.userId) {
      return res.send(getErr('未登录', 401));
    }
    const user = await userService.getUserById(req.userId);
    if (!user) {
      return res.send(getErr('用户不存在', 404));
    }
    const userData = user.toJSON();
    delete userData.password_hash;

    res.send(getResult(userData));
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

export default router;
