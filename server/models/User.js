import { pool } from '../config/database.js'

export const User = {
  // Login con roles y permisos
  findByCredentials: async (usuario, contrasena) => {
    const [rows] = await pool.execute(`
      SELECT 
        u.id,
        u.nombre_completo,
        u.usuario,
        r.id as rol_id,
        r.nombre as rol_nombre
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE u.usuario = ? AND u.contrasena = ?
    `, [usuario, contrasena])
    
    return rows[0]
  },

  // Obtener permisos del usuario
  getUserPermissions: async (rolId) => {
    const [rows] = await pool.execute(`
      SELECT p.nombre, p.ruta
      FROM permisos p
      JOIN rol_permiso rp ON p.id = rp.permiso_id
      WHERE rp.rol_id = ?
    `, [rolId])
    
    return rows
  }
}