import { User } from '../models/User.js'
import jwt from 'jsonwebtoken'
// Clave secreta (en producción va en variables de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'mi_clave_super_secreta_123'
export const login = async (req, res) => {
  try {
    const { usuario, contrasena } = req.body
    const user = await User.findByCredentials(usuario, contrasena)
    if (user) {
      if (user.estado === 'I') {
        res.status(401).json({
          success: false,
          message: 'Usuario inactivo. Contacte al administrador.'
        })
      } else {
        const permisos = await User.getUserPermissions(user.rol_id)
        const token = jwt.sign(
          {
            userId: user.id,
            usuario: user.usuario,
            rol: user.rol_nombre,
            laboratorio_ids: user.laboratorio_ids || []
          },
          JWT_SECRET,
          { expiresIn: '12h' }
        )
        res.status(200).json({
          success: true,
          user: {
            id: user.id,
            nombre: user.nombre_completo,
            usuario: user.usuario,
            rol: user.rol_nombre,
            laboratorio_ids: user.laboratorio_ids
          },
          permisos,
          token
        })
      }
    } else {
      res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    })
  }
}
export const getProfile = async (req, res) => {
  try {
    // req.user viene del middleware authenticateToken
    res.status(200).json({
      success: true,
      message: `Hola ${req.user.usuario}! Estás autenticado`,
      user: req.user
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    })
  }
}