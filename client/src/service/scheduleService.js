import request from './request.js'

export default {
  checkTeacherConflict(params) {
    return request.get('/schedule/teacher/conflict', { params })
  },
  getTeacherFreeSlots(params) {
    return request.get('/schedule/teacher/free-slots', { params })
  },
}

