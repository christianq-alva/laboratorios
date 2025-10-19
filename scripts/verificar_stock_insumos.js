import { pool } from '../server/config/database.js'
import dotenv from 'dotenv'

dotenv.config()

console.log('🔍 Verificando stock de insumos en la base de datos...\n')

async function verificarStockInsumos() {
  try {
    // Obtener todos los laboratorios
    const [laboratorios] = await pool.execute('SELECT id, nombre FROM laboratorios ORDER BY nombre')
    
    console.log(`📍 Laboratorios encontrados: ${laboratorios.length}\n`)
    
    for (const lab of laboratorios) {
      console.log(`\n${'='.repeat(60)}`)
      console.log(`🏢 LABORATORIO: ${lab.nombre} (ID: ${lab.id})`)
      console.log('='.repeat(60))
      
      // Obtener insumos del laboratorio con stock calculado
      const [insumos] = await pool.execute(`
        SELECT 
          i.id,
          i.codigo,
          i.nombre,
          i.categoria,
          COALESCE(inv.cantidad, 0) as stock_inventario,
          COALESCE(SUM(
            CASE 
              WHEN m.tipo_movimiento = 'entrada' THEN mid.cantidad
              WHEN m.tipo_movimiento = 'salida' THEN -mid.cantidad
              ELSE 0
            END
          ), 0) as stock_real_calculado
        FROM insumos i
        LEFT JOIN inventario_insumos inv ON i.id = inv.insumo_id AND inv.laboratorio_id = ?
        LEFT JOIN movimiento_insumo_detalle mid ON i.id = mid.insumo_id
        LEFT JOIN movimientos_insumos m ON mid.movimiento_id = m.id AND m.laboratorio_id = ?
        GROUP BY i.id, i.codigo, i.nombre, i.categoria, inv.cantidad
        ORDER BY i.nombre
      `, [lab.id, lab.id])
      
      let insumosConStock = 0
      let insumosSinStock = 0
      let insumosConInconsistencia = 0
      
      console.log('\n📦 INSUMOS:\n')
      
      insumos.forEach((insumo) => {
        const stockReal = insumo.stock_real_calculado || 0
        const stockInventario = insumo.stock_inventario || 0
        
        if (stockReal > 0) {
          insumosConStock++
        } else {
          insumosSinStock++
        }
        
        const inconsistente = stockInventario !== stockReal
        if (inconsistente) {
          insumosConInconsistencia++
        }
        
        const simbolo = stockReal > 0 ? '✅' : '❌'
        const alerta = inconsistente ? '⚠️ INCONSISTENCIA' : ''
        
        console.log(`${simbolo} ${insumo.nombre}`)
        console.log(`   Código: ${insumo.codigo || 'N/A'}`)
        console.log(`   Stock Real (calculado): ${stockReal}`)
        console.log(`   Stock Inventario (tabla): ${stockInventario}`)
        if (inconsistente) {
          console.log(`   ${alerta} - Diferencia: ${stockReal - stockInventario}`)
        }
        console.log('')
      })
      
      console.log(`\n📊 RESUMEN:`)
      console.log(`   Total de insumos: ${insumos.length}`)
      console.log(`   ✅ Con stock: ${insumosConStock}`)
      console.log(`   ❌ Sin stock: ${insumosSinStock}`)
      if (insumosConInconsistencia > 0) {
        console.log(`   ⚠️ Con inconsistencias: ${insumosConInconsistencia}`)
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ Verificación completada')
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('❌ Error al verificar stock:', error)
  } finally {
    await pool.end()
  }
}

verificarStockInsumos()

