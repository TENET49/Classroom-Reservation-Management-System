import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import roomRouter from './api/room.js'
import authRouter from './api/auth.js'
import reservationRouter from './api/reservation.js'
import adminRouter from './api/admin.js'

const app = express()

// 获取静态资源目录
const staticPath = fileURLToPath(
  new URL('../public', import.meta.url)
)
app.use(express.static(staticPath))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// 处理 api 的请求

app.use('/api/room', roomRouter)
app.use('/api/auth', authRouter)
app.use('/api/reservations', reservationRouter)
app.use('/api/admin', adminRouter)


const port = 5010
app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})