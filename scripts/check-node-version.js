#!/usr/bin/env node

import { readFileSync } from 'fs'
import { join } from 'path'

// Leer la versión requerida del package.json
const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'))
const requiredNodeVersion = packageJson.engines?.node || '>=20.0.0'

// Obtener la versión actual de Node.js
const currentNodeVersion = process.version

console.log('🔍 Verificando versión de Node.js...')
console.log('')
console.log(`📋 Versión actual: ${currentNodeVersion}`)
console.log(`📋 Versión requerida: ${requiredNodeVersion}`)
console.log('')

// Verificación simple (puedes usar semver para una verificación más robusta)
const majorVersion = parseInt(currentNodeVersion.slice(1).split('.')[0])

if (majorVersion >= 20) {
  console.log('✅ Versión de Node.js compatible')
} else {
  console.log('❌ Versión de Node.js incompatible')
  console.log('   Se requiere Node.js 20 o superior')
  process.exit(1)
}

console.log('')
console.log('🚀 Node.js listo para el despliegue!')
