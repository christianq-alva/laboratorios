import { pool } from '../config/database.js'
import { handleDBError } from '../utils/handleDBError.js'

/**
 * Material reutilizable: bienes físicos que se usan en varias prácticas sin
 * consumirse (cristalería y afines) y que no se inventarían uno por uno como
 * los equipos — no tienen número de serie ni mantenimiento, solo una cantidad
 * total por laboratorio y un valor unitario para calcular la depreciación.
 */
const SELECT_FIELDS = `
  m.id,
  m.codigo,
  m.nombre,
  m.descripcion,
  m.laboratorio_id,
  m.cantidad_total,
  CAST(m.valor_unitario AS DECIMAL(12,2)) AS valor_unitario,
  m.depreciacion_categoria_id,
  m.activo,
  m.created_at,
  m.updated_at,
  lab.nombre AS laboratorio_nombre,
  dc.nombre AS depreciacion_categoria_nombre,
  CAST(dc.porcentaje AS DECIMAL(7,4)) AS depreciacion_porcentaje
`

const FROM_JOINS = `
  FROM materiales_reutilizables m
  LEFT JOIN laboratorios lab ON m.laboratorio_id = lab.id
  LEFT JOIN depreciacion_categorias dc ON m.depreciacion_categoria_id = dc.id
`

