import express from 'express';
import { getErr, getResult } from '../getSendResult.js';
import reservationService from '../../services/reservationService.js';

const router = express.Router();

/**
 * 提交预约申请
 * POST /
 */
router.post('/', async (req, res) => {
  try {
    const { userId, roomId, date, timeSlotId, peopleCount } = req.body;
    if (!userId || !roomId || !date || !timeSlotId || !peopleCount) {
      return res.send(getErr('Missing required fields', 400));
    }
    const result = await reservationService.createReservation({
      userId, roomId, date, timeSlotId, peopleCount
    });
    res.send(getResult(result));
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

/**
 * 我的预约列表
 * GET /my
 * Query: userId
 */
router.get('/my', async (req, res) => {
  try {
    // 实际应从 Token 获取 userId，这里暂时从 Query 获取用于测试
    const userId = req.query.userId;
    if (!userId) {
      return res.send(getErr('userId is required', 400));
    }
    const result = await reservationService.getUserReservations(userId);
    res.send(getResult(result));
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

/**
 * 取消预约
 * POST /:id/cancel
 * Body: userId
 */
router.post('/:id/cancel', async (req, res) => {
  try {
    if (!req.body) {
      return res.send(getErr('Request body is missing', 400));
    }
    const { userId } = req.body; // 同样，实际应从 Token 获取
    if (!userId) {
      return res.send(getErr('userId is required', 400));
    }
    const result = await reservationService.cancelReservation(userId, req.params.id);
    res.send(getResult(result));
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

export default router;
