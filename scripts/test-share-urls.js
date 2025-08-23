#!/usr/bin/env node

/**
 * Script de diagnóstico para probar la generación de URLs de enlaces compartidos
 * Simula diferentes entornos y configuraciones para verificar el comportamiento
 */

console.log('🔗 === DIAGNÓSTICO DE ENLACES COMPARTIDOS ===\n')

// Función para simular la lógica del shareController
function generateShareUrl(laboratorioId, token, envVars = {}) {
  // Simular variables de entorno
  const mockEnv = {
    NODE_ENV: envVars.NODE_ENV || 'development',
    RAILWAY_ENVIRONMENT: envVars.RAILWAY_ENVIRONMENT,
    RAILWAY_PROJECT_ID: envVars.RAILWAY_PROJECT_ID,
    RAILWAY_STATIC_URL: envVars.RAILWAY_STATIC_URL,
    FRONTEND_URL: envVars.FRONTEND_URL,
    VITE_BASE_URL: envVars.VITE_BASE_URL,
    PORT: envVars.PORT
  }

  // Detectar entorno (misma lógica que el controller) - PRIORIDAD A PRODUCCIÓN
  const isProduction = mockEnv.RAILWAY_ENVIRONMENT || 
                      mockEnv.NODE_ENV === 'production' || 
                      mockEnv.RAILWAY_PROJECT_ID ||
                      mockEnv.PORT || // Railway siempre establece PORT
                      mockEnv.FRONTEND_URL || // Si hay FRONTEND_URL, asumir producción
                      mockEnv.VITE_BASE_URL   // Si hay VITE_BASE_URL, asumir producción

  // PRIORIZAR SIEMPRE URLs DE PRODUCCIÓN
  let baseUrl = mockEnv.FRONTEND_URL || 
                mockEnv.VITE_BASE_URL || 
                (mockEnv.RAILWAY_STATIC_URL ? `https://${mockEnv.RAILWAY_STATIC_URL}` : null) ||
                'https://beneficial-wholeness-production-9cd6.up.railway.app'
  
  // Solo usar localhost si EXPLÍCITAMENTE está en desarrollo local
  const isExplicitLocalDev = mockEnv.NODE_ENV === 'development' && 
                            !mockEnv.RAILWAY_ENVIRONMENT && 
                            !mockEnv.RAILWAY_PROJECT_ID && 
                            !mockEnv.PORT && 
                            !mockEnv.FRONTEND_URL && 
                            !mockEnv.VITE_BASE_URL
  
  if (isExplicitLocalDev) {
    baseUrl = 'http://localhost:5173'
  }

  const publicUrl = `${baseUrl}/horarios/publico/${laboratorioId}?token=${token}`

  return {
    isProduction,
    isExplicitLocalDev,
    baseUrl,
    publicUrl,
    envVars: mockEnv
  }
}

// Casos de prueba
const testCases = [
  {
    name: '🏠 Desarrollo Local (por defecto)',
    envVars: {}
  },
  {
    name: '🚀 Producción Railway (NODE_ENV)',
    envVars: {
      NODE_ENV: 'production'
    }
  },
  {
    name: '🚀 Producción Railway (RAILWAY_ENVIRONMENT)',
    envVars: {
      RAILWAY_ENVIRONMENT: 'production'
    }
  },
  {
    name: '🚀 Producción con FRONTEND_URL personalizada',
    envVars: {
      NODE_ENV: 'production',
      FRONTEND_URL: 'https://mi-dominio-personalizado.up.railway.app'
    }
  },
  {
    name: '🚀 Producción con VITE_BASE_URL',
    envVars: {
      RAILWAY_ENVIRONMENT: 'production',
      VITE_BASE_URL: 'https://otro-dominio.up.railway.app'
    }
  },
  {
    name: '🚀 Producción con RAILWAY_STATIC_URL',
    envVars: {
      NODE_ENV: 'production',
      RAILWAY_STATIC_URL: 'custom-domain.up.railway.app'
    }
  },
  {
    name: '🚀 Producción con PORT (Railway automático)',
    envVars: {
      PORT: '3000'
    }
  }
]

// Ejecutar pruebas
const laboratorioId = 1
const sampleToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sample'

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ${testCase.name}`)
  console.log('   Variables de entorno:')
  
  Object.entries(testCase.envVars).forEach(([key, value]) => {
    console.log(`     ${key}: ${value}`)
  })
  
  if (Object.keys(testCase.envVars).length === 0) {
    console.log('     (ninguna variable configurada)')
  }

  const result = generateShareUrl(laboratorioId, sampleToken, testCase.envVars)
  
  console.log(`   Entorno detectado: ${result.isProduction ? 'PRODUCCIÓN' : 'DESARROLLO'}`)
  console.log(`   Desarrollo local explícito: ${result.isExplicitLocalDev ? 'SÍ' : 'NO'}`)
  console.log(`   Base URL: ${result.baseUrl}`)
  console.log(`   URL completa: ${result.publicUrl}`)
  
  // Mostrar razón de la URL elegida
  const reason = testCase.envVars.FRONTEND_URL ? 'FRONTEND_URL configurada' :
                testCase.envVars.VITE_BASE_URL ? 'VITE_BASE_URL configurada' :
                testCase.envVars.RAILWAY_STATIC_URL ? 'RAILWAY_STATIC_URL configurada' :
                result.isExplicitLocalDev ? 'Desarrollo local explícito' :
                'URL de producción por defecto (hardcodeada)'
  console.log(`   Razón: ${reason}`)
  
  // Validar URL
  const isValidUrl = result.publicUrl.startsWith('http')
  const hasLocalhost = result.publicUrl.includes('localhost')
  
  if (result.isProduction && hasLocalhost) {
    console.log('   ⚠️  ADVERTENCIA: URL contiene localhost en producción')
  } else if (isValidUrl) {
    console.log('   ✅ URL válida generada')
  } else {
    console.log('   ❌ URL inválida')
  }
})

console.log('\n🔗 === RECOMENDACIONES ===\n')
console.log('Para Railway en producción, configura una de estas variables:')
console.log('1. FRONTEND_URL=https://tu-dominio.up.railway.app (recomendado)')
console.log('2. VITE_BASE_URL=https://tu-dominio.up.railway.app')
console.log('3. NODE_ENV=production + RAILWAY_ENVIRONMENT=production')
console.log('\nPara obtener tu dominio de Railway:')
console.log('1. Ve a tu proyecto en Railway')
console.log('2. En "Deployments", copia la URL del deployment')
console.log('3. Úsala como valor para FRONTEND_URL')

console.log('\n🔗 === FIN DEL DIAGNÓSTICO ===\n')