export const MaterialReutilizable = {
  getAll: async (user_rol, user_laboratorio_ids, filters = {}) => {
    let query = `SELECT ${SELECT_FIELDS} ${FROM_JOINS} WHERE 1=1`
    const params = []

    // Filtros según permisos del usuario
    if (user_rol === 'Jefe de Laboratorio') {
      if (!user_laboratorio_ids || user_laboratorio_ids.length === 0) return []
      query += ` AND m.laboratorio_id IN (${user_laboratorio_ids.map(() => '?').join(',')})`
      params.push(...user_laboratorio_ids)
    }

    if (filters.laboratorio_id) {
      query += ' AND m.laboratorio_id = ?'
      params.push(filters.laboratorio_id)
    }
    if (filters.depreciacion_categoria_id) {
      query += ' AND m.depreciacion_categoria_id = ?'
      params.push(filters.depreciacion_categoria_id)
    }
    if (filters.activo !== undefined) {
      query += ' AND m.activo = ?'
      params.push(filters.activo ? 1 : 0)
    }

    query += ' ORDER BY m.nombre ASC, m.codigo ASC'

    try {
      const [rows] = await pool.execute(query, params)
      return rows
    } catch (error) {
      handleDBError(error, 'Material reutilizable')
    }
  },

  /** Materiales activos de un laboratorio: lo que se ofrece al armar un horario */
  getByLaboratorio: async (laboratorio_id, filters = {}) => {
    let query = `SELECT ${SELECT_FIELDS} ${FROM_JOINS} WHERE m.laboratorio_id = ?`
    const params = [laboratorio_id]

    // Por defecto solo los activos
    if (filters.incluir_inactivos !== true) {
      query += ' AND m.activo = 1'
    }

    query += ' ORDER BY m.nombre ASC, m.codigo ASC'

    try {
      const [rows] = await pool.execute(query, params)
      return rows
    } catch (error) {
      handleDBError(error, 'Material reutilizable')
    }
  },

  getById: async (id) => {
    try {
      const [rows] = await pool.execute(
        `SELECT ${SELECT_FIELDS} ${FROM_JOINS} WHERE m.id = ?`,
        [id]
      )
      return rows[0]
    } catch (error) {
      handleDBError(error, 'Material reutilizable')
    }
  },

  existsById: async (id) => {
    try {
      const [rows] = await pool.execute('SELECT id FROM materiales_reutilizables WHERE id = ?', [id])
      return rows.length > 0
    } catch (error) {
      handleDBError(error, 'Material reutilizable')
    }
  },

  existsByCodigo: async (codigo, excludeId) => {
    try {
      let query = 'SELECT id FROM materiales_reutilizables WHERE codigo = ?'
      const params = [codigo]
      if (excludeId) {
        query += ' AND id <> ?'
        params.push(excludeId)
      }
      const [rows] = await pool.execute(query, params)
      return rows.length > 0
    } catch (error) {
      handleDBError(error, 'Material reutilizable')
    }
  },

  create: async (data, connection) => {
    const conn = connection || pool
    try {
      const [result] = await conn.execute(`
        INSERT INTO materiales_reutilizables
          (codigo, nombre, descripcion, laboratorio_id, cantidad_total, valor_unitario, depreciacion_categoria_id, activo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
        data.codigo,
        data.nombre,
        data.descripcion ?? null,
        data.laboratorio_id,
        data.cantidad_total ?? 0,
        data.valor_unitario ?? null,
        data.depreciacion_categoria_id ?? null,
        data.activo === false ? 0 : 1
      ])
      return result.insertId
    } catch (error) {
      handleDBError(error, 'Material reutilizable')
    }
  },

  update: async (id, data, connection) => {
    const conn = connection || pool
    try {
      const [result] = await conn.execute(`
        UPDATE materiales_reutilizables
        SET codigo = ?, nombre = ?, descripcion = ?, laboratorio_id = ?, cantidad_total = ?,
            valor_unitario = ?, depreciacion_categoria_id = ?, activo = ?
        WHERE id = ?`, [
        data.codigo,
        data.nombre,
        data.descripcion ?? null,
        data.laboratorio_id,
        data.cantidad_total ?? 0,
        data.valor_unitario ?? null,
        data.depreciacion_categoria_id ?? null,
        data.activo === false ? 0 : 1,
        id
      ])
      return result.affectedRows
    } catch (error) {
      handleDBError(error, 'Material reutilizable')
    }
  },

  delete: async (id, connection) => {
    const conn = connection || pool
    try {
      const [result] = await conn.execute('DELETE FROM materiales_reutilizables WHERE id = ?', [id])
      return result.affectedRows
    } catch (error) {
      handleDBError(error, 'Material reutilizable')
    }
  },

  /** Cuántos horarios lo tienen reservado (bloquea el borrado) */
  contarReservas: async (id) => {
    try {
      const [rows] = await pool.execute(
        'SELECT COUNT(*) AS total FROM detalle_reserva_materiales WHERE material_id = ?',
        [id]
      )
      return rows[0].total
    } catch (error) {
      handleDBError(error, 'Material reutilizable')
    }
  },

  /** Reservas en horarios aún programados (estado P) del laboratorio indicado */
  reservasProgramadasByLaboratorioId: async (material_id, laboratorio_id) => {
    try {
      const [rows] = await pool.execute(`
        SELECT COUNT(*) AS total
        FROM detalle_reserva_materiales drm
        JOIN reservas r ON drm.reserva_id = r.id
        WHERE drm.material_id = ? AND r.laboratorio_id = ? AND r.estado = 'P'
      `, [material_id, laboratorio_id])
      return rows[0].total > 0
    } catch (error) {
      handleDBError(error, 'Material reutilizable')
    }
  },

  /** Valor unitario y porcentaje vigentes: insumos del cálculo que se congela en el horario */
  getDatosDepreciacion: async (ids, connection) => {
    if (!ids || ids.length === 0) return []
    const conn = connection || pool
    try {
      const [rows] = await conn.execute(`
        SELECT
          m.id,
          m.nombre,
          m.laboratorio_id,
          m.cantidad_total,
          CAST(m.valor_unitario AS DECIMAL(12,2)) AS valor_unitario,
          CAST(dc.porcentaje AS DECIMAL(7,4)) AS porcentaje
        FROM materiales_reutilizables m
        LEFT JOIN depreciacion_categorias dc ON m.depreciacion_categoria_id = dc.id
        WHERE m.id IN (${ids.map(() => '?').join(',')})
      `, ids)
      return rows
    } catch (error) {
      handleDBError(error, 'Material reutilizable')
    }
  }
}
