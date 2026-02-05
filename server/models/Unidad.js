import { pool } from '../config/database.js'
import { AppError } from '../utils/errors.js'
import { handleDBError } from '../utils/handleDBError.js'

export const Unidad = {
  create: async (data) => {
    if (await Unidad.existsBySimbolo(data.simbolo, null)) {
      throw new AppError('Ya existe una unidad con ese símbolo', 409)
    }
    if (await Unidad.existsByNombre(data.nombre, null)) {
      throw new AppError('Ya existe una unidad con ese nombre', 409)
    }
    try {
      const [result] = await pool.execute(`
        INSERT INTO unidades (simbolo, nombre, descripcion)
        VALUES (?, ?, ?)
      `, [data.simbolo, data.nombre, data.descripcion || ''])
      return result.insertId
    } catch (error) {
      handleDBError(error, 'Unidad')
    }
  },

  updateById: async (id, data) => {
    if (!(await Unidad.existsById(id))) {
      throw new AppError('Unidad no encontrada', 404)
    }
    if (await Unidad.existsBySimbolo(data.simbolo, id)) {
      throw new AppError('Ya existe otra unidad con ese símbolo', 409)
    }
    if (await Unidad.existsByNombre(data.nombre, id)) {
      throw new AppError('Ya existe otra unidad con ese nombre', 409)
    }
    try {
      const [result] = await pool.execute(`
        UPDATE unidades
        SET simbolo = ?, nombre = ?, descripcion = ?
        WHERE id = ?
      `, [data.simbolo, data.nombre, data.descripcion || '', id])
      return { affectedRows: result.affectedRows, changedRows: result.changedRows }
    } catch (error) {
      handleDBError(error, 'Unidad')
    }
  },

  deleteById: async (id) => {
    const unidad = await Unidad.getById(id) // lanza 404 si no existe
    const relations = await Unidad.checkRelations(id)
    if (relations.total > 0) {
      const partes = relations.insumos > 0 ? [`Tiene ${relations.insumos} insumo(s) asociado(s)`] : []
      throw new AppError(`No se puede eliminar. La unidad "${unidad.nombre}" está siendo usada en el sistema: ${partes.join(', ')}.`, 409)
    }
    try {
      const [result] = await pool.execute('DELETE FROM unidades WHERE id = ?', [id])
      return { affectedRows: result.affectedRows }
    } catch (error) {
      handleDBError(error, 'Unidad')
    }
  },

  existsById: async (id) => {
    try {
      const [rows] = await pool.execute('SELECT id FROM unidades WHERE id = ?', [id])
      return rows.length > 0
    } catch (error) {
      handleDBError(error, 'Unidad')
    }
  },

  getById: async (id) => {
    try {
      const [rows] = await pool.execute('SELECT id, simbolo, nombre, descripcion FROM unidades WHERE id = ?', [id])
      if (!rows[0]) {
        throw new AppError('Unidad no encontrada', 404)
      }
      return rows[0]
    } catch (error) {
      if (error instanceof AppError) throw error
      handleDBError(error, 'Unidad')
    }
  },

  getAll: async () => {
    try {
      const [rows] = await pool.execute(`
        SELECT *
        FROM unidades
        ORDER BY nombre
      `)
      return rows
    } catch (error) {
      handleDBError(error, 'Unidad')
    }
  },

  checkRelations: async (id) => {
    try {
      const [insumos] = await pool.execute(
        'SELECT COUNT(*) as total FROM insumos WHERE unidad_id = ?',
        [id]
      )
      return {
        insumos: insumos[0].total,
        total: insumos[0].total
      }
    } catch (error) {
      handleDBError(error, 'Unidad')
    }
  },

  existsBySimbolo: async (simbolo, excludeId = null) => {
    let query = 'SELECT id FROM unidades WHERE simbolo = ?'
    const params = [simbolo]
    if (excludeId) {
      query += ' AND id != ?'
      params.push(excludeId)
    }
    try {
      const [rows] = await pool.execute(query, params)
      return rows.length > 0
    } catch (error) {
      handleDBError(error, 'Unidad')
    }
  },

  existsByNombre: async (nombre, excludeId = null) => {
    let query = 'SELECT id FROM unidades WHERE nombre = ?'
    const params = [nombre]
    if (excludeId) {
      query += ' AND id != ?'
      params.push(excludeId)
    }
    try {
      const [rows] = await pool.execute(query, params)
      return rows.length > 0
    } catch (error) {
      handleDBError(error, 'Unidad')
    }
  }
}

