import { pool } from '../config/database.js'

export const Docente = {
  // Obtener docentes según el rol del usuario
  getAll: async () => {
    const [rows] = await pool.execute(`
      SELECT 
        d.id,
        d.nombre,
        d.correo,
        d.escuela_id,
        e.nombre as escuela
      FROM docentes d
      LEFT JOIN escuelas e ON d.escuela_id = e.id
    `)
    return rows
  },

  // Obtener docente por ID
  getById: async (id) => {
    const [rows] = await pool.execute(`
      SELECT 
        d.id,
        d.nombre,
        d.correo,
        d.escuela_id,
        e.nombre as escuela
      FROM docentes d
      LEFT JOIN escuelas e ON d.escuela_id = e.id
      WHERE d.id = ?
    `, [id])

    return rows[0] || null
  },

  // Crear nuevo docente
  create: async (data) => {
    const [result] = await pool.execute(`
      INSERT INTO docentes (nombre, correo, escuela_id)
      VALUES (?, ?, ?)
    `, [data.nombre, data.correo, data.escuela_id])

    return result.insertId
  },

  // Actualizar docente
  update: async (id, data) => {
    await pool.execute(`
      UPDATE docentes 
      SET nombre = ?, correo = ?, escuela_id = ?
      WHERE id = ?
    `, [data.nombre, data.correo, data.escuela_id, id])

    return true
  },

  // Eliminar docente (solo si no tiene horarios asignados)
  delete: async (id) => {
    await pool.execute(`
      DELETE FROM docentes 
      WHERE id = ?
    `, [id])

    return true
  },

  // Verificar si el docente tiene horarios pendientes
  hasActiveSchedules: async (docente_id) => {
    const [rows] = await pool.execute(`
      SELECT COUNT(*) as count
      FROM reservas r
      WHERE r.docente_id = ? AND r.fecha_inicio > NOW()
    `, [docente_id])

    return rows[0].count > 0
  },

  existsById: async (id) => {
    const [rows] = await pool.execute(`
      SELECT id FROM docentes WHERE id = ?;
    `, [id])
    return rows.length > 0
  },

  existsByEmail: async (email, excludeId) => {

    let query = `
      SELECT COUNT(*) as count
      FROM docentes WHERE correo = ?
    `
    let params = [email]

    if (excludeId) {
      query += ' AND id <> ?'
      params = [email, excludeId]
    }

    const [rows] = await pool.execute(query, params)

    return rows[0].count > 0
  }
}