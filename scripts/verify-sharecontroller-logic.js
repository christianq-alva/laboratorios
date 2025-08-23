#!/usr/bin/env node

/**
 * Script para verificar que la lógica del shareController
 * esté funcionando correctamente en tiempo real
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import os from 'os'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔍 === VERIFICACIÓN DE LÓGICA DEL SHARECONTROLLER ===')
console.log('Timestamp:', new Date().toISOString())
console.log()

// Función para leer y analizar el shareController
function analyzeShareController() {
  console.log('📂 Analizando shareController.js...')
  
  const controllerPath = path.join(process.cwd(), 'server', 'controllers', 'shareController.js')
  
  if (!fs.existsSync(controllerPath)) {
    console.log('❌ No se encontró shareController.js en:', controllerPath)
    return false
  }
  
  const content = fs.readFileSync(controllerPath, 'utf8')
  
  console.log('✅ Archivo encontrado')
  console.log('📊 Tamaño del archivo:', content.length, 'caracteres')
  
  // Verificar que contiene la lógica correcta
  const checks = {
    'Contiene FRONTEND_URL': content.includes('FRONTEND_URL'),
    'Contiene VITE_BASE_URL': content.includes('VITE_BASE_URL'),
    'Contiene RAILWAY_STATIC_URL': content.includes('RAILWAY_STATIC_URL'),
    'Contiene isExplicitLocalDev': content.includes('isExplicitLocalDev'),
    'Contiene localhost:5173': content.includes('localhost:5173'),
    'Contiene beneficial-wholeness': content.includes('beneficial-wholeness'),
    'Contiene logging de baseUrl': content.includes('baseUrl seleccionada') || content.includes('🔗')
  }
  
  console.log('\n🔍 Verificaciones de contenido:')
  Object.entries(checks).forEach(([key, value]) => {
    const status = value ? '✅' : '❌'
    console.log(`   ${status} ${key}: ${value}`)
  })
  
  // Extraer la función de construcción de baseUrl
  const baseUrlMatch = content.match(/let baseUrl = ([^;]+);/)
  if (baseUrlMatch) {
    console.log('\n📋 Lógica de baseUrl encontrada:')
    console.log('   ', baseUrlMatch[1].trim())
  }
  
  // Extraer la lógica de isExplicitLocalDev
  const localDevMatch = content.match(/const isExplicitLocalDev = ([^;]+);/)
  if (localDevMatch) {
    console.log('\n📋 Lógica de isExplicitLocalDev encontrada:')
    console.log('   ', localDevMatch[1].trim())
  }
  
  return true
}

// Función para simular la lógica exacta del shareController
function simulateExactLogic() {
  console.log('\n🔄 === SIMULANDO LÓGICA EXACTA ===')
  console.log()
  
  // Simular diferentes escenarios
  const scenarios = [
    {
      name: 'Railway con FRONTEND_URL',
      env: {
        NODE_ENV: 'production',
        RAILWAY_ENVIRONMENT: 'production',
        FRONTEND_URL: 'https://beneficial-wholeness-production-9cd6.up.railway.app',
        PORT: '3000'
      }
    },
    {
      name: 'Railway sin FRONTEND_URL pero con RAILWAY_STATIC_URL',
      env: {
        NODE_ENV: 'production',
        RAILWAY_ENVIRONMENT: 'production',
        RAILWAY_STATIC_URL: 'beneficial-wholeness-production-9cd6.up.railway.app',
        PORT: '3000'
      }
    },
    {
      name: 'Solo PORT (problemático)',
      env: {
        NODE_ENV: 'development',
        PORT: '3000'
      }
    },
    {
      name: 'Desarrollo local puro',
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'Variables vacías (problemático)',
      env: {
        NODE_ENV: 'production',
        FRONTEND_URL: '',
        VITE_BASE_URL: '',
        PORT: '3000'
      }
    }
  ]
  
  scenarios.forEach((scenario, index) => {
    console.log(`\n📋 ESCENARIO ${index + 1}: ${scenario.name}`)
    console.log('Variables:', JSON.stringify(scenario.env, null, 2))
    
    // Simular la lógica exacta
    const env = scenario.env
    
    // Paso 1: Determinar isExplicitLocalDev
    const isExplicitLocalDev = env.NODE_ENV === 'development' && 
                              !env.RAILWAY_ENVIRONMENT && 
                              !env.RAILWAY_PROJECT_ID && 
                              !env.PORT && 
                              !env.FRONTEND_URL && 
                              !env.VITE_BASE_URL
    
    console.log(`   isExplicitLocalDev: ${isExplicitLocalDev}`)
    
    // Paso 2: Construir baseUrl
    let baseUrl
    
    if (isExplicitLocalDev) {
      baseUrl = 'http://localhost:5173'
    } else {
      baseUrl = env.FRONTEND_URL || 
                env.VITE_BASE_URL || 
                (env.RAILWAY_STATIC_URL ? `https://${env.RAILWAY_STATIC_URL}` : null) ||
                'https://beneficial-wholeness-production-9cd6.up.railway.app'
    }
    
    console.log(`   baseUrl: ${baseUrl}`)
    
    const isLocalhost = baseUrl.includes('localhost')
    const status = isLocalhost ? '🚨 LOCALHOST' : '✅ PRODUCCIÓN'
    console.log(`   Resultado: ${status}`)
    
    if (isLocalhost && !isExplicitLocalDev) {
      console.log('   ⚠️  ADVERTENCIA: localhost sin ser desarrollo local explícito')
    }
  })
}

// Función para verificar el entorno actual
function checkCurrentEnvironment() {
  console.log('\n🌍 === ENTORNO ACTUAL ===')
  console.log()
  
  const currentEnv = {
    NODE_ENV: process.env.NODE_ENV,
    RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
    RAILWAY_PROJECT_ID: process.env.RAILWAY_PROJECT_ID,
    FRONTEND_URL: process.env.FRONTEND_URL,
    VITE_BASE_URL: process.env.VITE_BASE_URL,
    RAILWAY_STATIC_URL: process.env.RAILWAY_STATIC_URL,
    PORT: process.env.PORT
  }
  
  console.log('Variables actuales:')
  Object.entries(currentEnv).forEach(([key, value]) => {
    const status = value ? '✅' : '❌'
    console.log(`   ${status} ${key}: ${value || 'NO DEFINIDA'}`)
  })
  
  // Aplicar la lógica actual
  const isExplicitLocalDev = currentEnv.NODE_ENV === 'development' && 
                            !currentEnv.RAILWAY_ENVIRONMENT && 
                            !currentEnv.RAILWAY_PROJECT_ID && 
                            !currentEnv.PORT && 
                            !currentEnv.FRONTEND_URL && 
                            !currentEnv.VITE_BASE_URL
  
  let baseUrl
  if (isExplicitLocalDev) {
    baseUrl = 'http://localhost:5173'
  } else {
    baseUrl = currentEnv.FRONTEND_URL || 
              currentEnv.VITE_BASE_URL || 
              (currentEnv.RAILWAY_STATIC_URL ? `https://${currentEnv.RAILWAY_STATIC_URL}` : null) ||
              'https://beneficial-wholeness-production-9cd6.up.railway.app'
  }
  
  console.log('\n🎯 RESULTADO PARA ENTORNO ACTUAL:')
  console.log(`   isExplicitLocalDev: ${isExplicitLocalDev}`)
  console.log(`   baseUrl: ${baseUrl}`)
  
  const isLocalhost = baseUrl.includes('localhost')
  const status = isLocalhost ? '🚨 LOCALHOST' : '✅ PRODUCCIÓN'
  console.log(`   Estado: ${status}`)
  
  return { isExplicitLocalDev, baseUrl, isLocalhost }
}

// Función para generar recomendaciones
function generateRecommendations(result) {
  console.log('\n💡 === RECOMENDACIONES ===')
  console.log()
  
  if (result.isLocalhost) {
    console.log('🚨 PROBLEMA: Se está generando localhost')
    console.log()
    
    if (result.isExplicitLocalDev) {
      console.log('📋 CAUSA: Desarrollo local explícito detectado')
      console.log('🔧 SOLUCIONES:')
      console.log('   1. Configura FRONTEND_URL en Railway')
      console.log('   2. O configura NODE_ENV=production')
      console.log('   3. O configura PORT en Railway')
      console.log('   4. Redeploy después de los cambios')
    } else {
      console.log('📋 CAUSA: Error inesperado en la lógica')
      console.log('🔧 SOLUCIONES:')
      console.log('   1. Verifica el código del shareController')
      console.log('   2. Revisa los logs de la aplicación')
      console.log('   3. Contacta al desarrollador')
    }
  } else {
    console.log('✅ CORRECTO: Se está generando URL de producción')
    console.log()
    console.log('Si aún ves localhost en la aplicación:')
    console.log('   1. Limpia caché del navegador')
    console.log('   2. Verifica que estés en la versión más reciente')
    console.log('   3. Revisa si hay múltiples deployments activos')
  }
}

// Función principal
function main() {
  try {
    const controllerExists = analyzeShareController()
    
    if (controllerExists) {
      simulateExactLogic()
      const result = checkCurrentEnvironment()
      generateRecommendations(result)
    }
    
    console.log('\n📋 === INFORMACIÓN DEL SISTEMA ===')
    console.log(`Directorio actual: ${process.cwd()}`)
    console.log(`Node.js version: ${process.version}`)
    console.log(`Plataforma: ${process.platform}`)
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error)
  }
}

// Ejecutar verificación
main()