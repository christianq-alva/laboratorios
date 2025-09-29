import { pool } from '../server/config/database.js'

/**
 * Script para limpiar datos de equipos e insumos de forma segura
 * 
 * Este script elimina los datos en el orden correcto para respetar
 * las restricciones de claves foráneas.
 * 
 * ⚠️ ADVERTENCIA: Este script eliminará TODOS los datos relacionados
 * con equipos e insumos. Úsalo solo si estás seguro.
 */

const TABLAS_RELACIONADAS = {
  // Tablas que referencian equipos
  equipos: [
    'detalle_reserva_equipos',    // Referencia equipo_id
    'inventario_equipos',         // Referencia equipo_id
    'movimientos_equipos',        // Referencia equipo_id
    'actividad_equipos'           // Referencia equipo_id
  ],
  
  // Tablas que referencian insumos
  insumos: [
    'detalle_reserva_insumos',    // Referencia insumo_id
    'inventario_insumos',         // Referencia insumo_id
    'movimientos_insumos',        // Referencia insumo_id
    'actividad_insumos'           // Referencia insumo_id
  ],
  
  // Tablas que referencian reservas (que a su vez referencian equipos/insumos)
  reservas: [
    'detalle_reserva_equipos',    // Referencia reserva_id
    'detalle_reserva_insumos',    // Referencia reserva_id
    'actividad_horarios'          // Referencia reserva_id
  ]
}

async function limpiarDatos() {
  const connection = await pool.getConnection()
  
  try {
    console.log('🚀 Iniciando limpieza de datos de equipos e insumos...')
    
    await connection.beginTransaction()
    
    // 1. Limpiar tablas de actividad (no tienen restricciones)
    console.log('📋 Limpiando tablas de actividad...')
    await connection.execute('DELETE FROM actividad_equipos')
    await connection.execute('DELETE FROM actividad_insumos')
    await connection.execute('DELETE FROM actividad_horarios')
    console.log('✅ Tablas de actividad limpiadas')
    
    // 2. Limpiar movimientos (referencian equipos/insumos)
    console.log('📋 Limpiando movimientos...')
    await connection.execute('DELETE FROM movimientos_equipos')
    await connection.execute('DELETE FROM movimientos_insumos')
    console.log('✅ Movimientos limpiados')
    
    // 3. Limpiar detalles de reservas (referencian equipos/insumos y reservas)
    console.log('📋 Limpiando detalles de reservas...')
    await connection.execute('DELETE FROM detalle_reserva_equipos')
    await connection.execute('DELETE FROM detalle_reserva_insumos')
    console.log('✅ Detalles de reservas limpiados')
    
    // 4. Limpiar inventarios (referencian equipos/insumos)
    console.log('📋 Limpiando inventarios...')
    await connection.execute('DELETE FROM inventario_equipos')
    await connection.execute('DELETE FROM inventario_insumos')
    console.log('✅ Inventarios limpiados')
    
    // 5. Limpiar reservas (referencian laboratorios, docentes, grupos)
    console.log('📋 Limpiando reservas...')
    await connection.execute('DELETE FROM reservas')
    console.log('✅ Reservas limpiadas')
    
    // 6. Limpiar equipos e insumos (tablas principales)
    console.log('📋 Limpiando equipos e insumos...')
    await connection.execute('DELETE FROM equipos')
    await connection.execute('DELETE FROM insumos')
    console.log('✅ Equipos e insumos limpiados')
    
    // 7. Resetear auto_increment para empezar desde 1
    console.log('🔄 Reseteando contadores de auto_increment...')
    await connection.execute('ALTER TABLE equipos AUTO_INCREMENT = 1')
    await connection.execute('ALTER TABLE insumos AUTO_INCREMENT = 1')
    await connection.execute('ALTER TABLE reservas AUTO_INCREMENT = 1')
    await connection.execute('ALTER TABLE inventario_equipos AUTO_INCREMENT = 1')
    await connection.execute('ALTER TABLE inventario_insumos AUTO_INCREMENT = 1')
    await connection.execute('ALTER TABLE movimientos_equipos AUTO_INCREMENT = 1')
    await connection.execute('ALTER TABLE movimientos_insumos AUTO_INCREMENT = 1')
    await connection.execute('ALTER TABLE detalle_reserva_equipos AUTO_INCREMENT = 1')
    await connection.execute('ALTER TABLE detalle_reserva_insumos AUTO_INCREMENT = 1')
    await connection.execute('ALTER TABLE actividad_equipos AUTO_INCREMENT = 1')
    await connection.execute('ALTER TABLE actividad_insumos AUTO_INCREMENT = 1')
    await connection.execute('ALTER TABLE actividad_horarios AUTO_INCREMENT = 1')
    console.log('✅ Contadores reseteados')
    
    await connection.commit()
    
    console.log('🎉 ¡Limpieza completada exitosamente!')
    console.log('📊 Resumen de tablas limpiadas:')
    console.log('   - equipos')
    console.log('   - insumos')
    console.log('   - reservas')
    console.log('   - inventario_equipos')
    console.log('   - inventario_insumos')
    console.log('   - movimientos_equipos')
    console.log('   - movimientos_insumos')
    console.log('   - detalle_reserva_equipos')
    console.log('   - detalle_reserva_insumos')
    console.log('   - actividad_equipos')
    console.log('   - actividad_insumos')
    console.log('   - actividad_horarios')
    
  } catch (error) {
    await connection.rollback()
    console.error('❌ Error durante la limpieza:', error)
    throw error
  } finally {
    connection.release()
  }
}

async function verificarLimpieza() {
  try {
    console.log('\n🔍 Verificando limpieza...')
    
    const tablas = [
      'equipos', 'insumos', 'reservas', 'inventario_equipos', 'inventario_insumos',
      'movimientos_equipos', 'movimientos_insumos', 'detalle_reserva_equipos',
      'detalle_reserva_insumos', 'actividad_equipos', 'actividad_insumos', 'actividad_horarios'
    ]
    
    for (const tabla of tablas) {
      const [rows] = await pool.execute(`SELECT COUNT(*) as count FROM ${tabla}`)
      const count = rows[0].count
      console.log(`   ${tabla}: ${count} registros`)
    }
    
    console.log('✅ Verificación completada')
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error)
  }
}

// Función principal
async function main() {
  try {
    console.log('⚠️  ADVERTENCIA: Este script eliminará TODOS los datos de equipos e insumos')
    console.log('⚠️  Incluyendo reservas, inventarios, movimientos y actividades relacionadas')
    console.log('⚠️  Esta acción NO se puede deshacer')
    console.log('')
    
    // En un entorno de producción, aquí podrías pedir confirmación
    // const readline = require('readline')
    // const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    // const answer = await new Promise(resolve => rl.question('¿Estás seguro? (escribe "CONFIRMAR"): ', resolve))
    // rl.close()
    // if (answer !== 'CONFIRMAR') {
    //   console.log('❌ Operación cancelada')
    //   return
    // }
    
    await limpiarDatos()
    await verificarLimpieza()
    
  } catch (error) {
    console.error('❌ Error en el script principal:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { limpiarDatos, verificarLimpieza }
