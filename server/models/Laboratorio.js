import { pool } from '../config/database.js'
import { AppError } from '../utils/errors.js'
import { handleDBError } from '../utils/handleDBError.js'
import { Escuela } from './Escuela.js'

export const Laboratorio = {
  getAll: async () => {
    try {
      const [laboratorios] = await pool.execute(`
        SELECT l.id, l.codigo, l.nombre, l.ubicacion, l.escuela_id, l.piso, l.estado, e.nombre as escuela
        FROM laboratorios l
        LEFT JOIN escuelas e ON l.escuela_id = e.id
        ORDER BY l.codigo, l.nombre
      `)
      return laboratorios
    } catch (error) {
      handleDBError(error, 'Laboratorio')
    }
  },

  getAllByUser: async (user_rol, user_laboratorio_ids) => {
    try {
      let query = `
        SELECT l.id, l.codigo, l.nombre, l.ubicacion, l.escuela_id, l.piso, l.estado, e.nombre as escuela
        FROM laboratorios l
        LEFT JOIN escuelas e ON l.escuela_id = e.id
        WHERE 1=1
      `
      if (user_rol === 'Jefe de Laboratorio') {
        query += ` AND l.id IN (${user_laboratorio_ids.join(',')})`
      }
      query += ' ORDER BY l.codigo, l.nombre'
      const [laboratorios] = await pool.execute(query)
      return laboratorios
    } catch (error) {
      handleDBError(error, 'Laboratorio')
    }
  },

  create: async (codigo, nombre, ubicacion, escuela_id, piso, estado) => {
    if (!(await Escuela.exists(escuela_id))) {
      throw new AppError('La escuela seleccionada no existe', 400)
    }
    try {
      const [result] = await pool.execute(`
        INSERT INTO laboratorios (codigo, nombre, ubicacion, escuela_id, piso, estado)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [codigo, nombre, ubicacion, escuela_id, piso, estado])
      return result.insertId
    } catch (error) {
      handleDBError(error, 'Laboratorio')
    }
  },

  update: async (id, codigo, nombre, ubicacion, escuela_id, piso, estado) => {
    if (escuela_id !== undefined && !(await Escuela.exists(escuela_id))) {
      throw new AppError('La escuela seleccionada no existe', 400)
    }
    try {
      const [result] = await pool.execute(`
        UPDATE laboratorios SET codigo = ?, nombre = ?, ubicacion = ?, escuela_id = ?, piso = ?, estado = ? WHERE id = ?
      `, [codigo, nombre, ubicacion, escuela_id, piso, estado, id])
      return result.affectedRows
    } catch (error) {
      handleDBError(error, 'Laboratorio')
    }
  },

  checkRelations: async (id) => {
    try {
      const [equipos] = await pool.execute('SELECT COUNT(*) as total FROM equipos WHERE laboratorio_id = ?', [id])
      const [reservas] = await pool.execute('SELECT COUNT(*) as total FROM reservas WHERE laboratorio_id = ?', [id])
      const [inventario] = await pool.execute('SELECT COUNT(*) as total FROM inventario_insumos WHERE laboratorio_id = ?', [id])
      const [incidencias] = await pool.execute(
        'SELECT COUNT(*) as total FROM incidencias i JOIN reservas r ON i.reserva_id = r.id WHERE r.laboratorio_id = ?',
        [id]
      )
      const total = equipos[0].total + reservas[0].total + inventario[0].total + incidencias[0].total
      return {
        equipos: equipos[0].total,
        reservas: reservas[0].total,
        inventario: inventario[0].total,
        incidencias: incidencias[0].total,
        total
      }
    } catch (error) {
      handleDBError(error, 'Laboratorio')
    }
  },

  delete: async (id) => {
    const lab = await Laboratorio.getLaboratorioById(id)
    if (!lab) {
      throw new AppError('Laboratorio no encontrado', 404)
    }
    const relations = await Laboratorio.checkRelations(id)
    if (relations.total > 0) {
      throw new AppError('No se puede eliminar el laboratorio porque está relacionado con otras tablas del sistema y tiene datos asociados (equipos, insumos, horarios, incidencias u otros registros). Primero debes eliminar o reasignar estos registros para poder eliminar el laboratorio.', 409)
    }
    try {
      const [result] = await pool.execute('DELETE FROM laboratorios WHERE id = ?', [id])
      return result.affectedRows
    } catch (error) {
      handleDBError(error, 'Laboratorio')
    }
  },

  exists: async (id) => {
    try {
      const [rows] = await pool.execute('SELECT id FROM laboratorios WHERE id = ?', [id])
      return rows.length > 0
    } catch (error) {
      handleDBError(error, 'Laboratorio')
    }
  },

  /**
   * Indica si el laboratorio tiene reservas pendientes (estado = 'P') con fecha_inicio en el futuro.
   * @param {number} id - ID del laboratorio
   * @returns {Promise<boolean>}
   */
  hasReservasPendientes: async (id) => {
    try {
      const [rows] = await pool.execute(
        'SELECT 1 FROM reservas WHERE laboratorio_id = ? AND estado = ? AND fecha_inicio > NOW() LIMIT 1',
        [id, 'P']
      )
      return rows.length > 0
    } catch (error) {
      handleDBError(error, 'Laboratorio')
    }
  },

  updateEstado: async (id, estado) => {
    try {
      const [result] = await pool.execute('UPDATE laboratorios SET estado = ? WHERE id = ?', [estado, id])
      return result.affectedRows
    } catch (error) {
      handleDBError(error, 'Laboratorio')
    }
  },

  getLaboratorioById: async (id) => {
    try {
      const [rows] = await pool.execute(`
        SELECT l.id, l.codigo, l.nombre, l.ubicacion, l.escuela_id, l.piso, l.estado, e.nombre as escuela
        FROM laboratorios l
        LEFT JOIN escuelas e ON l.escuela_id = e.id
        WHERE l.id = ?
      `, [id])
      return rows[0]
    } catch (error) {
      handleDBError(error, 'Laboratorio')
    }
  },
  getLaboratorioInsumos: async () => {
    try {
      const [laboratorioInsumos] = await pool.execute(`
        SELECT l.codigo lab_codigo, l.nombre lab_nombre, i.codigo ins_codigo, i.nombre ins_nombre, u.simbolo ins_unidad_simbolo, u.nombre ins_unidad_nombre
        FROM inventario_insumos ii
        INNER JOIN laboratorios l ON l.id = ii.laboratorio_id
        INNER JOIN insumos i ON i.id = ii.insumo_id
        INNER JOIN unidades u ON i.unidad_id = u.id
        ORDER BY l.nombre, i.nombre
      `)
      return laboratorioInsumos
    } catch (error) {
      handleDBError(error, 'Laboratorio')
    }
  },

  getInsumosByLaboratorio: async (laboratorio_id) => {
    try {
      const [insumos] = await pool.execute(`
        SELECT 
          i.id,
          i.codigo,
          i.nombre,
          i.descripcion,
          u.simbolo as unidad_simbolo,
          u.nombre as unidad_nombre,
          i.categoria,
          i.presentacion
        FROM inventario_insumos ii
        INNER JOIN insumos i ON i.id = ii.insumo_id
        INNER JOIN unidades u ON i.unidad_id = u.id
        WHERE ii.laboratorio_id = ?
        ORDER BY i.nombre
      `, [laboratorio_id])
      return insumos
    } catch (error) {
      handleDBError(error, 'Laboratorio')
    }
  },

  configurarInsumos: async (laboratorio_id, insumo_ids, connection) => {
    const conn = connection || pool
    try {
      await conn.execute(
        'DELETE FROM inventario_insumos WHERE laboratorio_id = ?',
        [laboratorio_id]
      )

      if (insumo_ids && insumo_ids.length > 0) {
        const values = insumo_ids.map((insumo_id) => [laboratorio_id, insumo_id])
        const placeholders = values.map(() => '(?, ?)').join(', ')
        const flatValues = values.flat()
        await conn.execute(
          `INSERT INTO inventario_insumos (laboratorio_id, insumo_id) VALUES ${placeholders}`,
          flatValues
        )
      }

      return true
    } catch (error) {
      handleDBError(error, 'Laboratorio')
    }
  },

  findByCodigo: async (codigo, connection) => {
    const conn = connection || pool
    try {
      const [rows] = await conn.execute(
        'SELECT id, codigo, nombre FROM laboratorios WHERE codigo = ?',
        [codigo]
      )
      return rows[0] || null
    } catch (error) {
      handleDBError(error, 'Laboratorio')
    }
  },

  // Agrega insumos a un laboratorio sin borrar los existentes (usado en importación masiva)
  asignarInsumosNuevos: async (asignaciones, connection) => {
    const conn = connection || pool
    if (!asignaciones || asignaciones.length === 0) return
    try {
      const values = asignaciones.map(a => [a.laboratorio_id, a.insumo_id])
      const placeholders = values.map(() => '(?, ?)').join(', ')
      await conn.execute(
        `INSERT IGNORE INTO inventario_insumos (laboratorio_id, insumo_id) VALUES ${placeholders}`,
        values.flat()
      )
    } catch (error) {
      handleDBError(error, 'Laboratorio')
    }
  }
}