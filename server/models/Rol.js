import { pool } from '../config/database.js'
import { handleDBError } from '../utils/handleDBError.js'

export const Rol = {
  getAll: async () => {
    try {
      const [roles] = await pool.execute(`
        SELECT id, nombre FROM roles
      `)
      return roles
    } catch (error) {
      handleDBError(error, 'Rol')
    }
  },

  getById: async (id) => {
    try {
      const [rows] = await pool.execute(`
        SELECT id, nombre FROM roles WHERE id = ?
      `, [id])
      return rows[0] || null
    } catch (error) {
      handleDBError(error, 'Rol')
    }
  }
}
