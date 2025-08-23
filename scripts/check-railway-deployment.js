#!/usr/bin/env node

/**
 * Script para verificar el estado del deployment y las variables de entorno en Railway
 */

console.log('🚀 === VERIFICACIÓN DE DEPLOYMENT EN RAILWAY ===')
console.log()

// Función para verificar si estamos en Railway
function checkRailwayEnvironment() {
  console.log('📋 VERIFICANDO ENTORNO ACTUAL')
  console.log()
  
  const railwayIndicators = {
    'RAILWAY_ENVIRONMENT': process.env.RAILWAY_ENVIRONMENT,
    'RAILWAY_PROJECT_ID': process.env.RAILWAY_PROJECT_ID,
    'RAILWAY_SERVICE_ID': process.env.RAILWAY_SERVICE_ID,
    'RAILWAY_DEPLOYMENT_ID': process.env.RAILWAY_DEPLOYMENT_ID,
    'RAILWAY_REPLICA_ID': process.env.RAILWAY_REPLICA_ID,
    'RAILWAY_STATIC_URL': process.env.RAILWAY_STATIC_URL,
    'RAILWAY_PUBLIC_DOMAIN': process.env.RAILWAY_PUBLIC_DOMAIN
  }
  
  console.log('🔍 Variables específicas de Railway:')
  Object.entries(railwayIndicators).forEach(([key, value]) => {
    console.log(`   ${key}: ${value || '❌ NO DEFINIDA'}`)
  })
  
  const isInRailway = Object.values(railwayIndicators).some(value => value !== undefined)
  console.log()
  console.log(`🎯 ¿Ejecutándose en Railway? ${isInRailway ? '✅ SÍ' : '❌ NO'}`)
  
  return isInRailway
}

// Función para verificar variables de entorno críticas
function checkCriticalEnvVars() {
  console.log()
  console.log('📋 VERIFICANDO VARIABLES DE ENTORNO CRÍTICAS')
  console.log()
  
  const criticalVars = {
    'NODE_ENV': process.env.NODE_ENV,
    'PORT': process.env.PORT,
    'FRONTEND_URL': process.env.FRONTEND_URL,
    'VITE_BASE_URL': process.env.VITE_BASE_URL,
    'DB_HOST': process.env.DB_HOST ? '✅ CONFIGURADA' : '❌ NO DEFINIDA',
    'DB_USER': process.env.DB_USER ? '✅ CONFIGURADA' : '❌ NO DEFINIDA',
    'DB_PASSWORD': process.env.DB_PASSWORD ? '✅ CONFIGURADA' : '❌ NO DEFINIDA',
    'JWT_SECRET': process.env.JWT_SECRET ? '✅ CONFIGURADA' : '❌ NO DEFINIDA'
  }
  
  console.log('🔍 Variables críticas:')
  Object.entries(criticalVars).forEach(([key, value]) => {
    const status = value ? '✅' : '❌'
    console.log(`   ${status} ${key}: ${value || 'NO DEFINIDA'}`)
  })
  
  return criticalVars
}

