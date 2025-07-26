import { User } from '../models/User.js'
import jwt from 'jsonwebtoken'

// Clave secreta (en producción va en variables de entorno)
const JWT_SECRET = 'mi_clave_super_secreta_123'

export const login = async (req, res) => {
    try {
      const { usuario, contrasena } = req.body
      
      const user = await User.findByCredentials(usuario, contrasena)
      console.log('🔍 Usuario del modelo:', user); // ← AGREGAR
      
      if (user) {
        const permisos = await User.getUserPermissions(user.rol_id)
        
        console.log('🔍 user.laboratorio_id antes del JWT:', user.laboratorio_id); // ← AGREGAR
        
        const token = jwt.sign(
            { 
              userId: user.id,
              usuario: user.usuario,
              rol: user.rol_nombre,
              laboratorio_ids: user.laboratorio_ids || [] // ← Array en lugar de ID único
            },
            JWT_SECRET,
            { expiresIn: '24h' }
          )
          
          res.json({ 
            success: true, 
            user: {
              id: user.id,
              nombre: user.nombre_completo,
              usuario: user.usuario,
              rol: user.rol_nombre,
              laboratorio_ids: user.laboratorio_ids // ← Array en respuesta
            },
            permisos,
            token
          })
      } else {
        res.json({ success: false, message: 'Credenciales incorrectas' })
      }
    } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: 'Error del servidor' })
    }
  }
  
export const getProfile = async (req, res) => {
    try {
      // req.user viene del middleware authenticateToken
      res.json({
        success: true,
        message: `Hola ${req.user.usuario}! Estás autenticado`,
        user: req.user
      })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error del servidor' })
    }
  }