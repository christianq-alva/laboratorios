import { pool } from '../config/database.js'
import { handleDBError } from '../utils/handleDBError.js'

/**
 * Modelo de incidencias. Solo acceso a datos.
 * Validaciones de negocio (permisos, existencia) están en incidenciaService.
 */
export const Incidencia = {
  /**
   * Lista incidencias opcionalmente filtradas por laboratorios.
   * @param {Object} opts - { laboratorio_ids: number[] | null } null = todos (admin), [] = ninguno, [1,2] = solo esos labs
   */
  getByUser: async (opts) => {
    const labIds = opts.laboratorio_ids
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
    if (labIds === null) {
      // Admin: sin filtro
    } else if (labIds.length > 0) {
      const placeholders = labIds.map(() => '?').join(',')
      query += ` WHERE r.laboratorio_id IN (${placeholders})`
      params = labIds
    } else {
      query += ' WHERE 1 = 0'
    }
    query += ' ORDER BY i.fecha_reporte DESC'

    try {
      const [rows] = await pool.execute(query, params)
      return rows
    } catch (error) {
      handleDBError(error, 'Incidencia')
    }
  },

  /**
   * Obtiene una incidencia por id. Incluye laboratorio_id para validación de permisos.
   * @returns {Object|null} fila o null si no existe
   */
  getById: async (id) => {
    try {
      const [rows] = await pool.execute(`
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
      `, [id])
      return rows[0] || null
    } catch (error) {
      handleDBError(error, 'Incidencia')
    }
  },

  /**
   * Obtiene laboratorio_id de una reserva. Para validar si el usuario puede crear incidencia.
   * @returns {{ laboratorio_id: number } | null}
   */
  getReservaById: async (reserva_id) => {
    try {
      const [rows] = await pool.execute(
        'SELECT laboratorio_id FROM reservas WHERE id = ?',
        [reserva_id]
      )
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