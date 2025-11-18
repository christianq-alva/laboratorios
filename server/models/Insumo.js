import { pool } from '../config/database.js'

export const Insumo = {
  // Crear nuevo insumo
  create: async (nombre, descripcion, unidad_id, categoria, presentacion, connection) => {
    const conn = connection || pool

    const [insumoResult] = await conn.execute(`
      INSERT INTO insumos (codigo, nombre, descripcion, unidad_id, categoria, presentacion) 
      VALUES ('PENDIENTE', ?, ?, ?, ?, ?)
    `, [nombre, descripcion || '', unidad_id, categoria, presentacion || ''])

    const insumo_id = insumoResult.insertId
    const codigo = `INS-${insumo_id.toString().padStart(4, '0')}`

    await conn.execute('UPDATE insumos SET codigo = ? WHERE id = ?', [codigo, insumo_id])

    return { insumo_id, codigo }
  },

  // Actualizar insumo
  updateById: async (id, data, connection) => {
    const conn = connection || pool
    
    const [result] = await conn.execute(`
      UPDATE insumos 
      SET nombre = ?, descripcion = ?, unidad_id = ?, categoria = ?, presentacion = ?
      WHERE id = ?
    `, [data.nombre, data.descripcion || '', data.unidad_id, data.categoria, data.presentacion, id])

    return { affectedRows: result.affectedRows, changedRows: result.changedRows }
  },

  // Eliminar insumo
  deleteById: async (id, connection) => {
    const conn = connection || pool
    
    const [result] = await conn.execute('DELETE FROM insumos WHERE id = ?', [id])
    return { affectedRows: result.affectedRows }
  },

  // Verificar si existe un insumo
  existsById: async (id, connection) => {
    const conn = connection || pool
    
    const [rows] = await conn.execute('SELECT id FROM insumos WHERE id = ?', [id])
    return rows.length > 0
  },

  // Obtener insumo por ID
  getById: async (id, connection) => {
    const conn = connection || pool
    
    const [rows] = await conn.execute(`
      SELECT i.id, i.codigo, i.nombre, i.descripcion, i.unidad_id, u.simbolo as unidad_simbolo, u.nombre as unidad_nombre
      FROM insumos i
      LEFT JOIN unidades u ON i.unidad_id = u.id
      WHERE i.id = ?
    `, [id])
    return rows[0] || null
  },

  // Obtener todos los insumos
  getAll: async (connection) => {
    const conn = connection || pool
    
    const [rows] = await conn.execute(`
      SELECT i.id, i.codigo, i.nombre, i.descripcion, i.categoria, i.presentacion, i.unidad_id, u.simbolo as unidad_simbolo, u.nombre as unidad_nombre
      FROM insumos i
      LEFT JOIN unidades u ON i.unidad_id = u.id
      ORDER BY i.nombre
    `)
    return rows
  },

  // Verificar relaciones antes de eliminar
  checkRelations: async (id, connection) => {
    const conn = connection || pool
    
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
  },
}