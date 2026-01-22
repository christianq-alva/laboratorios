import { pool } from '../config/database.js'

export const Unidad = {
  // Crear nueva unidad
  create: async (data, connection) => {
    const conn = connection || pool

    const [result] = await conn.execute(`
      INSERT INTO unidades (simbolo, nombre, descripcion) 
      VALUES (?, ?, ?)
    `, [data.simbolo, data.nombre, data.descripcion || ''])

    return result.insertId
  },

  // Actualizar unidad
  updateById: async (id, data, connection) => {
    const conn = connection || pool
    
    const [result] = await conn.execute(`
      UPDATE unidades 
      SET simbolo = ?, nombre = ?, descripcion = ?
      WHERE id = ?
    `, [data.simbolo, data.nombre, data.descripcion || '', id])

    return { affectedRows: result.affectedRows, changedRows: result.changedRows }
  },

  // Eliminar unidad
  deleteById: async (id, connection) => {
    const conn = connection || pool
    
    const [result] = await conn.execute('DELETE FROM unidades WHERE id = ?', [id])
    return { affectedRows: result.affectedRows }
  },

  // Verificar si existe una unidad
  existsById: async (id, connection) => {
    const conn = connection || pool
    
    const [rows] = await conn.execute('SELECT id FROM unidades WHERE id = ?', [id])
    return rows.length > 0
  },

  // Obtener unidad por ID
  getById: async (id, connection) => {
    const conn = connection || pool
    
    const [rows] = await conn.execute('SELECT id, simbolo, nombre, descripcion FROM unidades WHERE id = ?', [id])
    return rows[0] || null
  },

  // Obtener todas las unidades
  getAll: async (connection) => {
    const conn = connection || pool
    
    const [rows] = await conn.execute(`
      SELECT *
      FROM unidades
      ORDER BY nombre
    `)
    return rows
  },

  // Verificar relaciones antes de eliminar
  checkRelations: async (id, connection) => {
    const conn = connection || pool
    
    // Verificar si hay insumos que usan esta unidad
    const [insumos] = await conn.execute(
      'SELECT COUNT(*) as total FROM insumos WHERE unidad_id = ?',
      [id]
    )

    return {
      insumos: insumos[0].total,
      total: insumos[0].total
    }
  },

  // Verificar si existe una unidad con el mismo símbolo
  existsBySimbolo: async (simbolo, excludeId = null, connection) => {
    const conn = connection || pool
    
    let query = 'SELECT id FROM unidades WHERE simbolo = ?'
    const params = [simbolo]
    
    if (excludeId) {
      query += ' AND id != ?'
      params.push(excludeId)
    }
    
    const [rows] = await conn.execute(query, params)
    return rows.length > 0
  },

  // Verificar si existe una unidad con el mismo nombre
  existsByNombre: async (nombre, excludeId = null, connection) => {
    const conn = connection || pool
    
    let query = 'SELECT id FROM unidades WHERE nombre = ?'
    const params = [nombre]
    
    if (excludeId) {
      query += ' AND id != ?'
      params.push(excludeId)
    }
    
    const [rows] = await conn.execute(query, params)
    return rows.length > 0
  }
}

