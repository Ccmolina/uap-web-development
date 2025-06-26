import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

export function verificarToken(req, res, next) {
  let token = null

  // ✅ Buscar primero en el encabezado Authorization
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1]
  }

  // 🔄 Si no está en header, buscar en cookies
  if (!token && req.cookies?.token) {
    token = req.cookies.token
  }

  if (!token) {
    return res.status(401).json({ mensaje: 'Acceso denegado. Token no proporcionado.' })
  }

  try {
    const verificado = jwt.verify(token, process.env.JWT_SECRET)
    req.usuario = verificado
    next()
  } catch (error) {
    res.status(400).json({ mensaje: 'Token inválido.' })
  }
}
