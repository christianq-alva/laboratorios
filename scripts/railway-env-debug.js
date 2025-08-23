#!/usr/bin/env node

/**
 * Script para ejecutar DIRECTAMENTE en Railway y diagnosticar
 * el problema de localhost en tiempo real
 */

console.log('🚀 === DIAGNÓSTICO EN VIVO DE RAILWAY ===')
console.log('Timestamp:', new Date().toISOString())
console.log()

// Función para mostrar TODAS las variables de entorno
function showAllEnvironmentVariables() {
  console.log('📋 TODAS LAS VARIABLES DE ENTORNO DISPONIBLES:')
  console.log()
  
  const allEnvVars = Object.keys(process.env).sort()
  
  // Filtrar variables relevantes
  const railwayVars = allEnvVars.filter(key => key.includes('RAILWAY'))
  const frontendVars = allEnvVars.filter(key => 
    key.includes('FRONTEND') || 
    key.includes('VITE') || 
    key.includes('BASE_URL')
  )
  const criticalVars = ['NODE_ENV', 'PORT', 'JWT_SECRET']
  
  console.log('🚂 Variables de Railway:')
  if (railwayVars.length === 0) {
    console.log('   ❌ No se encontraron variables de Railway')
  } else {
    railwayVars.forEach(key => {
      const value = process.env[key]
      console.log(`   ✅ ${key}: ${value}`)
    })
  }
  
  console.log()
  console.log('🌐 Variables de Frontend:')
  if (frontendVars.length === 0) {
    console.log('   ❌ No se encontraron variables de frontend')
  } else {
    frontendVars.forEach(key => {
      const value = process.env[key]
      console.log(`   ✅ ${key}: ${value}`)
    })
  }
  
  console.log()
  console.log('⚙️ Variables críticas:')
  criticalVars.forEach(key => {
    const value = process.env[key]
    const status = value ? '✅' : '❌'
    console.log(`   ${status} ${key}: ${value || 'NO DEFINIDA'}`)
  })
  
  console.log()
  console.log('📊 Total de variables de entorno:', allEnvVars.length)
}

// Función para simular EXACTAMENTE el shareController
function simulateRealShareController() {
  console.log('🔄 === SIMULANDO SHARECONTROLLER EN TIEMPO REAL ===')
  console.log()
  
  console.log('📋 PASO 1: Detección de entorno')
  
  const checks = {
    'RAILWAY_ENVIRONMENT': !!process.env.RAILWAY_ENVIRONMENT,
    'NODE_ENV === production': process.env.NODE_ENV === 'production',
    'RAILWAY_PROJECT_ID': !!process.env.RAILWAY_PROJECT_ID,
    'PORT': !!process.env.PORT,
    'FRONTEND_URL': !!process.env.FRONTEND_URL,
    'VITE_BASE_URL': !!process.env.VITE_BASE_URL
  }
  
  console.log('Verificaciones de producción:')
  Object.entries(checks).forEach(([key, value]) => {
    const status = value ? '✅' : '❌'
    console.log(`   ${status} ${key}: ${value}`)
  })
  
  const isProduction = process.env.RAILWAY_ENVIRONMENT || 
                      process.env.NODE_ENV === 'production' || 
                      process.env.RAILWAY_PROJECT_ID ||
                      process.env.PORT || 
                      process.env.FRONTEND_URL || 
                      process.env.VITE_BASE_URL
  
  console.log(`\n🎯 isProduction: ${isProduction}`)
  
  console.log('\n📋 PASO 2: Construcción de baseUrl')
  
  const urlOptions = {
    'FRONTEND_URL': process.env.FRONTEND_URL,
    'VITE_BASE_URL': process.env.VITE_BASE_URL,
    'RAILWAY_STATIC_URL': process.env.RAILWAY_STATIC_URL ? `https://${process.env.RAILWAY_STATIC_URL}` : null,
    'FALLBACK': 'https://beneficial-wholeness-production-9cd6.up.railway.app'
  }
  
  console.log('Opciones de URL disponibles:')
  Object.entries(urlOptions).forEach(([key, value]) => {
    const status = value ? '✅' : '❌'
    console.log(`   ${status} ${key}: ${value || 'NO DISPONIBLE'}`)
  })
  
  let baseUrl = process.env.FRONTEND_URL || 
                process.env.VITE_BASE_URL || 
                (process.env.RAILWAY_STATIC_URL ? `https://${process.env.RAILWAY_STATIC_URL}` : null) ||
                'https://beneficial-wholeness-production-9cd6.up.railway.app'
  
  console.log(`\n🔗 baseUrl seleccionada: ${baseUrl}`)
  
  console.log('\n📋 PASO 3: Verificación de desarrollo local explícito')
  
  const localDevChecks = {
    'NODE_ENV === development': process.env.NODE_ENV === 'development',
    '!RAILWAY_ENVIRONMENT': !process.env.RAILWAY_ENVIRONMENT,
    '!RAILWAY_PROJECT_ID': !process.env.RAILWAY_PROJECT_ID,
    '!PORT': !process.env.PORT,
    '!FRONTEND_URL': !process.env.FRONTEND_URL,
    '!VITE_BASE_URL': !process.env.VITE_BASE_URL
  }
  
  console.log('Verificaciones para desarrollo local:')
  Object.entries(localDevChecks).forEach(([key, value]) => {
    const status = value ? '✅' : '❌'
    console.log(`   ${status} ${key}: ${value}`)
  })
  
  const isExplicitLocalDev = process.env.NODE_ENV === 'development' && 
                            !process.env.RAILWAY_ENVIRONMENT && 
                            !process.env.RAILWAY_PROJECT_ID && 
                            !process.env.PORT && 
                            !process.env.FRONTEND_URL && 
                            !process.env.VITE_BASE_URL
  
  console.log(`\n🎯 isExplicitLocalDev: ${isExplicitLocalDev}`)
  
  if (isExplicitLocalDev) {
    baseUrl = 'http://localhost:5173'
    console.log('🚨 CAMBIADO A LOCALHOST por desarrollo local explícito')
  }
  
  console.log(`\n🔗 baseUrl FINAL: ${baseUrl}`)
  
  const publicUrl = `${baseUrl}/horarios/publico/123?token=sample-token`
  console.log(`🔗 URL completa generada: ${publicUrl}`)
  
  return {
    isProduction,
    isExplicitLocalDev,
    baseUrl,
    publicUrl,
    urlSource: process.env.FRONTEND_URL ? 'FRONTEND_URL' :
               process.env.VITE_BASE_URL ? 'VITE_BASE_URL' :
               process.env.RAILWAY_STATIC_URL ? 'RAILWAY_STATIC_URL' :
               isExplicitLocalDev ? 'LOCALHOST (desarrollo local)' :
               'FALLBACK (hardcodeada)'
  }
}

