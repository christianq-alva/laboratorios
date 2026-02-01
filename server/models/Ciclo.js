import { pool } from '../config/database.js'
import { handleDBError } from '../utils/handleDBError.js'

export const Ciclo = {
  getCiclos: async () => {
    try {
      const [ciclos] = await pool.execute(`
        SELECT id, nombre,
               CAST(SUBSTRING_INDEX(nombre, ' ', -1) AS UNSIGNED) as numero_ciclo
        FROM ciclos
        ORDER BY numero_ciclo ASC
      `)
      return ciclos
    } catch (error) {
      handleDBError(error, 'Ciclo')
    }
  },

  getById: async (id) => {
    try {
      const [rows] = await pool.execute(
        `SELECT id, nombre,
                CAST(SUBSTRING_INDEX(nombre, ' ', -1) AS UNSIGNED) as numero_ciclo
         FROM ciclos WHERE id = ?`,
        [id]
      )
      return rows[0] || null
    } catch (error) {
      handleDBError(error, 'Ciclo')
    }
  }
}