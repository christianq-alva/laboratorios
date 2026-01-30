import jwt from 'jsonwebtoken'
import { AppError } from '../utils/errors.js'

if (!process.env.JWT_SECRET) {
  throw new Error('❌ JWT_SECRET no está definido en las variables de entorno')
}

const JWT_SECRET = process.env.JWT_SECRET

export const authenticateToken = (req, res, next) => {

  const authHeader = req.get('Authorization')
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return next(new AppError('Token requerido', 401))
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      const message = err.name === 'TokenExpiredError'
        ? 'Token expirado'
        : 'Token inválido'
      return next(new AppError(message, 401))
    }

    req.user = user
    next()
  })
}