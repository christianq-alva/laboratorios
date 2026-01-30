import { pool } from '../config/database.js'
import { handleDBError } from '../utils/handleDBError.js'

export const Insumo = {
  create: async (nombre, descripcion, unidad_id, categoria, presentacion, connection) => {
    const conn = connection || pool
    try {
      const [insumoResult] = await conn.execute(`
        INSERT INTO insumos (codigo, nombre, descripcion, unidad_id, categoria, presentacion)
        VALUES ('PENDIENTE', ?, ?, ?, ?, ?)
      `, [nombre, descripcion || '', unidad_id, categoria, presentacion || ''])

      const insumo_id = insumoResult.insertId
      const codigo = `INS-${insumo_id.toString().padStart(4, '0')}`

      await conn.execute('UPDATE insumos SET codigo = ? WHERE id = ?', [codigo, insumo_id])

      return { insumo_id, codigo }
    } catch (error) {
      handleDBError(error, 'Insumo')
    }
  },

  updateById: async (id, data, connection) => {
    const conn = connection || pool
    try {
      const [result] = await conn.execute(`
        UPDATE insumos
        SET nombre = ?, descripcion = ?, unidad_id = ?, categoria = ?, presentacion = ?
        WHERE id = ?
      `, [data.nombre, data.descripcion || '', data.unidad_id, data.categoria, data.presentacion, id])

      return { affectedRows: result.affectedRows, changedRows: result.changedRows }
    } catch (error) {
      handleDBError(error, 'Insumo')
    }
  },

  deleteById: async (id, connection) => {
    const conn = connection || pool
    try {
      const [result] = await conn.execute('DELETE FROM insumos WHERE id = ?', [id])
      return { affectedRows: result.affectedRows }
    } catch (error) {
      handleDBError(error, 'Insumo')
    }
  },

  existsById: async (id, connection) => {
    const conn = connection || pool
    try {
      const [rows] = await conn.execute('SELECT id FROM insumos WHERE id = ?', [id])
      return rows.length > 0
    } catch (error) {
      handleDBError(error, 'Insumo')
    }
  },

  getById: async (id, connection) => {
    const conn = connection || pool
    try {
      const [rows] = await conn.execute(`
        SELECT i.id, i.codigo, i.nombre, i.descripcion, i.unidad_id, u.simbolo as unidad_simbolo, u.nombre as unidad_nombre
        FROM insumos i
        LEFT JOIN unidades u ON i.unidad_id = u.id
        WHERE i.id = ?
      `, [id])
      return rows[0] || null
    } catch (error) {
      handleDBError(error, 'Insumo')
    }
  },

  getAll: async (connection) => {
    const conn = connection || pool
    try {
      const [rows] = await conn.execute(`
        SELECT i.id, i.codigo, i.nombre, i.descripcion, i.categoria, i.presentacion, i.unidad_id, u.simbolo as unidad_simbolo, u.nombre as unidad_nombre
        FROM insumos i
        LEFT JOIN unidades u ON i.unidad_id = u.id
        ORDER BY i.nombre
      `)
      return rows
    } catch (error) {
      handleDBError(error, 'Insumo')
    }
  },

  checkRelations: async (id, connection) => {
    const conn = connection || pool
    try {
      const [detalleMovimientos] = await conn.execute(
        'SELECT COUNT(*) as total FROM movimiento_insumo_detalle WHERE insumo_id = ?',
        [id]
      )

      const [inventario] = await conn.execute(
        'SELECT COUNT(*) as total FROM inventario_insumos WHERE insumo_id = ?',
        [id]
      )

      return {
        detalleMovimientos: detalleMovimientos[0].total,
        inventario: inventario[0].total,
        total: detalleMovimientos[0].total + inventario[0].total
      }
    } catch (error) {
      handleDBError(error, 'Insumo')
    }
  }
}