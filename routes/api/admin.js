import express from 'express';
import { getErr, getResult } from '../getSendResult.js';
import reservationService from '../../services/reservationService.js';
import scheduleService from '../../services/scheduleService.js';
import statisticsService from '../../services/statisticsService.js';

const router = express.Router();

/**
 * 审核预约
 * POST /reservations/:id/audit
 */
router.post('/reservations/:id/audit', async (req, res) => {
  try {
    const { adminId, action, reason } = req.body;
    if (!adminId || !action) {
      return res.send(getErr('adminId and action are required', 400));
    }
    const result = await reservationService.auditReservation(
      adminId, req.params.id, action, reason
    );
    res.send(getResult(result));
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

/**
 * 导入教师课表
 * POST /import/teacher-schedules
 */
router.post('/import/teacher-schedules', async (req, res) => {
  try {
    const schedules = req.body; // 假设直接传 JSON 数组
    if (!Array.isArray(schedules)) {
      return res.send(getErr('Body must be an array', 400));
    }
    const result = await scheduleService.importTeacherSchedules(schedules);
    res.send(getResult(result));
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

/**
 * 导入课程表
 * POST /import/courses
 */
router.post('/import/courses', async (req, res) => {
  try {
    const courses = req.body;
    if (!Array.isArray(courses)) {
      return res.send(getErr('Body must be an array', 400));
    }
    const result = await scheduleService.importCourses(courses);
    res.send(getResult(result));
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

/**
 * 获取教室利用率统计
 * GET /stats/usage
 */
router.get('/stats/usage', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.send(getErr('startDate and endDate are required', 400));
    }
    const result = await statisticsService.getRoomUsageStats(startDate, endDate);
    res.send(getResult(result));
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

export default router;
