import { pool } from '../server/config/database.js'

/**
 * Script para limpiar datos de equipos e insumos de forma selectiva
 * 
 * Este script te permite elegir qué datos limpiar:
 * - Solo equipos
 * - Solo insumos  
 * - Solo reservas/horarios
 * - Todo
 */

async function mostrarMenu() {
  console.log('\n🧹 Script de Limpieza Selectiva de Datos')
  console.log('==========================================')
  console.log('1. Limpiar solo EQUIPOS (y datos relacionados)')
  console.log('2. Limpiar solo INSUMOS (y datos relacionados)')
  console.log('3. Limpiar solo RESERVAS/HORARIOS')
  console.log('4. Limpiar TODO (equipos + insumos + reservas)')
  console.log('5. Solo verificar datos actuales')
  console.log('0. Salir')
  console.log('')
}

async function verificarDatosActuales() {
  try {
    console.log('\n📊 Datos actuales en la base de datos:')
    console.log('=====================================')
    
    const tablas = [
      { nombre: 'equipos', descripcion: 'Equipos registrados' },
      { nombre: 'insumos', descripcion: 'Insumos registrados' },
      { nombre: 'reservas', descripcion: 'Reservas/Horarios' },
      { nombre: 'inventario_equipos', descripcion: 'Inventario de equipos' },
      { nombre: 'inventario_insumos', descripcion: 'Inventario de insumos' },
      { nombre: 'movimientos_equipos', descripcion: 'Movimientos de equipos' },
      { nombre: 'movimientos_insumos', descripcion: 'Movimientos de insumos' },
      { nombre: 'detalle_reserva_equipos', descripcion: 'Detalles de equipos en reservas' },
      { nombre: 'detalle_reserva_insumos', descripcion: 'Detalles de insumos en reservas' },
      { nombre: 'actividad_equipos', descripcion: 'Actividad de equipos' },
      { nombre: 'actividad_insumos', descripcion: 'Actividad de insumos' },
      { nombre: 'actividad_horarios', descripcion: 'Actividad de horarios' }
    ]
    
    for (const tabla of tablas) {
      try {
        const [rows] = await pool.execute(`SELECT COUNT(*) as count FROM ${tabla.nombre}`)
        const count = rows[0].count
        console.log(`   ${tabla.nombre.padEnd(25)} | ${count.toString().padStart(6)} registros | ${tabla.descripcion}`)
      } catch (error) {
        console.log(`   ${tabla.nombre.padEnd(25)} | ERROR    | ${tabla.descripcion}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error al verificar datos:', error)
  }
}

async function limpiarEquipos() {
  const connection = await pool.getConnection()
  
  try {
    console.log('\n🔧 Limpiando datos de EQUIPOS...')
    await connection.beginTransaction()
    
    // Limpiar en orden de dependencias
    await connection.execute('DELETE FROM actividad_equipos')
    await connection.execute('DELETE FROM movimientos_equipos')
    await connection.execute('DELETE FROM detalle_reserva_equipos')
    await connection.execute('DELETE FROM inventario_equipos')
    await connection.execute('DELETE FROM equipos')
    
    // Resetear auto_increment
    await connection.execute('ALTER TABLE equipos AUTO_INCREMENT = 1')
    await connection.execute('ALTER TABLE inventario_equipos AUTO_INCREMENT = 1')
    await connection.execute('ALTER TABLE movimientos_equipos AUTO_INCREMENT = 1')
    await connection.execute('ALTER TABLE detalle_reserva_equipos AUTO_INCREMENT = 1')
    await connection.execute('ALTER TABLE actividad_equipos AUTO_INCREMENT = 1')
    
    await connection.commit()
    console.log('✅ Equipos limpiados exitosamente')
    
  } catch (error) {
    await connection.rollback()
    console.error('❌ Error al limpiar equipos:', error)
    throw error
  } finally {
    connection.release()
  }
}

async function limpiarInsumos() {
  const connection = await pool.getConnection()
  
  try {
    console.log('\n🧪 Limpiando datos de INSUMOS...')
    await connection.beginTransaction()
    
    // Limpiar en orden de dependencias
    await connection.execute('DELETE FROM actividad_insumos')
    await connection.execute('DELETE FROM movimientos_insumos')
    await connection.execute('DELETE FROM detalle_reserva_insumos')
    await connection.execute('DELETE FROM inventario_insumos')
    await connection.execute('DELETE FROM insumos')
    
    // Resetear auto_increment
    await connection.execute('ALTER TABLE insumos AUTO_INCREMENT = 1')
    await connection.execute('ALTER TABLE inventario_insumos AUTO_INCREMENT = 1')
    await connection.execute('ALTER TABLE movimientos_insumos AUTO_INCREMENT = 1')
    await connection.execute('ALTER TABLE detalle_reserva_insumos AUTO_INCREMENT = 1')
    await connection.execute('ALTER TABLE actividad_insumos AUTO_INCREMENT = 1')
    
    await connection.commit()
    console.log('✅ Insumos limpiados exitosamente')
    
  } catch (error) {
    await connection.rollback()
    console.error('❌ Error al limpiar insumos:', error)
    throw error
  } finally {
    connection.release()
  }
}

async function limpiarReservas() {
  const connection = await pool.getConnection()
  
  try {
    console.log('\n📅 Limpiando datos de RESERVAS/HORARIOS...')
    await connection.beginTransaction()
    
    // Limpiar en orden de dependencias
    await connection.execute('DELETE FROM actividad_horarios')
    await connection.execute('DELETE FROM detalle_reserva_equipos')
    await connection.execute('DELETE FROM detalle_reserva_insumos')
    await connection.execute('DELETE FROM reservas')
    
    // Resetear auto_increment
    await connection.execute('ALTER TABLE reservas AUTO_INCREMENT = 1')
    await connection.execute('ALTER TABLE detalle_reserva_equipos AUTO_INCREMENT = 1')
    await connection.execute('ALTER TABLE detalle_reserva_insumos AUTO_INCREMENT = 1')
    await connection.execute('ALTER TABLE actividad_horarios AUTO_INCREMENT = 1')
    
    await connection.commit()
    console.log('✅ Reservas/Horarios limpiados exitosamente')
    
  } catch (error) {
    await connection.rollback()
    console.error('❌ Error al limpiar reservas:', error)
    throw error
  } finally {
    connection.release()
  }
}

async function limpiarTodo() {
  const connection = await pool.getConnection()
  
  try {
    console.log('\n🧹 Limpiando TODOS los datos...')
    await connection.beginTransaction()
    
    // Limpiar en orden de dependencias
    await connection.execute('DELETE FROM actividad_equipos')
    await connection.execute('DELETE FROM actividad_insumos')
    await connection.execute('DELETE FROM actividad_horarios')
    await connection.execute('DELETE FROM movimientos_equipos')
    await connection.execute('DELETE FROM movimientos_insumos')
    await connection.execute('DELETE FROM detalle_reserva_equipos')
    await connection.execute('DELETE FROM detalle_reserva_insumos')
    await connection.execute('DELETE FROM inventario_equipos')
    await connection.execute('DELETE FROM inventario_insumos')
    await connection.execute('DELETE FROM reservas')
    await connection.execute('DELETE FROM equipos')
    await connection.execute('DELETE FROM insumos')
    
    // Resetear auto_increment
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
    
    await connection.commit()
    console.log('✅ Todos los datos limpiados exitosamente')
    
  } catch (error) {
    await connection.rollback()
    console.error('❌ Error al limpiar todos los datos:', error)
    throw error
  } finally {
    connection.release()
  }
}

async function pedirConfirmacion(accion) {
  console.log(`\n⚠️  ADVERTENCIA: Estás a punto de ${accion}`)
  console.log('⚠️  Esta acción NO se puede deshacer')
  console.log('⚠️  Se eliminarán todos los datos relacionados')
  console.log('')
  
  // En un entorno real, aquí podrías usar readline para pedir confirmación
  // Por ahora, solo mostramos la advertencia
  console.log('✅ Continuando con la operación...')
}

// Función principal
async function main() {
  try {
    while (true) {
      await mostrarMenu()
      
      // En un entorno real, aquí usarías readline para obtener la opción del usuario
      // Por ahora, vamos a usar un ejemplo con la opción 5 (verificar datos)
      const opcion = 5 // Cambia este número para probar diferentes opciones
      
      switch (opcion) {
        case 1:
          await pedirConfirmacion('limpiar todos los datos de EQUIPOS')
          await limpiarEquipos()
          break
          
        case 2:
          await pedirConfirmacion('limpiar todos los datos de INSUMOS')
          await limpiarInsumos()
          break
          
        case 3:
          await pedirConfirmacion('limpiar todos los datos de RESERVAS/HORARIOS')
          await limpiarReservas()
          break
          
        case 4:
          await pedirConfirmacion('limpiar TODOS los datos (equipos + insumos + reservas)')
          await limpiarTodo()
          break
          
        case 5:
          await verificarDatosActuales()
          break
          
        case 0:
          console.log('👋 Saliendo...')
          return
          
        default:
          console.log('❌ Opción inválida')
          continue
      }
      
      // Verificar datos después de cada operación
      if (opcion >= 1 && opcion <= 4) {
        await verificarDatosActuales()
      }
      
      console.log('\n' + '='.repeat(50))
    }
    
  } catch (error) {
    console.error('❌ Error en el script principal:', error)
  } finally {
    await pool.end()
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { limpiarEquipos, limpiarInsumos, limpiarReservas, limpiarTodo, verificarDatosActuales }
