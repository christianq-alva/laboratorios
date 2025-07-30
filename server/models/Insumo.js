import { pool } from '../config/database.js'

export const Insumo = {
  // Obtener insumos disponibles por laboratorio
  getByLaboratorio: async (laboratorio_id) => {
    console.log('🔍 Insumo.getByLaboratorio - Consultando laboratorio:', laboratorio_id)
    
    const [rows] = await pool.execute(`
      SELECT 
        i.id,
        i.nombre,
        i.descripcion,
        i.unidad_medida,
        COALESCE(inv.stock_actual, 0) as stock_disponible
      FROM insumos i
      LEFT JOIN inventario_insumos inv ON i.id = inv.insumo_id AND inv.laboratorio_id = ?
      ORDER BY i.nombre
    `, [laboratorio_id])
    
    console.log('📦 Insumos encontrados para laboratorio', laboratorio_id, ':', rows.length)
    console.log('📋 Primeros 3 insumos:', rows.slice(0, 3))
    
    return rows
  },

  // Verificar stock disponible
  checkStock: async (insumo_id, laboratorio_id, cantidad_requerida) => {
    const [rows] = await pool.execute(`
      SELECT stock_actual 
      FROM inventario_insumos 
      WHERE insumo_id = ? AND laboratorio_id = ?
    `, [insumo_id, laboratorio_id])
    
    const stock_actual = rows[0]?.stock_actual || 0
    return stock_actual >= cantidad_requerida
  },

  // Reducir stock (con transacción)
  reducirStock: async (connection, insumo_id, laboratorio_id, cantidad, usuario_id, reserva_id) => {
    // Actualizar inventario
    await connection.execute(`
      UPDATE inventario_insumos 
      SET stock_actual = stock_actual - ? 
      WHERE insumo_id = ? AND laboratorio_id = ?
    `, [cantidad, insumo_id, laboratorio_id])
    
    // Registrar movimiento
    await connection.execute(`
      INSERT INTO movimientos_insumos 
      (insumo_id, laboratorio_id, usuario_id, tipo_movimiento, cantidad, reserva_id, observaciones)
      VALUES (?, ?, ?, 'salida', ?, ?, 'Consumo por reserva')
    `, [insumo_id, laboratorio_id, usuario_id, cantidad, reserva_id])
  }
}