import { pool } from '../config/database.js'

export const Grupo = {
    getGrupos: async (escuela_id, ciclo_id) => {
        let query = `
        SELECT 
          g.id,
          g.nombre,
          g.escuela_id,
          g.ciclo_id,
          e.nombre as escuela,
          c.nombre as ciclo
        FROM grupos g
        JOIN escuelas e ON g.escuela_id = e.id
        JOIN ciclos c ON g.ciclo_id = c.id
        WHERE 1=1
      `
      const params = []
  
      if (escuela_id) {
        query += ' AND g.escuela_id = ?'
        params.push(escuela_id)
      }
  
      if (ciclo_id) {
        query += ' AND g.ciclo_id = ?'
        params.push(ciclo_id)
      }
  
      query += ' ORDER BY e.nombre, c.nombre, g.nombre'
  
      const [grupos] = await pool.execute(query, params)
      return grupos
    },

    getGrupoById: async (id) => {
        const [grupo] = await pool.execute(`
            SELECT 
            g.id,
            g.nombre,
            g.escuela_id,
            g.ciclo_id,
            e.nombre as escuela,
            c.nombre as ciclo
            FROM grupos g
            JOIN escuelas e ON g.escuela_id = e.id
            JOIN ciclos c ON g.ciclo_id = c.id
            WHERE g.id = ?
        `, [id])
        return grupo[0] || null
    }
}