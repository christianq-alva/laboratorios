import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../config/config.js'

export const authenticateToken = (req, res, next) => {
  // 🔍 BUSCAR EL TOKEN EN LOS HEADERS
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // "Bearer TOKEN123"
  
  if (!token) {
    return res.status(401).json({ message: 'Token requerido' })
  }

  // ✅ VERIFICAR SI EL TOKEN ES VÁLIDO
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido o expirado' })
    }
    
    // 🎯 GUARDAR INFO DEL USUARIO EN LA REQUEST
    req.user = user
    next() // Continuar con la siguiente función
  })
}