import { pool } from '../config/database.js'

export const Insumo = {
  // Obtener insumos disponibles por laboratorio
  createInsumo: async (nombre, descripcion, unidad_medida, categoria, presentacion) => {
    const [insumoResult] = await pool.execute(`
      INSERT INTO insumos (codigo, nombre, descripcion, unidad_medida, categoria, presentacion) 
      VALUES ('PENDIENTE', ?, ?, ?, ?, ?)
    `, [nombre, descripcion || '', unidad_medida, categoria, presentacion || ''])

    const insumo_id = insumoResult.insertId
    
    const codigo = `INS-${insumo_id.toString().padStart(4, '0')}`

    await pool.execute('UPDATE insumos SET codigo = ? WHERE id = ?', [codigo, insumo_id])

    return {insumo_id, codigo};
  },

  updateInsumo: async (nombreLimpio, descripcionLimpia, unidadLimpia, categoria, presentacionLimpia, insumoId) => {
    // Actualizar insumo (fecha_vencimiento ahora se maneja en movimiento_insumo_detalle)
    await pool.execute(`
          UPDATE insumos 
          SET nombre = ?, descripcion = ?, unidad_medida = ?, categoria = ?, presentacion = ?
          WHERE id = ?
        `, [nombreLimpio, descripcionLimpia || '', unidadLimpia, categoria || 'Materiales', presentacionLimpia || '', insumoId])

    console.log('✅ Insumo actualizado exitosamente:', insumoId)
  },

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
      ORDER BY i.nombre ASC
    `, [laboratorio_id])

    // Para cada insumo, calcular el stock real (entradas - salidas)
    for (let insumo of rows) {
      // Calcular stock real: suma entradas y resta salidas
      const [stockCalculo] = await pool.execute(`
        SELECT 
          COALESCE(SUM(
            CASE 
              WHEN m.tipo_movimiento = 'entrada' THEN mid.cantidad
              WHEN m.tipo_movimiento = 'salida' THEN -mid.cantidad
              ELSE 0
            END
          ), 0) as stock_real
        FROM movimiento_insumo_detalle mid
        INNER JOIN movimientos_insumos m ON mid.movimiento_id = m.id
        WHERE mid.insumo_id = ? AND m.laboratorio_id = ?
      `, [insumo.id, laboratorio_id])

      insumo.stock_total_lotes = stockCalculo[0]?.stock_real || 0

      // Obtener lotes solo de entrada para información detallada
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

      // Lotes próximos a vencer (dentro de 30 días)
      insumo.lotes_proximos_vencer = lotes.filter(l => {
        if (!l.fecha_vencimiento) return false
        const diasParaVencer = Math.ceil((new Date(l.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24))
        return diasParaVencer <= 30 && diasParaVencer >= 0
      }).length
    }

    console.log('📦 Insumos encontrados para laboratorio', laboratorio_id, ':', rows.length)
    console.log('📋 Primeros 3 insumos con stock:', rows.slice(0, 3).map(i => ({
      nombre: i.nombre,
      stock_disponible: i.stock_disponible,
      stock_total_lotes: i.stock_total_lotes
    })))

    return rows
  },

  // Verificar stock disponible (calculado desde movimientos reales)
  checkStock: async (insumo_id, laboratorio_id, cantidad_requerida) => {
    const [rows] = await pool.execute(`
      SELECT 
        COALESCE(SUM(
          CASE 
            WHEN m.tipo_movimiento = 'entrada' THEN mid.cantidad
            WHEN m.tipo_movimiento = 'salida' THEN -mid.cantidad
            ELSE 0
          END
        ), 0) as stock_real
      FROM movimiento_insumo_detalle mid
      INNER JOIN movimientos_insumos m ON mid.movimiento_id = m.id
      WHERE mid.insumo_id = ? AND m.laboratorio_id = ?
    `, [insumo_id, laboratorio_id])

    const stock_actual = rows[0]?.stock_real || 0
    console.log(`🔍 CheckStock - Insumo ${insumo_id}, Lab ${laboratorio_id}: Stock=${stock_actual}, Requerido=${cantidad_requerida}`)
    return stock_actual >= cantidad_requerida
  },

  // Reducir stock (con transacción)
  reducirStock: async (connection, insumo_id, laboratorio_id, cantidad, usuario_id, reserva_id) => {
    // Actualizar inventario (legacy - para compatibilidad)
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

    // Registrar movimiento de salida (estructura correcta)
    const [movimientoResult] = await connection.execute(`
      INSERT INTO movimientos_insumos 
      (laboratorio_id, usuario_id, tipo_movimiento, reserva_id, observaciones, fecha_movimiento)
      VALUES (?, ?, 'salida', ?, 'Consumo por reserva', ?)
    `, [laboratorio_id, usuario_id, reserva_id, fechaPeru])

    const movimiento_id = movimientoResult.insertId

    // Registrar detalle del movimiento
    await connection.execute(`
      INSERT INTO movimiento_insumo_detalle 
      (movimiento_id, insumo_id, cantidad, lote)
      VALUES (?, ?, ?, 'SALIDA-RESERVA')
    `, [movimiento_id, insumo_id, cantidad])
  },

  getAllInsumos: async () => {
    const insumos = pool.execute(`
      SELECT *
      FROM insumos
      ORDER BY nombre;
      `)
    return insumos;
  },
}