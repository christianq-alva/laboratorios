import { pool } from '../config/database.js'
import { AppError } from '../utils/errors.js'
import { handleDBError } from '../utils/handleDBError.js'

const SELECT_FIELDS = `
  id,
  nombre,
  CAST(porcentaje AS DECIMAL(7,4)) AS porcentaje,
  descripcion,
  activo
`

export const DepreciacionCategoria = {
  getAll: async () => {
    try {
      const [rows] = await pool.execute(`
        SELECT ${SELECT_FIELDS}
        FROM depreciacion_categorias
        ORDER BY porcentaje DESC, nombre ASC
      `)
      return rows
    } catch (error) {
      handleDBError(error, 'Categoría de depreciación')
    }
  },

  getActivas: async () => {
    try {
      const [rows] = await pool.execute(`
        SELECT ${SELECT_FIELDS}
        FROM depreciacion_categorias
        WHERE activo = 1
        ORDER BY porcentaje DESC, nombre ASC
      `)
      return rows
    } catch (error) {
      handleDBError(error, 'Categoría de depreciación')
    }
  },

  getById: async (id) => {
    try {
      const [rows] = await pool.execute(`
        SELECT ${SELECT_FIELDS}
        FROM depreciacion_categorias
        WHERE id = ?
      `, [id])
      if (!rows[0]) {
        throw new AppError('Categoría de depreciación no encontrada', 404)
      }
      return rows[0]
    } catch (error) {
      if (error instanceof AppError) throw error
      handleDBError(error, 'Categoría de depreciación')
    }
  },

  create: async (data) => {
    try {
      const [existing] = await pool.execute(
        'SELECT id FROM depreciacion_categorias WHERE nombre = ?',
        [data.nombre]
      )
      if (existing.length > 0) {
        throw new AppError('Ya existe una categoría de depreciación con ese nombre', 409)
      }

      const [result] = await pool.execute(
        `INSERT INTO depreciacion_categorias (nombre, porcentaje, descripcion, activo)
         VALUES (?, ?, ?, ?)`,
        [data.nombre, data.porcentaje, data.descripcion || null, data.activo ? 1 : 0]
      )
      return result.insertId
    } catch (error) {
      if (error instanceof AppError) throw error
      handleDBError(error, 'Categoría de depreciación')
    }
  },

  update: async (id, data) => {
    await DepreciacionCategoria.getById(id) // lanza 404 si no existe

    const [existing] = await pool.execute(
      'SELECT id FROM depreciacion_categorias WHERE nombre = ? AND id != ?',
      [data.nombre, id]
    )
    if (existing.length > 0) {
      throw new AppError('Ya existe otra categoría de depreciación con ese nombre', 409)
    }

    try {
      const [result] = await pool.execute(
        `UPDATE depreciacion_categorias
         SET nombre = ?, porcentaje = ?, descripcion = ?, activo = ?
         WHERE id = ?`,
        [data.nombre, data.porcentaje, data.descripcion || null, data.activo ? 1 : 0, id]
      )
      return result.affectedRows > 0
    } catch (error) {
      handleDBError(error, 'Categoría de depreciación')
    }
  },

  delete: async (id) => {
    await DepreciacionCategoria.getById(id) // lanza 404 si no existe

    const { equipos, materiales } = await DepreciacionCategoria.contarAsignaciones(id)
    if (equipos > 0 || materiales > 0) {
      const detalle = [
        equipos > 0 ? `${equipos} equipo(s)` : null,
        materiales > 0 ? `${materiales} material(es) reutilizable(s)` : null
      ].filter(Boolean).join(' y ')
      throw new AppError(
        `No se puede eliminar la categoría porque está asignada a ${detalle}. Reasigna esos registros o desactiva la categoría.`,
        409
      )
    }

    try {
      const [result] = await pool.execute(
        'DELETE FROM depreciacion_categorias WHERE id = ?',
        [id]
      )
      return result.affectedRows > 0
    } catch (error) {
      handleDBError(error, 'Categoría de depreciación')
    }
  },

  contarAsignaciones: async (id) => {
    try {
      const [equipos] = await pool.execute(
        'SELECT COUNT(*) AS total FROM equipos WHERE depreciacion_categoria_id = ?',
        [id]
      )
      const [materiales] = await pool.execute(
        'SELECT COUNT(*) AS total FROM materiales_reutilizables WHERE depreciacion_categoria_id = ?',
        [id]
      )
      return {
        equipos: equipos[0].total,
        materiales: materiales[0].total
      }
    } catch (error) {
      handleDBError(error, 'Categoría de depreciación')
    }
  },

  /**
   * Listado con la cantidad de equipos y materiales asignados a cada categoría.
   * Las cuentas van por subconsulta y no por JOIN para que las dos no se
   * multipliquen entre sí en el GROUP BY.
   */
  getAllWithCount: async () => {
    try {
      const [rows] = await pool.execute(`
        SELECT ${SELECT_FIELDS},
          (SELECT COUNT(*) FROM equipos e
            WHERE e.depreciacion_categoria_id = dc.id) AS count_equipos,
          (SELECT COUNT(*) FROM materiales_reutilizables m
            WHERE m.depreciacion_categoria_id = dc.id) AS count_materiales
        FROM depreciacion_categorias dc
        ORDER BY porcentaje DESC, nombre ASC
      `)
      return rows
    } catch (error) {
      handleDBError(error, 'Categoría de depreciación')
    }
  }
}
