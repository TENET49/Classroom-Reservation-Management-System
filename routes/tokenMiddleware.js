import { getErr } from './getSendResult.js'
import { match } from 'path-to-regexp'
import jwt from './jwt.js'

const needTokenApi = [
  // 教室管理 - 仅管理员
  { method: "POST", path: "/api/room", roles: ['admin'] },
  { method: "PUT", path: "/api/room/:id", roles: ['admin'] },
  { method: "DELETE", path: "/api/room/:id", roles: ['admin'] },
  { method: "POST", path: "/api/room/building", roles: ['admin'] },
  { method: "GET", path: "/api/room/buildings", roles: ['admin'] },
  { method: "PUT", path: "/api/room/building/:id", roles: ['admin'] },
  { method: "DELETE", path: "/api/room/building/:id", roles: ['admin'] },
  { method: "POST", path: "/api/room/room-type", roles: ['admin'] },
  { method: "GET", path: "/api/room/room-types", roles: ['admin'] },
  { method: "PUT", path: "/api/room/room-type/:id", roles: ['admin'] },
  { method: "DELETE", path: "/api/room/room-type/:id", roles: ['admin'] },
  { method: "POST", path: "/api/room/unavailable", roles: ['admin'] },
  { method: "GET", path: "/api/room/unavailable", roles: ['admin'] },
  { method: "DELETE", path: "/api/room/unavailable/:id", roles: ['admin'] },

  // 教室查询 - 所有人
  { method: "GET", path: "/api/room/available" },
  { method: "GET", path: "/api/room/all" },
  { method: "GET", path: "/api/room/:id" },
  { method: "GET", path: "/api/room/:id/schedule" },

  // 预约业务 - 所有人 (但通常学生/老师用)
  { method: "POST", path: "/api/reservations" },
  { method: "GET", path: "/api/reservations/my" },
  { method: "POST", path: "/api/reservations/:id/cancel" },

  // 管理员业务 - 仅管理员
  { method: "POST", path: "/api/admin/reservations/:id/audit", roles: ['admin'] },
  { method: "GET", path: "/api/admin/reservations/pending", roles: ['admin'] },
  { method: "GET", path: "/api/admin/audits", roles: ['admin'] },
  { method: "GET", path: "/api/admin/system-logs", roles: ['admin'] },
  { method: "GET", path: "/api/admin/users", roles: ['admin'] },
  { method: "GET", path: "/api/admin/reservations/export", roles: ['admin'] },
  { method: "GET", path: "/api/admin/occupancy", roles: ['admin'] },
  { method: "POST", path: "/api/admin/import/teacher-schedules", roles: ['admin'] },
  { method: "POST", path: "/api/admin/import/courses", roles: ['admin'] },
  { method: "GET", path: "/api/admin/stats/usage", roles: ['admin'] },

  // 教师课表
  { method: "GET", path: "/api/schedule/teacher/conflict", roles: ['teacher'] },
  { method: "GET", path: "/api/schedule/teacher/free-slots", roles: ['teacher'] },

  // 认证相关
  { method: "GET", path: "/api/auth/whoami" },
]

export default (req, res, next) => {
  const apis = needTokenApi.filter(api => {
    const matcher = match(api.path, { decode: decodeURIComponent })
    return api.method === req.method && matcher(req.path)
  })

  if (apis.length === 0) {
    next()
    return
  }

  const result = jwt.verify(req)
  if (result) {
    // 认证成功
    req.userId = result.id
    req.userRole = result.role // 假设 JWT payload 里有 role 字段

    // === 鉴权 (Authorization) ===
    // 检查该接口是否配置了角色限制
    const matchedApi = apis[0]; // 取第一个匹配的规则
    if (matchedApi.roles && matchedApi.roles.length > 0) {
      if (!matchedApi.roles.includes(result.role)) {
        return res.status(403).send(getErr('无权访问此接口', 403));
      }
    }

    next()
  } else {
    // 认证失败
    handleNonToken(req, res, next)
  }
}

// 没有认证的情况
function handleNonToken(req, res, next) {
  res.status(403).send(getErr('token 不能为空', 403))
}
