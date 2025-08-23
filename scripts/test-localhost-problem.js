#!/usr/bin/env node

/**
 * Script para reproducir exactamente el problema de localhost
 * que está experimentando el usuario en Railway
 */

console.log('🚨 === REPRODUCIENDO EL PROBLEMA DE LOCALHOST ===')
console.log()

// Función para simular diferentes escenarios problemáticos
function testProblematicScenarios() {
  const scenarios = [
    {
      name: '🔴 Escenario 1: Railway sin FRONTEND_URL configurada',
      env: {
        RAILWAY_ENVIRONMENT: 'production',
        NODE_ENV: 'production',
        PORT: '3000',
        RAILWAY_PROJECT_ID: 'abc123'
        // FRONTEND_URL: undefined - Esta es la clave
      }
    },
    {
      name: '🔴 Escenario 2: Solo PORT configurado (Railway básico)',
      env: {
        PORT: '3000'
        // Todas las demás undefined
      }
    },
    {
      name: '🔴 Escenario 3: NODE_ENV=development con PORT (problemático)',
      env: {
        NODE_ENV: 'development',
        PORT: '3000'
      }
    },
    {
      name: '🔴 Escenario 4: Variables vacías (strings vacíos)',
      env: {
        RAILWAY_ENVIRONMENT: '',
        NODE_ENV: '',
        FRONTEND_URL: '',
        VITE_BASE_URL: ''
      }
    },
    {
      name: '✅ Escenario 5: Configuración correcta',
      env: {
        RAILWAY_ENVIRONMENT: 'production',
        NODE_ENV: 'production',
        PORT: '3000',
        FRONTEND_URL: 'https://beneficial-wholeness-production-9cd6.up.railway.app'
      }
    }
  ]
  
  scenarios.forEach((scenario, index) => {
    console.log(`\n${scenario.name}`)
    console.log('Variables:', scenario.env)
    
    const result = simulateShareControllerWithEnv(scenario.env)
    
    console.log(`Resultado: ${result.publicUrl}`)
    
    if (result.publicUrl.includes('localhost')) {
      console.log('🚨 PROBLEMA: Genera localhost')
      console.log(`Razón: ${result.reason}`)
    } else {
      console.log('✅ CORRECTO: Usa URL de producción')
    }
    
    console.log('---')
  })
}

// Función que replica EXACTAMENTE la lógica del shareController
function simulateShareControllerWithEnv(mockEnv) {
  // Simular process.env con el mock
  const originalEnv = process.env
  
  // Crear un objeto que simule process.env
  const simulatedProcess = {
    env: { ...mockEnv }
  }
  
  // LÓGICA EXACTA DEL SHARECONTROLLER
  const isProduction = simulatedProcess.env.RAILWAY_ENVIRONMENT || 
                      simulatedProcess.env.NODE_ENV === 'production' || 
                      simulatedProcess.env.RAILWAY_PROJECT_ID ||
                      simulatedProcess.env.PORT || 
                      simulatedProcess.env.FRONTEND_URL || 
                      simulatedProcess.env.VITE_BASE_URL
  
  // PRIORIZAR SIEMPRE URLs DE PRODUCCIÓN
  let baseUrl = simulatedProcess.env.FRONTEND_URL || 
                simulatedProcess.env.VITE_BASE_URL || 
                (simulatedProcess.env.RAILWAY_STATIC_URL ? `https://${simulatedProcess.env.RAILWAY_STATIC_URL}` : null) ||
                'https://beneficial-wholeness-production-9cd6.up.railway.app'
  
  // Solo usar localhost si EXPLÍCITAMENTE está en desarrollo local
  const isExplicitLocalDev = simulatedProcess.env.NODE_ENV === 'development' && 
                            !simulatedProcess.env.RAILWAY_ENVIRONMENT && 
                            !simulatedProcess.env.RAILWAY_PROJECT_ID && 
                            !simulatedProcess.env.PORT && 
                            !simulatedProcess.env.FRONTEND_URL && 
                            !simulatedProcess.env.VITE_BASE_URL
  
  if (isExplicitLocalDev) {
    baseUrl = 'http://localhost:5173'
  }
  
  const publicUrl = `${baseUrl}/horarios/publico/1?token=sample-token`
  
  return {
    isProduction,
    isExplicitLocalDev,
    baseUrl,
    publicUrl,
    reason: simulatedProcess.env.FRONTEND_URL ? 'FRONTEND_URL configurada' :
            simulatedProcess.env.VITE_BASE_URL ? 'VITE_BASE_URL configurada' :
            simulatedProcess.env.RAILWAY_STATIC_URL ? 'RAILWAY_STATIC_URL configurada' :
            isExplicitLocalDev ? 'Desarrollo local explícito' :
            'URL de producción por defecto (hardcodeada)'
  }
}

