import express from 'express';
import { getErr, getResult } from '../getSendResult.js';
import roomService from '../../services/roomService.js';

const router = express.Router();

/**
 * 查询可用教室
 * GET /available
 * Query: date, timeSlotId, roomTypeId, capacity
 */
router.get('/available', async (req, res) => {
  try {
    const { date, timeSlotId, roomTypeId, capacity } = req.query;
    if (!date || !timeSlotId) {
      return res.send(getErr('date and timeSlotId are required', 400));
    }
    const result = await roomService.getAvailableRooms({
      date,
      timeSlotId: parseInt(timeSlotId),
      roomTypeId: roomTypeId ? parseInt(roomTypeId) : undefined,
      capacity: capacity ? parseInt(capacity) : undefined
    });
    res.send(getResult(result));
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

/**
 * 获取所有教室 (支持分页)
 * GET /all
 * Query: page, pageSize, buildingId, roomTypeId
 */
router.get('/all', async (req, res) => {
  try {
    const result = await roomService.getAllRooms(req.query);
    res.send(getResult(result));
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

/**
 * 获取楼栋列表 (管理员)
 * GET /buildings
 * Query: page, pageSize, keyword
 */
router.get('/buildings', async (req, res) => {
  try {
    const result = await roomService.getBuildings(req.query);
    res.send(getResult(result));
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

/**
 * 获取教室类型列表 (管理员)
 * GET /room-types
 * Query: page, pageSize, keyword
 */
router.get('/room-types', async (req, res) => {
  try {
    const result = await roomService.getRoomTypes(req.query);
    res.send(getResult(result));
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

router.get('/unavailable', async (req, res) => {
  try {
    const result = await roomService.listRoomUnavailables(req.query)
    res.send(getResult(result))
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

router.delete('/unavailable/:id', async (req, res) => {
  try {
    const result = await roomService.deleteRoomUnavailable(req.params.id)
    res.send(getResult(result))
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

/**
 * 获取教室详情
 * GET /:id
 */
router.get('/:id', async (req, res) => {
  try {
    const result = await roomService.getRoomDetails(req.params.id);
    if (!result) {
      return res.send(getErr('Room not found', 404));
    }
    res.send(getResult(result));
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

/**
 * 获取教室详细状态 (课表+预约+状态)
 * GET /:id/schedule
 * Query: date
 */
router.get('/:id/schedule', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.send(getErr('date is required', 400));
    }
    const result = await roomService.getRoomSchedule(req.params.id, date);
    res.send(getResult(result));
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

/**
 * 创建教室 (管理员)
 * POST /
 */
router.post('/', async (req, res) => {
  try {
    const result = await roomService.createRoom(req.body);
    res.send(getResult(result));
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

/**
 * 创建楼栋 (管理员)
 * POST /building
 */
router.post('/building', async (req, res) => {
  try {
    const result = await roomService.createBuilding(req.body);
    res.send(getResult(result));
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

/**
 * 更新楼栋 (管理员)
 * PUT /building/:id
 */
router.put('/building/:id', async (req, res) => {
  try {
    const result = await roomService.updateBuilding(req.params.id, req.body);
    res.send(getResult(result));
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

/**
 * 删除楼栋 (管理员)
 * DELETE /building/:id
 */
router.delete('/building/:id', async (req, res) => {
  try {
    const result = await roomService.deleteBuilding(req.params.id);
    res.send(getResult(result));
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

/**
 * 创建教室类型 (管理员)
 * POST /room-type
 */
router.post('/room-type', async (req, res) => {
  try {
    const result = await roomService.createRoomType(req.body);
    res.send(getResult(result));
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

/**
 * 更新教室类型 (管理员)
 * PUT /room-type/:id
 */
router.put('/room-type/:id', async (req, res) => {
  try {
    const result = await roomService.updateRoomType(req.params.id, req.body);
    res.send(getResult(result));
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

/**
 * 删除教室类型 (管理员)
 * DELETE /room-type/:id
 */
router.delete('/room-type/:id', async (req, res) => {
  try {
    const result = await roomService.deleteRoomType(req.params.id);
    res.send(getResult(result));
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

/**
 * 更新教室 (管理员)
 * PUT /:id
 */
router.put('/:id', async (req, res) => {
  try {
    const result = await roomService.updateRoom(req.params.id, req.body);
    res.send(getResult(result));
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

/**
 * 删除教室 (管理员)
 * DELETE /:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await roomService.deleteRoom(req.params.id);
    res.send(getResult(result));
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

/**
 * 设置教室不可用 (管理员)
 * POST /unavailable
 */
router.post('/unavailable', async (req, res) => {
  try {
    const result = await roomService.setRoomUnavailable(req.body);
    res.send(getResult(result));
  } catch (error) {
    console.error(error);
    res.send(getErr(error.message));
  }
});

export default router;
