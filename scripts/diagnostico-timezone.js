#!/usr/bin/env node

/**
 * Script de diagnóstico para problemas de zona horaria
 * Ejecutar: node scripts/diagnostico-timezone.js
 */

console.log('🕐 DIAGNÓSTICO DE ZONA HORARIA')
console.log('================================\n')

// 1. Información del sistema
console.log('📍 INFORMACIÓN DEL SISTEMA:')
console.log('- Zona horaria configurada (TZ):', process.env.TZ || 'No configurado')
console.log('- Plataforma:', process.platform)
console.log('- Versión Node.js:', process.version)
console.log('')

// 2. Fechas actuales
const ahora = new Date()
console.log('📅 FECHAS ACTUALES:')
console.log('- UTC:', ahora.toISOString())
console.log('- Local:', ahora.toLocaleString())
console.log('- Local (es-PE):', ahora.toLocaleString('es-PE', { timeZone: 'America/Lima' }))
console.log('- Offset minutos:', ahora.getTimezoneOffset())
console.log('- Offset horas:', ahora.getTimezoneOffset() / -60)
console.log('')

// 3. Simulación de conversión de fecha
console.log('🔄 SIMULACIÓN DE CONVERSIÓN:')

// Función de conversión (copia de la del backend)
const convertirFechaParaMySQL = (fechaInput) => {
  if (!fechaInput) return null
  
  console.log('  Input:', fechaInput)
  
  // Si la fecha ya viene en formato YYYY-MM-DD HH:MM:SS, la usamos directamente
  if (fechaInput.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
    console.log('  ✅ Formato YYYY-MM-DD HH:MM:SS detectado')
    return fechaInput
  }
  
  // Si viene en formato YYYY-MM-DDTHH:MM:SS (datetime-local con segundos)
  if (fechaInput.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)) {
    const resultado = fechaInput.replace('T', ' ')
    console.log('  ✅ Formato ISO local detectado, convertido a:', resultado)
    return resultado
  }
  
  // Si es una fecha ISO con zona horaria, mantenemos solo la parte local
  if (fechaInput.includes('T')) {
    const resultado = fechaInput.slice(0, 19).replace('T', ' ')
    console.log('  ✅ Fecha ISO con zona horaria, usando parte local:', resultado)
    return resultado
  }
  
  // Fallback: intentar parsear como fecha
  console.log('  ⚠️ Usando fallback para parsear fecha')
  const fecha = new Date(fechaInput)
  if (!isNaN(fecha.getTime())) {
    const year = fecha.getFullYear()
    const month = String(fecha.getMonth() + 1).padStart(2, '0')
    const day = String(fecha.getDate()).padStart(2, '0')
    const hours = String(fecha.getHours()).padStart(2, '0')
    const minutes = String(fecha.getMinutes()).padStart(2, '0')
    const seconds = String(fecha.getSeconds()).padStart(2, '0')
    const resultado = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    console.log('  ✅ Fecha parseada como local:', resultado)
    return resultado
  }
  
  console.log('  ❌ No se pudo parsear la fecha')
  return null
}

// Casos de prueba
const casosPrueba = [
  '2024-01-15 07:30:00',
  '2024-01-15T07:30:00',
  '2024-01-15T07:30:00.000Z',
  '2024-01-15T12:30:00.000Z'  // UTC que debería convertirse a 07:30 local
]

casosPrueba.forEach((caso, index) => {
  console.log(`\nCaso ${index + 1}: ${caso}`)
  const resultado = convertirFechaParaMySQL(caso)
  console.log(`  Resultado: ${resultado}`)
})

// 4. Recomendaciones
console.log('\n🔧 RECOMENDACIONES:')
console.log('1. En Railway, configura la variable de entorno: TZ=America/Lima')
console.log('2. Verifica que el Dockerfile tenga la configuración de zona horaria')
console.log('3. Usa el endpoint /api/horarios/diagnostico/timezone para verificar en producción')
console.log('')

// 5. Comando para Railway
console.log('💡 COMANDO PARA RAILWAY:')
console.log('railway variables set TZ=America/Lima')
console.log('')

console.log('✅ Diagnóstico completado')