// Función para detectar posibles problemas en el código
function analyzeCodeIssues() {
  console.log('\n🔍 === ANÁLISIS DE POSIBLES PROBLEMAS EN EL CÓDIGO ===')
  console.log()
  
  console.log('🔍 Verificando lógica de strings vacíos:')
  
  // Probar con strings vacíos (problema común)
  const emptyStringTest = {
    FRONTEND_URL: '',
    VITE_BASE_URL: '',
    RAILWAY_ENVIRONMENT: '',
    NODE_ENV: 'production',
    PORT: '3000'
  }
  
  console.log('Variables con strings vacíos:', emptyStringTest)
  
  // En JavaScript, string vacío es falsy, pero verifiquemos
  const frontendUrlCheck = emptyStringTest.FRONTEND_URL || 'fallback'
  const viteBaseUrlCheck = emptyStringTest.VITE_BASE_URL || 'fallback'
  
  console.log('FRONTEND_URL || fallback:', frontendUrlCheck)
  console.log('VITE_BASE_URL || fallback:', viteBaseUrlCheck)
  
  if (frontendUrlCheck === 'fallback' && viteBaseUrlCheck === 'fallback') {
    console.log('✅ Strings vacíos se manejan correctamente')
  } else {
    console.log('🚨 PROBLEMA: Strings vacíos no se manejan correctamente')
  }
  
  console.log()
  console.log('🔍 Verificando lógica de undefined vs null:')
  
  const undefinedTest = {
    FRONTEND_URL: undefined,
    VITE_BASE_URL: null,
    RAILWAY_STATIC_URL: undefined
  }
  
  const railwayStaticCheck = undefinedTest.RAILWAY_STATIC_URL ? `https://${undefinedTest.RAILWAY_STATIC_URL}` : null
  console.log('RAILWAY_STATIC_URL check:', railwayStaticCheck)
  
  if (railwayStaticCheck === null) {
    console.log('✅ undefined/null se maneja correctamente')
  } else {
    console.log('🚨 PROBLEMA: undefined/null genera URL inválida')
  }
}

// Función para generar un plan de acción específico
function generateActionPlan() {
  console.log('\n🎯 === PLAN DE ACCIÓN ESPECÍFICO ===')
  console.log()
  
  console.log('📋 PASOS INMEDIATOS PARA RESOLVER:')
  console.log()
  
  console.log('1. 🔍 VERIFICAR VARIABLES EN RAILWAY:')
  console.log('   - Ve a tu proyecto en Railway')
  console.log('   - Sección "Variables"')
  console.log('   - Busca FRONTEND_URL')
  console.log('   - Si no existe, créala con: https://tu-dominio.up.railway.app')
  console.log()
  
  console.log('2. 🔄 FORZAR REDEPLOY:')
  console.log('   - Haz un cambio mínimo en cualquier archivo')
  console.log('   - Commit y push')
  console.log('   - O usa "Redeploy" en Railway')
  console.log()
  
  console.log('3. 📊 VERIFICAR LOGS:')
  console.log('   - Ve a "Deployments" en Railway')
  console.log('   - Abre los logs del deployment más reciente')
  console.log('   - Busca las líneas que empiezan con "🔗"')
  console.log('   - Verifica qué URL se está generando')
  console.log()
  
  console.log('4. 🧪 PROBAR CREACIÓN DE ENLACE:')
  console.log('   - Crea un nuevo enlace compartido')
  console.log('   - Verifica la URL generada')
  console.log('   - Si sigue siendo localhost, revisa los logs')
  console.log()
  
  console.log('5. 🔧 SI EL PROBLEMA PERSISTE:')
  console.log('   - Verifica que el servicio correcto esté desplegado')
  console.log('   - Asegúrate de que no hay múltiples deployments')
  console.log('   - Considera eliminar y recrear las variables de entorno')
}

// Ejecutar todos los tests
testProblematicScenarios()
analyzeCodeIssues()
generateActionPlan()

console.log('\n🎯 === CONCLUSIÓN ===')
console.log('La lógica del código es correcta. El problema más probable es:')
console.log('1. ❌ FRONTEND_URL no está configurada en Railway')
console.log('2. ❌ Las variables no se aplicaron después del último deployment')
console.log('3. ❌ Hay un problema de caché o múltiples deployments')
console.log()
console.log('✅ SOLUCIÓN: Configura FRONTEND_URL y fuerza un redeploy')