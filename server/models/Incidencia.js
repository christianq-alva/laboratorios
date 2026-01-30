import { pool } from '../config/database.js'
import { handleDBError } from '../utils/handleDBError.js'

export const Incidencia = {
  getByUser: async (user) => {
    let query = `
      SELECT 
        i.id,
        i.titulo,
        i.descripcion,
        i.fecha_reporte,
        r.id as reserva_id,
        r.fecha_inicio as fecha_clase,
        r.fecha_fin,
        l.nombre as laboratorio,
        d.nombre as docente,
        u.nombre_completo as reportado_por
      FROM incidencias i
      JOIN reservas r ON i.reserva_id = r.id
      JOIN laboratorios l ON r.laboratorio_id = l.id
      JOIN docentes d ON r.docente_id = d.id
      JOIN usuarios u ON i.reportado_por = u.id
    `
    let params = []

    // 🟡 JEFE DE LAB: Solo incidencias de SUS laboratorios
    if (user.rol === 'Jefe de Laboratorio') {
      const labIds = user.laboratorio_ids || []
      if (labIds.length > 0) {
        const placeholders = labIds.map(() => '?').join(',')
        query += ` WHERE r.laboratorio_id IN (${placeholders})`
        params = labIds
      } else {
        query += ' WHERE 1 = 0' // No mostrar nada si no tiene labs
      }
    }
    // 🔴 ADMIN: Ve todas las incidencias

    query += ' ORDER BY i.fecha_reporte DESC'

    try {
      const [rows] = await pool.execute(query, params)
      return rows
    } catch (error) {
      handleDBError(error, 'Incidencia')
    }
  },

  getById: async (id, user) => {
    let query = `
      SELECT 
        i.id,
        i.titulo,
        i.descripcion,
        i.fecha_reporte,
        r.id as reserva_id,
        r.fecha_inicio as fecha_clase,
        r.fecha_fin,
        r.cantidad_alumnos,
        l.id as laboratorio_id,
        l.nombre as laboratorio,
        d.nombre as docente,
        u.nombre_completo as reportado_por
      FROM incidencias i
      JOIN reservas r ON i.reserva_id = r.id
      JOIN laboratorios l ON r.laboratorio_id = l.id
      JOIN docentes d ON r.docente_id = d.id
      JOIN usuarios u ON i.reportado_por = u.id
      WHERE i.id = ?
    `
    let params = [id]

    // 🟡 JEFE DE LAB: Solo si la incidencia es de sus laboratorios
    if (user.rol === 'Jefe de Laboratorio') {
      const labIds = user.laboratorio_ids || []
      if (labIds.length > 0) {
        const placeholders = labIds.map(() => '?').join(',')
        query += ` AND r.laboratorio_id IN (${placeholders})`
        params = [id, ...labIds]
      } else {
        return null // No tiene acceso
      }
    }

    try {
      const [rows] = await pool.execute(query, params)
      return rows[0] || null
    } catch (error) {
      handleDBError(error, 'Incidencia')
    }
  },

  create: async (data, user_id) => {
    try {
      const [result] = await pool.execute(`
        INSERT INTO incidencias (reserva_id, titulo, descripcion, reportado_por)
        VALUES (?, ?, ?, ?)
      `, [data.reserva_id, data.titulo, data.descripcion, user_id])

      return result.insertId
    } catch (error) {
      handleDBError(error, 'Incidencia')
    }
  },

  canCreateForReserva: async (reserva_id, user) => {
    if (user.rol === 'Administrador') {
      return true
    }

    if (user.rol === 'Jefe de Laboratorio') {
      try {
        const [rows] = await pool.execute(`
          SELECT r.laboratorio_id 
          FROM reservas r 
          WHERE r.id = ?
        `, [reserva_id])

        if (rows.length === 0) {
          return false
        }

        const labIds = user.laboratorio_ids || []
        return labIds.includes(rows[0].laboratorio_id)
      } catch (error) {
        handleDBError(error, 'Incidencia')
      }
    }

    return false
  },

  delete: async (id) => {
    try {
      const [result] = await pool.execute(`
        DELETE FROM incidencias WHERE id = ?
      `, [id])

      return result.affectedRows > 0
    } catch (error) {
      handleDBError(error, 'Incidencia')
    }
  }
}