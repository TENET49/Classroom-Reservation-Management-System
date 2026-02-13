import express from 'express'
import { getErr, getResult } from '../getSendResult.js'
import scheduleService from '../../services/scheduleService.js'
import { TimeSlot } from '../../models/index.js'

const router = express.Router()

router.get('/teacher/conflict', async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(403).send(getErr('token 不能为空', 403))
    }
    const { date, timeSlotId } = req.query
    if (!date || !timeSlotId) {
      return res.send(getErr('date and timeSlotId are required', 400))
    }
    const conflict = await scheduleService.checkTeacherConflict(req.userId, date, parseInt(timeSlotId))
    res.send(getResult({ conflict }))
  } catch (error) {
    console.error(error)
    res.send(getErr(error.message))
  }
})

router.get('/teacher/free-slots', async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(403).send(getErr('token 不能为空', 403))
    }
    const { date } = req.query
    if (!date) {
      return res.send(getErr('date is required', 400))
    }

    const slots = await TimeSlot.findAll({ attributes: ['id'], order: [['id', 'ASC']] })
    const freeTimeSlotIds = []

    for (const s of slots) {
      const conflict = await scheduleService.checkTeacherConflict(req.userId, date, s.id)
      if (!conflict) freeTimeSlotIds.push(s.id)
    }

    res.send(getResult({ freeTimeSlotIds }))
  } catch (error) {
    console.error(error)
    res.send(getErr(error.message))
  }
})

export default router
