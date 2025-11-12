import jwt from 'jsonwebtoken'

if (!process.env.JWT_SECRET) {
  throw new Error('❌ JWT_SECRET no está definido en las variables de entorno')
}

const JWT_SECRET = process.env.JWT_SECRET

export const authenticateToken = (req, res, next) => {

  const authHeader = req.get('Authorization')
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token requerido'
    })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('❌ JWT verify error:', err)
      const message = err.name === 'TokenExpiredError'
        ? 'Token expirado'
        : 'Token inválido'
      return res.status(401).json({
        message
      })
    }

    req.user = user
    next()
  })
}