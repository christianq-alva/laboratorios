#!/usr/bin/env node

import { execSync } from 'child_process'
import { existsSync, rmSync } from 'fs'
import { join } from 'path'

console.log('🧪 Probando build local...')
console.log('')

try {
  // Limpiar build anterior
  if (existsSync('dist')) {
    console.log('🧹 Limpiando build anterior...')
    rmSync('dist', { recursive: true, force: true })
  }

  // Verificar Node.js
  console.log('🔍 Verificando Node.js...')
  execSync('npm run check-node', { stdio: 'inherit' })

  // Instalar dependencias
  console.log('📦 Instalando dependencias...')
  execSync('npm install', { stdio: 'inherit' })

  // Build de TypeScript
  console.log('🔨 Build de TypeScript...')
  execSync('npm run build:typescript', { stdio: 'inherit' })

  // Build del frontend
  console.log('🎨 Build del frontend...')
  execSync('npm run build:frontend', { stdio: 'inherit' })

  // Verificar que se creó el directorio dist
  if (existsSync('dist')) {
    console.log('✅ Build exitoso!')
    console.log('📁 Directorio dist creado correctamente')
    
    // Listar archivos generados
    const fs = await import('fs')
    const files = fs.readdirSync('dist')
    console.log('📄 Archivos generados:', files.length)
  } else {
    throw new Error('No se creó el directorio dist')
  }

} catch (error) {
  console.error('❌ Error en el build:', error.message)
  process.exit(1)
}

console.log('')
console.log('🚀 Build listo para despliegue!')
