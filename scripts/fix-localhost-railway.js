#!/usr/bin/env node

/**
 * Script final para resolver el problema de localhost en Railway
 * Proporciona instrucciones específicas y verificaciones
 */

console.log('🚀 === SOLUCIONADOR DE LOCALHOST EN RAILWAY ===')
console.log('Timestamp:', new Date().toISOString())
console.log()

console.log('🎯 PROBLEMA: Los enlaces compartidos usan localhost en lugar de la URL de producción')
console.log('✅ ANÁLISIS: La lógica del código es CORRECTA')
console.log('🔧 SOLUCIÓN: Configurar variables de entorno en Railway')
console.log()

// Función para mostrar el estado actual
function showCurrentStatus() {
  console.log('📊 === ESTADO ACTUAL DEL ENTORNO ===')
  console.log()
  
  const criticalVars = {
    'NODE_ENV': process.env.NODE_ENV,
    'RAILWAY_ENVIRONMENT': process.env.RAILWAY_ENVIRONMENT,
    'RAILWAY_PROJECT_ID': process.env.RAILWAY_PROJECT_ID,
    'FRONTEND_URL': process.env.FRONTEND_URL,
    'VITE_BASE_URL': process.env.VITE_BASE_URL,
    'RAILWAY_STATIC_URL': process.env.RAILWAY_STATIC_URL,
    'PORT': process.env.PORT
  }
  
  let hasProductionVars = false
  
  Object.entries(criticalVars).forEach(([key, value]) => {
    const status = value ? '✅' : '❌'
    console.log(`   ${status} ${key}: ${value || 'NO DEFINIDA'}`)
    
    if (value && ['RAILWAY_ENVIRONMENT', 'RAILWAY_PROJECT_ID', 'FRONTEND_URL', 'VITE_BASE_URL', 'PORT'].includes(key)) {
      hasProductionVars = true
    }
  })
  
  console.log()
  
  if (hasProductionVars) {
    console.log('✅ DETECCIÓN: Entorno de producción detectado')
    console.log('🎯 EXPECTATIVA: Los enlaces deberían usar URL de producción')
  } else {
    console.log('🚨 DETECCIÓN: Entorno de desarrollo local')
    console.log('🎯 EXPECTATIVA: Los enlaces usarán localhost (normal para desarrollo)')
  }
  
  return hasProductionVars
}

