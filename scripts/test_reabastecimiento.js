import { pool } from '../server/config/database.js'

async function testReabastecimiento() {
  try {
    console.log('🧪 Probando reabastecimiento...')
    
    // Verificar que existe al menos un insumo y un laboratorio
    const [insumos] = await pool.execute('SELECT id, nombre FROM insumos LIMIT 1')
    const [laboratorios] = await pool.execute('SELECT id, nombre FROM laboratorios LIMIT 1')
    
    if (insumos.length === 0) {
      console.log('❌ No hay insumos en la base de datos')
      return
    }
    
    if (laboratorios.length === 0) {
      console.log('❌ No hay laboratorios en la base de datos')
      return
    }
    
    const insumo = insumos[0]
    const laboratorio = laboratorios[0]
    
    console.log('📋 Datos de prueba:', {
      insumo: insumo.nombre,
      laboratorio: laboratorio.nombre
    })
    
    // Simular inserción en inventario_insumos
    try {
      await pool.execute(`
        INSERT INTO inventario_insumos (insumo_id, laboratorio_id, cantidad)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE cantidad = cantidad + VALUES(cantidad)
      `, [insumo.id, laboratorio.id, 10])
      console.log('✅ Inventario actualizado correctamente')
    } catch (invError) {
      console.error('❌ Error en inventario:', invError.message)
    }
    
    // Simular inserción en movimientos_insumos
    try {
      await pool.execute(`
        INSERT INTO movimientos_insumos 
        (insumo_id, laboratorio_id, tipo_movimiento, cantidad, observaciones, usuario_id, fecha_movimiento)
        VALUES (?, ?, 'entrada', ?, ?, ?, NOW())
      `, [insumo.id, laboratorio.id, 10, 'Prueba de reabastecimiento', 1])
      console.log('✅ Movimiento registrado correctamente')
    } catch (movError) {
      console.error('❌ Error en movimiento:', movError.message)
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message)
  } finally {
    process.exit(0)
  }
}

testReabastecimiento()
