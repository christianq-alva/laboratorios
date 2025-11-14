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
    },

    // Crear un nuevo grupo
    create: async (nombre, escuela_id, ciclo_id) => {
        const [result] = await pool.execute(
            'INSERT INTO grupos (nombre, escuela_id, ciclo_id) VALUES (?, ?, ?)',
            [nombre, escuela_id, ciclo_id]
        )
        return result.insertId
    },

    // Actualizar un grupo
    update: async (id, nombre, escuela_id, ciclo_id) => {
        const [result] = await pool.execute(
            'UPDATE grupos SET nombre = ?, escuela_id = ?, ciclo_id = ? WHERE id = ?',
            [nombre, escuela_id, ciclo_id, id]
        )
        return result.affectedRows
    },

    // Eliminar un grupo
    delete: async (id) => {
        const [result] = await pool.execute('DELETE FROM grupos WHERE id = ?', [id])
        return result.affectedRows
    },

    // Verificar si existe un grupo
    exists: async (id) => {
        const [rows] = await pool.execute('SELECT id FROM grupos WHERE id = ?', [id])
        return rows.length > 0
    },

    // Verificar si existe un grupo con el mismo nombre, escuela y ciclo
    existsByName: async (nombre, escuela_id, ciclo_id) => {
        const [rows] = await pool.execute(
            'SELECT id FROM grupos WHERE nombre = ? AND escuela_id = ? AND ciclo_id = ?',
            [nombre, escuela_id, ciclo_id]
        )
        return rows.length > 0
    },

    // Verificar si existe un grupo con el mismo nombre, escuela y ciclo excluyendo un ID
    existsByNameExcludingId: async (nombre, escuela_id, ciclo_id, excludeId) => {
        const [rows] = await pool.execute(
            'SELECT id FROM grupos WHERE nombre = ? AND escuela_id = ? AND ciclo_id = ? AND id <> ?',
            [nombre, escuela_id, ciclo_id, excludeId]
        )
        return rows.length > 0
    },

    // Verificar relaciones del grupo
    checkRelations: async (id) => {
        const [reservasCount] = await pool.execute('SELECT COUNT(*) as total FROM reservas WHERE grupo_id = ?', [id])
        return {
            reservas: reservasCount[0].total,
            total: reservasCount[0].total
        }
    }
}