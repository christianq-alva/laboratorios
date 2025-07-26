import { pool } from '../config/database.js'

export const User = {
  findByCredentials: async (usuario, contrasena) => {
    // Primero obtener datos básicos del usuario
    const userQuery = `
      SELECT 
        u.id,
        u.nombre_completo,
        u.usuario,
        r.id as rol_id,
        r.nombre as rol_nombre
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE u.usuario = ? AND u.contrasena = ?
    `;
    
    const [userRows] = await pool.execute(userQuery, [usuario, contrasena])
    
    if (userRows.length === 0) {
      return null
    }
    
    const user = userRows[0]
    
    // Si es Jefe de Laboratorio, obtener TODOS sus laboratorios
    if (user.rol_nombre === 'Jefe de Laboratorio') {
      const labQuery = `
        SELECT laboratorio_id 
        FROM jefe_laboratorio 
        WHERE usuario_id = ?
      `;
      
      const [labRows] = await pool.execute(labQuery, [user.id])
      user.laboratorio_ids = labRows.map(row => row.laboratorio_id) // ← Array de IDs
    } else {
      user.laboratorio_ids = [] // No es jefe, no tiene laboratorios
    }
    

    return user
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