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

  findByCodigo: async (codigo, connection) => {
    const conn = connection || pool
    try {
      const [rows] = await conn.execute(
        'SELECT id, codigo, nombre FROM insumos WHERE codigo = ? LIMIT 1',
        [codigo]
      )
      return rows[0] || null
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
        SELECT i.id, i.codigo, i.nombre, i.descripcion, i.categoria, i.presentacion, i.unidad_id,
               u.simbolo as unidad_simbolo, u.nombre as unidad_nombre,
               ip.precio as precio_unitario
        FROM insumos i
        LEFT JOIN unidades u ON i.unidad_id = u.id
        LEFT JOIN insumos_precios ip ON ip.insumo_id = i.id AND ip.vigente_hasta IS NULL
        ORDER BY i.nombre
      `)
      return rows
    } catch (error) {
      handleDBError(error, 'Insumo')
    }
  },

  getPrecioActual: async (insumo_id, connection) => {
    const conn = connection || pool
    try {
      const [rows] = await conn.execute(
        'SELECT precio FROM insumos_precios WHERE insumo_id = ? AND vigente_hasta IS NULL LIMIT 1',
        [insumo_id]
      )
      return rows[0] ? parseFloat(rows[0].precio) : null
    } catch (error) {
      handleDBError(error, 'Insumo')
    }
  },

  setPrecio: async (insumo_id, precio, usuario_id, connection) => {
    const conn = connection || pool
    try {
      await conn.execute(
        'UPDATE insumos_precios SET vigente_hasta = NOW() WHERE insumo_id = ? AND vigente_hasta IS NULL',
        [insumo_id]
      )
      await conn.execute(
        'INSERT INTO insumos_precios (insumo_id, precio, usuario_id) VALUES (?, ?, ?)',
        [insumo_id, precio, usuario_id || null]
      )
      return true
    } catch (error) {
      handleDBError(error, 'Insumo')
    }
  },

  getHistorialPrecios: async (insumo_id, connection) => {
    const conn = connection || pool
    try {
      const [rows] = await conn.execute(`
        SELECT ip.id, ip.precio, ip.vigente_desde, ip.vigente_hasta, ip.created_at,
               u.nombre_completo as usuario_nombre
        FROM insumos_precios ip
        LEFT JOIN usuarios u ON ip.usuario_id = u.id
        WHERE ip.insumo_id = ?
        ORDER BY ip.vigente_desde DESC
      `, [insumo_id])
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