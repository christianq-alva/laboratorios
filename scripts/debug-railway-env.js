#!/usr/bin/env node

/**
 * Script de diagnóstico profundo para analizar por qué aparece localhost
 * en los enlaces compartidos a pesar de tener variables de entorno configuradas
 */

console.log('🔍 === DIAGNÓSTICO PROFUNDO DE VARIABLES DE ENTORNO RAILWAY ===')
console.log()

// Simular exactamente las condiciones de Railway
function simulateRailwayEnvironment() {
  console.log('📋 PASO 1: Simulando entorno de Railway con RAILWAY_ENVIRONMENT=production')
  
  const mockEnv = {
    RAILWAY_ENVIRONMENT: 'production',
    NODE_ENV: 'production',
    PORT: '3000',
    FRONTEND_URL: 'https://beneficial-wholeness-production-9cd6.up.railway.app'
  }
  
  console.log('Variables simuladas:', mockEnv)
  console.log()
  
  // Replicar EXACTAMENTE la lógica del shareController
  console.log('📋 PASO 2: Aplicando lógica de detección de entorno')
  
  const isProduction = mockEnv.RAILWAY_ENVIRONMENT || 
                      mockEnv.NODE_ENV === 'production' || 
                      mockEnv.RAILWAY_PROJECT_ID ||
                      mockEnv.PORT || // Railway siempre establece PORT
                      mockEnv.FRONTEND_URL || // Si hay FRONTEND_URL, asumir producción
                      mockEnv.VITE_BASE_URL   // Si hay VITE_BASE_URL, asumir producción
  
  console.log('✅ isProduction:', isProduction)
  console.log()
  
  console.log('📋 PASO 3: Construyendo baseUrl con prioridad de producción')
  
  let baseUrl = mockEnv.FRONTEND_URL || 
                mockEnv.VITE_BASE_URL || 
                (mockEnv.RAILWAY_STATIC_URL ? `https://${mockEnv.RAILWAY_STATIC_URL}` : null) ||
                'https://beneficial-wholeness-production-9cd6.up.railway.app'
  
  console.log('🔗 baseUrl inicial:', baseUrl)
  console.log()
  
  console.log('📋 PASO 4: Verificando condiciones de desarrollo local explícito')
  
  const isExplicitLocalDev = mockEnv.NODE_ENV === 'development' && 
                            !mockEnv.RAILWAY_ENVIRONMENT && 
                            !mockEnv.RAILWAY_PROJECT_ID && 
                            !mockEnv.PORT && 
                            !mockEnv.FRONTEND_URL && 
                            !mockEnv.VITE_BASE_URL
  
  console.log('Condiciones para desarrollo local:')
  console.log('  NODE_ENV === "development":', mockEnv.NODE_ENV === 'development')
  console.log('  !RAILWAY_ENVIRONMENT:', !mockEnv.RAILWAY_ENVIRONMENT)
  console.log('  !RAILWAY_PROJECT_ID:', !mockEnv.RAILWAY_PROJECT_ID)
  console.log('  !PORT:', !mockEnv.PORT)
  console.log('  !FRONTEND_URL:', !mockEnv.FRONTEND_URL)
  console.log('  !VITE_BASE_URL:', !mockEnv.VITE_BASE_URL)
  console.log('❌ isExplicitLocalDev:', isExplicitLocalDev)
  console.log()
  
  if (isExplicitLocalDev) {
    baseUrl = 'http://localhost:5173'
    console.log('🚨 CAMBIADO A LOCALHOST por desarrollo local explícito')
  } else {
    console.log('✅ MANTIENE URL DE PRODUCCIÓN')
  }
  
  console.log('🔗 baseUrl final:', baseUrl)
  
  const publicUrl = `${baseUrl}/horarios/publico/1?token=sample-token`
  console.log('🔗 URL completa generada:', publicUrl)
  
  return {
    isProduction,
    isExplicitLocalDev,
    baseUrl,
    publicUrl,
    reason: mockEnv.FRONTEND_URL ? 'FRONTEND_URL configurada' :
            mockEnv.VITE_BASE_URL ? 'VITE_BASE_URL configurada' :
            mockEnv.RAILWAY_STATIC_URL ? 'RAILWAY_STATIC_URL configurada' :
            isExplicitLocalDev ? 'Desarrollo local explícito' :
            'URL de producción por defecto (hardcodeada)'
  }
}

// Ejecutar diagnóstico
const result = simulateRailwayEnvironment()

console.log()
console.log('🎯 === RESULTADO DEL DIAGNÓSTICO ===')
console.log('Entorno detectado:', result.isProduction ? 'PRODUCCIÓN' : 'DESARROLLO')
console.log('Desarrollo local explícito:', result.isExplicitLocalDev ? 'SÍ' : 'NO')
console.log('Razón de la URL:', result.reason)
console.log('URL final:', result.publicUrl)

if (result.publicUrl.includes('localhost')) {
  console.log('🚨 PROBLEMA: La URL contiene localhost')
  console.log('🔧 POSIBLES CAUSAS:')
  console.log('   1. Las variables de entorno no están llegando al backend')
  console.log('   2. Hay un problema en la lógica de detección')
  console.log('   3. El código no se ha redesplegado después de configurar las variables')
} else {
  console.log('✅ CORRECTO: La URL usa el dominio de producción')
}

console.log()
console.log('🔍 === DIAGNÓSTICO DE VARIABLES REALES ===')
console.log('Variables de entorno actuales del proceso:')
console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined')
console.log('RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT || 'undefined')
console.log('RAILWAY_PROJECT_ID:', process.env.RAILWAY_PROJECT_ID ? 'definido' : 'undefined')
console.log('PORT:', process.env.PORT || 'undefined')
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'undefined')
console.log('VITE_BASE_URL:', process.env.VITE_BASE_URL || 'undefined')
console.log('RAILWAY_STATIC_URL:', process.env.RAILWAY_STATIC_URL || 'undefined')

console.log()
console.log('🔧 === RECOMENDACIONES ===')
console.log('1. Verifica que FRONTEND_URL esté configurada en Railway')
console.log('2. Asegúrate de haber redesplegado después de configurar las variables')
console.log('3. Revisa los logs del backend cuando crees un enlace compartido')
console.log('4. Si el problema persiste, puede ser un problema de caché o deployment')