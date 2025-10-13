import { pool } from '../config/database.js'

export const Insumo = {
  // Obtener insumos disponibles por laboratorio
  getByLaboratorio: async (laboratorio_id) => {
    console.log('🔍 Insumo.getByLaboratorio - Consultando laboratorio:', laboratorio_id)
    
    const [rows] = await pool.execute(`
      SELECT 
        i.id,
        i.codigo,
        i.nombre,
        i.descripcion,
        i.unidad_medida,
        i.categoria,
        i.presentacion,
        COALESCE(inv.cantidad, 0) as stock_disponible
      FROM insumos i
      LEFT JOIN inventario_insumos inv ON i.id = inv.insumo_id AND inv.laboratorio_id = ?
      ORDER BY i.categoria, i.codigo, i.nombre
    `, [laboratorio_id])
    
    // Para cada insumo, obtener información detallada de lotes (todos los registros individuales)
    for (let insumo of rows) {
      const [lotes] = await pool.execute(`
        SELECT 
          mid.id as detalle_id,
          COALESCE(mid.lote, 'SIN-LOTE') as lote,
          mid.cantidad,
          mid.fecha_vencimiento,
          m.fecha_ingreso,
          m.fecha_movimiento
        FROM movimiento_insumo_detalle mid
        INNER JOIN movimientos_insumos m ON mid.movimiento_id = m.id
        WHERE mid.insumo_id = ? AND m.laboratorio_id = ? AND m.tipo_movimiento = 'entrada'
        ORDER BY m.fecha_ingreso DESC, mid.fecha_vencimiento ASC
      `, [insumo.id, laboratorio_id])
      
      insumo.lotes = lotes
      insumo.total_lotes = lotes.length
      
      // Calcular stock total de todos los lotes
      insumo.stock_total_lotes = lotes.reduce((sum, lote) => sum + (lote.cantidad || 0), 0)
      
      // Lotes próximos a vencer (dentro de 30 días)
      insumo.lotes_proximos_vencer = lotes.filter(l => {
        if (!l.fecha_vencimiento) return false
        const diasParaVencer = Math.ceil((new Date(l.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24))
        return diasParaVencer <= 30 && diasParaVencer >= 0
      }).length
    }
    
    console.log('📦 Insumos encontrados para laboratorio', laboratorio_id, ':', rows.length)
    console.log('📋 Primeros 3 insumos:', rows.slice(0, 3))
    
    return rows
  },

  // Verificar stock disponible
  checkStock: async (insumo_id, laboratorio_id, cantidad_requerida) => {
    const [rows] = await pool.execute(`
      SELECT cantidad 
      FROM inventario_insumos 
      WHERE insumo_id = ? AND laboratorio_id = ?
    `, [insumo_id, laboratorio_id])
    
    const stock_actual = rows[0]?.cantidad || 0
    return stock_actual >= cantidad_requerida
  },

  // Reducir stock (con transacción)
  reducirStock: async (connection, insumo_id, laboratorio_id, cantidad, usuario_id, reserva_id) => {
    // Actualizar inventario
    await connection.execute(`
      UPDATE inventario_insumos 
      SET cantidad = cantidad - ? 
      WHERE insumo_id = ? AND laboratorio_id = ?
    `, [cantidad, insumo_id, laboratorio_id])
    
    // Crear fecha en zona horaria de Perú
    const fechaPeru = new Date().toLocaleString('en-CA', { 
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(', ', ' ')

    // Registrar movimiento
    await connection.execute(`
      INSERT INTO movimientos_insumos 
      (insumo_id, laboratorio_id, usuario_id, tipo_movimiento, cantidad, reserva_id, observaciones, fecha_movimiento)
      VALUES (?, ?, ?, 'salida', ?, ?, 'Consumo por reserva', ?)
    `, [insumo_id, laboratorio_id, usuario_id, cantidad, reserva_id, fechaPeru])
  }
}