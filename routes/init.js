import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import roomRouter from './api/room.js'
import authRouter from './api/auth.js'
import reservationRouter from './api/reservation.js'
import adminRouter from './api/admin.js'
import scheduleRouter from './api/schedule.js'
import cors from 'cors'
import { ensureSchema } from '../models/ensureSchema.js'

const app = express()

// 获取静态资源目录
const staticPath = fileURLToPath(
  new URL('../public', import.meta.url)
)
app.use(express.static(staticPath))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// 加入 cors 中间件
app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      callback(null, "*")
      return
    }
    callback(null, origin)
  },
  credentials: true
}))

// 加入 cookie-parser 中间件
import cookieParser from 'cookie-parser'
app.use(cookieParser())

// 加入 token 中间件
import tokenMiddleware from './tokenMiddleware.js'
app.use(tokenMiddleware)

// 处理 api 的请求

app.use('/api/room', roomRouter)
app.use('/api/auth', authRouter)
app.use('/api/reservations', reservationRouter)
app.use('/api/admin', adminRouter)
app.use('/api/schedule', scheduleRouter)


const port = 5010
async function start() {
  await ensureSchema()
  app.listen(port, () => {
    console.log(`Server running on port ${port}`)
  })
}

start().catch((e) => {
  console.error('Server start failed:', e)
  process.exit(1)
})