// Función para generar diagnóstico final
function generateFinalDiagnosis(result) {
  console.log('\n🎯 === DIAGNÓSTICO FINAL ===')
  console.log()
  
  console.log(`🌍 Entorno detectado: ${result.isProduction ? 'PRODUCCIÓN' : 'DESARROLLO'}`)
  console.log(`🏠 Desarrollo local explícito: ${result.isExplicitLocalDev ? 'SÍ' : 'NO'}`)
  console.log(`🔗 Fuente de la URL: ${result.urlSource}`)
  console.log(`📍 URL generada: ${result.publicUrl}`)
  
  console.log()
  
  if (result.publicUrl.includes('localhost')) {
    console.log('🚨 PROBLEMA CONFIRMADO: La URL contiene localhost')
    console.log()
    console.log('🔍 ANÁLISIS:')
    
    if (result.isExplicitLocalDev) {
      console.log('   ❌ Se detectó como desarrollo local explícito')
      console.log('   ❌ Esto significa que TODAS las variables de producción están ausentes')
      console.log()
      console.log('🔧 SOLUCIÓN INMEDIATA:')
      console.log('   1. Configura FRONTEND_URL en Railway')
      console.log('   2. O configura NODE_ENV=production')
      console.log('   3. Fuerza un redeploy')
    } else {
      console.log('   ❌ Error inesperado en la lógica')
      console.log('   ❌ Esto no debería pasar con la lógica actual')
    }
  } else {
    console.log('✅ CORRECTO: La URL usa el dominio de producción')
    console.log()
    console.log('Si aún ves localhost en la aplicación:')
    console.log('   1. Verifica que estés viendo la versión más reciente')
    console.log('   2. Limpia caché del navegador')
    console.log('   3. Verifica que no hay múltiples deployments')
  }
}

// Función principal
function main() {
  try {
    showAllEnvironmentVariables()
    const result = simulateRealShareController()
    generateFinalDiagnosis(result)
    
    console.log('\n📋 === INFORMACIÓN ADICIONAL ===')
    console.log(`Hostname: ${require('os').hostname()}`)
    console.log(`Platform: ${process.platform}`)
    console.log(`Node version: ${process.version}`)
    console.log(`Working directory: ${process.cwd()}`)
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error)
  }
}

// Ejecutar diagnóstico
main()
