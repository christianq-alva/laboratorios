#!/usr/bin/env node

/**
 * Script simple para ejecutar la limpieza de datos
 * 
 * Uso:
 * node scripts/ejecutar_limpieza.js [opcion]
 * 
 * Opciones:
 * - equipos: Limpiar solo equipos
 * - insumos: Limpiar solo insumos  
 * - reservas: Limpiar solo reservas
 * - todo: Limpiar todo
 * - verificar: Solo verificar datos actuales
 */

import { 
  limpiarEquipos, 
  limpiarInsumos, 
  limpiarReservas, 
  limpiarTodo, 
  verificarDatosActuales 
} from './limpiar_datos_selectivo.js'

async function main() {
  const opcion = process.argv[2]?.toLowerCase()
  
  console.log('🧹 Script de Limpieza de Datos')
  console.log('==============================')
  
  try {
    switch (opcion) {
      case 'equipos':
        console.log('🔧 Limpiando equipos...')
        await limpiarEquipos()
        break
        
      case 'insumos':
        console.log('🧪 Limpiando insumos...')
        await limpiarInsumos()
        break
        
      case 'reservas':
        console.log('📅 Limpiando reservas...')
        await limpiarReservas()
        break
        
      case 'todo':
        console.log('🧹 Limpiando todo...')
        await limpiarTodo()
        break
        
      case 'verificar':
        console.log('🔍 Verificando datos...')
        await verificarDatosActuales()
        break
        
      default:
        console.log('❌ Opción inválida')
        console.log('')
        console.log('Uso: node scripts/ejecutar_limpieza.js [opcion]')
        console.log('')
        console.log('Opciones disponibles:')
        console.log('  equipos   - Limpiar solo equipos y datos relacionados')
        console.log('  insumos   - Limpiar solo insumos y datos relacionados')
        console.log('  reservas  - Limpiar solo reservas/horarios')
        console.log('  todo      - Limpiar todo (equipos + insumos + reservas)')
        console.log('  verificar - Solo verificar datos actuales')
        console.log('')
        console.log('Ejemplos:')
        console.log('  node scripts/ejecutar_limpieza.js verificar')
        console.log('  node scripts/ejecutar_limpieza.js equipos')
        console.log('  node scripts/ejecutar_limpieza.js todo')
        return
    }
    
    console.log('✅ Operación completada')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

main()
