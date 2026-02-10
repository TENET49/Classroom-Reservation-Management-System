import express from 'express';
import { getErr, getResult } from '../getSendResult.js';
import userService from '../../services/userService.js';

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
    // 简单模拟 Token
    const token = 'mock-jwt-token-' + user.id;
    
    res.send(getResult({
      token,
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

export default router;
