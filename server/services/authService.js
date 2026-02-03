import jwt from 'jsonwebtoken'
import { AppError } from '../utils/errors.js'
import { User } from '../models/User.js'

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = '12h'

/**
 * Autenticar usuario y generar token.
 * Valida credenciales, estado activo y devuelve usuario y token.
 * La autorización es por rol (tabla roles); no se usan tablas permisos/rol_permiso.
 */
export async function login(usuario, contrasena) {
  const user = await User.findByCredentials(usuario, contrasena)

  if (!user) {
    throw new AppError('Credenciales incorrectas', 401)
  }

  if (user.estado === 'I') {
    throw new AppError('Usuario inactivo. Contacte al administrador.', 401)
  }

  const token = jwt.sign(
    {
      userId: user.id,
      usuario: user.usuario,
      rol: user.rol_nombre,
      laboratorio_ids: user.laboratorio_ids || []
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )

  return {
    user: {
      id: user.id,
      nombre: user.nombre_completo,
      usuario: user.usuario,
      rol: user.rol_nombre,
      laboratorio_ids: user.laboratorio_ids
    },
    token
  }
}

/**
 * Obtener payload del perfil para el usuario autenticado (req.user).
 */
export function getProfile(reqUser) {
  return {
    message: `Hola ${reqUser.usuario}! Estás autenticado`,
    user: reqUser
  }
}
