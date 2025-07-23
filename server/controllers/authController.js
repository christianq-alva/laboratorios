import { User } from '../models/User.js'
import jwt from 'jsonwebtoken'

// Clave secreta (en producción va en variables de entorno)
const JWT_SECRET = 'mi_clave_super_secreta_123'

export const login = async (req, res) => {
  try {
    const { usuario, contrasena } = req.body
    
    const user = await User.findByCredentials(usuario, contrasena)
    
    if (user) {
      const permisos = await User.getUserPermissions(user.rol_id)
      
      // 🎫 AQUÍ CREAMOS EL TOKEN
      const token = jwt.sign(
        { 
          userId: user.id,
          usuario: user.usuario,
          rol: user.rol_nombre 
        },
        JWT_SECRET,
        { expiresIn: '24h' }  // Expira en 24 horas
      )
      
      res.json({ 
        success: true, 
        user: {
          id: user.id,
          nombre: user.nombre_completo,
          usuario: user.usuario,
          rol: user.rol_nombre
        },
        permisos,
        token  // 🎯 ENVIAMOS EL TOKEN AL FRONTEND
      })
    } else {
      res.json({ success: false, message: 'Credenciales incorrectas' })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Error del servidor' })
  }
}