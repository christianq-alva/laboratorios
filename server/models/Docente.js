import { pool } from '../config/database.js'
import { AppError } from '../utils/errors.js'
import { handleDBError } from '../utils/handleDBError.js'

export const Docente = {
  getAll: async () => {
    try {
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
    } catch (error) {
      handleDBError(error, 'Docente')
    }
  },

  getById: async (id) => {
    try {
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
    } catch (error) {
      handleDBError(error, 'Docente')
    }
  },

  create: async (data) => {
    if (data.correo && (await Docente.existsByEmail(data.correo))) {
      throw new AppError('Ya existe un docente con ese correo', 400)
    }
    try {
      const [result] = await pool.execute(`
        INSERT INTO docentes (nombre, correo, escuela_id)
        VALUES (?, ?, ?)
      `, [data.nombre, data.correo, data.escuela_id])
      return result.insertId
    } catch (error) {
      handleDBError(error, 'Docente')
    }
  },

  update: async (id, data) => {
    if (!(await Docente.existsById(id))) {
      throw new AppError('Docente no encontrado', 404)
    }
    if (data.correo !== undefined && data.correo !== null && (await Docente.existsByEmail(data.correo, id))) {
      throw new AppError('Ya existe otro docente con ese correo', 400)
    }
    try {
      await pool.execute(`
        UPDATE docentes 
        SET nombre = ?, correo = ?, escuela_id = ?
        WHERE id = ?
      `, [data.nombre, data.correo, data.escuela_id, id])
      return true
    } catch (error) {
      handleDBError(error, 'Docente')
    }
  },

  delete: async (id) => {
    if (!(await Docente.existsById(id))) {
      throw new AppError('Docente no encontrado', 404)
    }
    if (await Docente.hasActiveSchedules(id)) {
      throw new AppError('No se puede eliminar. El docente tiene horarios programados', 400)
    }
    try {
      await pool.execute(`
        DELETE FROM docentes 
        WHERE id = ?
      `, [id])
      return true
    } catch (error) {
      handleDBError(error, 'Docente')
    }
  },

  hasActiveSchedules: async (docente_id) => {
    try {
      const [rows] = await pool.execute(`
        SELECT COUNT(*) as count
        FROM reservas r
        WHERE r.docente_id = ? AND r.fecha_inicio > NOW()
      `, [docente_id])
      return rows[0].count > 0
    } catch (error) {
      handleDBError(error, 'Docente')
    }
  },

  existsById: async (id) => {
    try {
      const [rows] = await pool.execute(`
        SELECT id FROM docentes WHERE id = ?
      `, [id])
      return rows.length > 0
    } catch (error) {
      handleDBError(error, 'Docente')
    }
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
    try {
      const [rows] = await pool.execute(query, params)
      return rows[0].count > 0
    } catch (error) {
      handleDBError(error, 'Docente')
    }
  }
}
