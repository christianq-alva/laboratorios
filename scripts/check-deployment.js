#!/usr/bin/env node

console.log('🔍 Verificando configuración de despliegue...')
console.log('')

console.log('📋 Configuración actual:')
console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`)
console.log(`   API URL: ${process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3000/api'}`)
console.log(`   Base URL: ${process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5173'}`)
console.log('')

console.log('🔧 Variables de entorno:')
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`)
console.log(`   DB_HOST: ${process.env.DB_HOST || 'not set'}`)
console.log(`   DB_PORT: ${process.env.DB_PORT || 'not set'}`)
console.log(`   DB_NAME: ${process.env.DB_NAME || 'not set'}`)
console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? 'set' : 'not set'}`)
console.log('')

if (process.env.NODE_ENV === 'production') {
  console.log('✅ Configuración de producción detectada')
  console.log('✅ API apuntará a /api (mismo dominio)')
} else {
  console.log('⚠️  Configuración de desarrollo detectada')
  console.log('⚠️  API apuntará a localhost:3000/api')
}

console.log('')
console.log('🚀 Listo para despliegue!')