// Función para generar instrucciones específicas
function generateInstructions(isProduction) {
  console.log('\n📋 === INSTRUCCIONES ESPECÍFICAS ===')
  console.log()
  
  if (!isProduction) {
    console.log('🏠 EJECUTÁNDOSE LOCALMENTE')
    console.log()
    console.log('Para resolver el problema en Railway, sigue estos pasos:')
    console.log()
    
    console.log('🔧 PASO 1: Configurar Variables en Railway')
    console.log('   1. Ve a https://railway.app')
    console.log('   2. Selecciona tu proyecto')
    console.log('   3. Ve a la pestaña "Variables"')
    console.log('   4. Agrega esta variable:')
    console.log()
    console.log('      Nombre: FRONTEND_URL')
    console.log('      Valor: https://beneficial-wholeness-production-9cd6.up.railway.app')
    console.log()
    console.log('   5. Haz clic en "Add" o "Save"')
    console.log()
    
    console.log('🔄 PASO 2: Forzar Redeploy')
    console.log('   Opción A - Desde Railway:')
    console.log('      1. Ve a "Deployments"')
    console.log('      2. Haz clic en "Redeploy" en el último deployment')
    console.log()
    console.log('   Opción B - Desde tu código:')
    console.log('      1. Haz un cambio mínimo en cualquier archivo')
    console.log('      2. git add . && git commit -m "fix: force redeploy"')
    console.log('      3. git push')
    console.log()
    
    console.log('✅ PASO 3: Verificar')
    console.log('   1. Espera a que termine el deployment')
    console.log('   2. Ve a los logs del deployment')
    console.log('   3. Busca líneas que empiecen con "🔗"')
    console.log('   4. Crea un nuevo enlace compartido')
    console.log('   5. Verifica que use la URL de producción')
    console.log()
    
  } else {
    console.log('🚂 EJECUTÁNDOSE EN RAILWAY')
    console.log()
    
    // Simular la lógica del shareController
    const isExplicitLocalDev = process.env.NODE_ENV === 'development' && 
                              !process.env.RAILWAY_ENVIRONMENT && 
                              !process.env.RAILWAY_PROJECT_ID && 
                              !process.env.PORT && 
                              !process.env.FRONTEND_URL && 
                              !process.env.VITE_BASE_URL
    
    let baseUrl
    if (isExplicitLocalDev) {
      baseUrl = 'http://localhost:5173'
    } else {
      baseUrl = process.env.FRONTEND_URL || 
                process.env.VITE_BASE_URL || 
                (process.env.RAILWAY_STATIC_URL ? `https://${process.env.RAILWAY_STATIC_URL}` : null) ||
                'https://beneficial-wholeness-production-9cd6.up.railway.app'
    }
    
    console.log('🔗 URL que se generará:', baseUrl)
    
    if (baseUrl.includes('localhost')) {
      console.log('🚨 PROBLEMA CONFIRMADO: Se generará localhost')
      console.log()
      console.log('📋 ANÁLISIS:')
      console.log(`   isExplicitLocalDev: ${isExplicitLocalDev}`)
      console.log('   Esto significa que TODAS las variables de producción están ausentes')
      console.log()
      console.log('🔧 SOLUCIÓN INMEDIATA:')
      console.log('   1. Configura FRONTEND_URL en Railway')
      console.log('   2. O verifica que NODE_ENV=production')
      console.log('   3. Redeploy después de los cambios')
    } else {
      console.log('✅ CORRECTO: Se generará URL de producción')
      console.log()
      console.log('Si aún ves localhost en la aplicación:')
      console.log('   1. Limpia caché del navegador')
      console.log('   2. Verifica que no hay múltiples deployments')
      console.log('   3. Revisa la consola del navegador por errores')
    }
  }
}

// Función para mostrar comandos útiles
function showUsefulCommands() {
  console.log('\n🛠️ === COMANDOS ÚTILES ===')
  console.log()
  
  console.log('📊 Para diagnosticar en Railway:')
  console.log('   node scripts/railway-env-debug.js')
  console.log()
  
  console.log('🔍 Para verificar lógica localmente:')
  console.log('   node scripts/verify-sharecontroller-logic.js')
  console.log()
  
  console.log('🧪 Para probar diferentes escenarios:')
  console.log('   node scripts/test-localhost-problem.js')
  console.log()
  
  console.log('📋 Para ver este diagnóstico:')
  console.log('   node scripts/fix-localhost-railway.js')
}

// Función para mostrar información de contacto
function showSupportInfo() {
  console.log('\n📞 === SOPORTE ADICIONAL ===')
  console.log()
  
  console.log('Si después de seguir todos los pasos el problema persiste:')
  console.log()
  console.log('1. 📊 Ejecuta el diagnóstico completo:')
  console.log('   node scripts/railway-env-debug.js')
  console.log()
  console.log('2. 📋 Revisa el documento completo:')
  console.log('   cat DIAGNOSTICO_LOCALHOST_RAILWAY.md')
  console.log()
  console.log('3. 🔍 Verifica los logs de Railway:')
  console.log('   - Ve a Deployments → View Logs')
  console.log('   - Busca errores o warnings')
  console.log()
  console.log('4. 🧪 Prueba en modo incógnito:')
  console.log('   - Para descartar problemas de caché')
}

// Función principal
function main() {
  try {
    const isProduction = showCurrentStatus()
    generateInstructions(isProduction)
    showUsefulCommands()
    showSupportInfo()
    
    console.log('\n🎯 === RESUMEN ===')
    console.log()
    console.log('✅ La lógica del código es CORRECTA')
    console.log('🔧 El problema está en la configuración de Railway')
    console.log('📋 Sigue las instrucciones específicas arriba')
    console.log('🚀 Después del redeploy, los enlaces usarán la URL de producción')
    console.log()
    console.log('💡 TIP: La variable más importante es FRONTEND_URL')
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error)
  }
}

// Ejecutar diagnóstico
main()