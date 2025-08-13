import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'mi_clave_super_secreta_123'

export const authenticateToken = (req, res, next) => {
  // 🔍 BUSCAR EL TOKEN EN LOS HEADERS
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // "Bearer TOKEN123"

  // Logs de diagnóstico
  if (!authHeader) {
    console.warn('🔒 Authorization header no presente')
  } else {
    console.log('🔒 Authorization header recibido:', authHeader.split(' ')[0], 'token_len=', token ? token.length : 0)
  }
  
  if (!token) {
    return res.status(401).json({ message: 'Token requerido' })
  }

  // ✅ VERIFICAR SI EL TOKEN ES VÁLIDO
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('❌ JWT verify error:', err.name, err.message)
      return res.status(403).json({ message: 'Token inválido o expirado' })
    }

    console.log('✅ JWT verificado. userId=', user.userId, 'rol=', user.rol)
    // 🎯 GUARDAR INFO DEL USUARIO EN LA REQUEST
    req.user = user
    next() // Continuar con la siguiente función
  })
}