// Función para simular la lógica del shareController
function simulateShareControllerLogic() {
  console.log()
  console.log('📋 SIMULANDO LÓGICA DEL SHARECONTROLLER')
  console.log()
  
  // Replicar EXACTAMENTE la lógica actual
  const isProduction = process.env.RAILWAY_ENVIRONMENT || 
                      process.env.NODE_ENV === 'production' || 
                      process.env.RAILWAY_PROJECT_ID ||
                      process.env.PORT || 
                      process.env.FRONTEND_URL || 
                      process.env.VITE_BASE_URL
  
  console.log('🔍 Detección de entorno:')
  console.log(`   RAILWAY_ENVIRONMENT: ${process.env.RAILWAY_ENVIRONMENT || 'undefined'}`)
  console.log(`   NODE_ENV === 'production': ${process.env.NODE_ENV === 'production'}`)
  console.log(`   RAILWAY_PROJECT_ID: ${process.env.RAILWAY_PROJECT_ID ? 'definido' : 'undefined'}`)
  console.log(`   PORT: ${process.env.PORT || 'undefined'}`)
  console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL || 'undefined'}`)
  console.log(`   VITE_BASE_URL: ${process.env.VITE_BASE_URL || 'undefined'}`)
  console.log(`   ➡️ isProduction: ${isProduction}`)
  
  // Construir baseUrl
  let baseUrl = process.env.FRONTEND_URL || 
                process.env.VITE_BASE_URL || 
                (process.env.RAILWAY_STATIC_URL ? `https://${process.env.RAILWAY_STATIC_URL}` : null) ||
                'https://beneficial-wholeness-production-9cd6.up.railway.app'
  
  console.log()
  console.log('🔍 Construcción de baseUrl:')
  console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL || 'undefined'}`)
  console.log(`   VITE_BASE_URL: ${process.env.VITE_BASE_URL || 'undefined'}`)
  console.log(`   RAILWAY_STATIC_URL: ${process.env.RAILWAY_STATIC_URL || 'undefined'}`)
  console.log(`   ➡️ baseUrl inicial: ${baseUrl}`)
  
  // Verificar desarrollo local explícito
  const isExplicitLocalDev = process.env.NODE_ENV === 'development' && 
                            !process.env.RAILWAY_ENVIRONMENT && 
                            !process.env.RAILWAY_PROJECT_ID && 
                            !process.env.PORT && 
                            !process.env.FRONTEND_URL && 
                            !process.env.VITE_BASE_URL
  
  console.log()
  console.log('🔍 Verificación de desarrollo local explícito:')
  console.log(`   NODE_ENV === 'development': ${process.env.NODE_ENV === 'development'}`)
  console.log(`   !RAILWAY_ENVIRONMENT: ${!process.env.RAILWAY_ENVIRONMENT}`)
  console.log(`   !RAILWAY_PROJECT_ID: ${!process.env.RAILWAY_PROJECT_ID}`)
  console.log(`   !PORT: ${!process.env.PORT}`)
  console.log(`   !FRONTEND_URL: ${!process.env.FRONTEND_URL}`)
  console.log(`   !VITE_BASE_URL: ${!process.env.VITE_BASE_URL}`)
  console.log(`   ➡️ isExplicitLocalDev: ${isExplicitLocalDev}`)
  
  if (isExplicitLocalDev) {
    baseUrl = 'http://localhost:5173'
    console.log('🚨 CAMBIADO A LOCALHOST por desarrollo local explícito')
  }
  
  console.log(`   ➡️ baseUrl final: ${baseUrl}`)
  
  const publicUrl = `${baseUrl}/horarios/publico/1?token=sample-token`
  console.log(`   ➡️ URL completa: ${publicUrl}`)
  
  return {
    isProduction,
    isExplicitLocalDev,
    baseUrl,
    publicUrl
  }
}

// Función para generar recomendaciones
function generateRecommendations(isInRailway, envVars, simulation) {
  console.log()
  console.log('🔧 === DIAGNÓSTICO Y RECOMENDACIONES ===')
  console.log()
  
  if (!isInRailway) {
    console.log('❌ PROBLEMA: No se detecta entorno de Railway')
    console.log('   Esto es normal si estás ejecutando localmente')
    console.log('   En Railway, deberías ver variables como RAILWAY_ENVIRONMENT')
    console.log()
  }
  
  if (simulation.publicUrl.includes('localhost')) {
    console.log('🚨 PROBLEMA DETECTADO: La URL generada contiene localhost')
    console.log()
    console.log('🔍 POSIBLES CAUSAS:')
    
    if (!envVars.FRONTEND_URL && !envVars.VITE_BASE_URL) {
      console.log('   1. ❌ FRONTEND_URL y VITE_BASE_URL no están configuradas')
      console.log('      Solución: Configura FRONTEND_URL en Railway')
    }
    
    if (!envVars.NODE_ENV && !envVars.PORT) {
      console.log('   2. ❌ Variables de entorno de Railway no están llegando')
      console.log('      Solución: Verifica el deployment en Railway')
    }
    
    console.log('   3. ❌ El código no se ha redesplegado después de configurar variables')
    console.log('      Solución: Fuerza un nuevo deployment en Railway')
    
    console.log()
    console.log('🔧 PASOS PARA RESOLVER:')
    console.log('   1. Ve a tu proyecto en Railway')
    console.log('   2. En "Variables", añade: FRONTEND_URL=https://tu-dominio.up.railway.app')
    console.log('   3. Fuerza un redeploy (puedes hacer un commit vacío)')
    console.log('   4. Verifica los logs del backend después del deployment')
    
  } else {
    console.log('✅ CORRECTO: La URL generada usa el dominio de producción')
    console.log('   Si aún ves localhost en la aplicación, el problema puede ser:')
    console.log('   1. Caché del navegador')
    console.log('   2. El frontend no se ha actualizado')
    console.log('   3. Hay múltiples deployments activos')
  }
}

// Ejecutar todas las verificaciones
console.log('Iniciando verificación completa...')
console.log()

const isInRailway = checkRailwayEnvironment()
const envVars = checkCriticalEnvVars()
const simulation = simulateShareControllerLogic()

generateRecommendations(isInRailway, envVars, simulation)

console.log()
console.log('🎯 === RESUMEN ===')
console.log(`Entorno Railway: ${isInRailway ? '✅ Detectado' : '❌ No detectado'}`)
console.log(`URL generada: ${simulation.publicUrl}`)
console.log(`Contiene localhost: ${simulation.publicUrl.includes('localhost') ? '❌ SÍ' : '✅ NO'}`)
