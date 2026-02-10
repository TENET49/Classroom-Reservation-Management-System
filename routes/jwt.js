const secret = Buffer.from('rno9thw219qw0elh')
const cookieKey = "token"
import jwt from 'jsonwebtoken'

// 颁发 jwt
 function publish (res, maxAge = 3600 * 24, info = {}) {
  const token = jwt.sign(info, secret, {
    expiresIn: maxAge
  })
  // 添加其他传输
  res.header("Authorization", token)
}

function verify (req, res, next) {
  let token = req.headers.authorization
  if (!token) {
    return null
  }
  token = token.split(" ")
  token = token.length === 1 ? token[0] : token[1]
  
  try {
    const result = jwt.verify(token, secret)
    return result
  } catch {
    return null
  }
}

export default { publish, verify }
