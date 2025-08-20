#!/usr/bin/env node

import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

console.log('🔧 PROBANDO CONEXIONES A LA BASE DE DATOS')
console.log('=========================================\n')

const configs = [
  {
    name: 'Configuración actual',
    config: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: false,
      connectTimeout: 10000,
      acquireTimeout: 10000,
      timeout: 10000
    }
  },
  {
    name: 'Con SSL habilitado',
    config: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: false },
      connectTimeout: 10000,
      acquireTimeout: 10000,
      timeout: 10000
    }
  },
  {
    name: 'Sin base de datos específica',
    config: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: false,
      connectTimeout: 10000,
      acquireTimeout: 10000,
      timeout: 10000
    }
  },
  {
    name: 'Con timeout extendido',
    config: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: false,
      connectTimeout: 30000,
      acquireTimeout: 30000,
      timeout: 30000
    }
  }
]

for (const { name, config } of configs) {
  console.log(`🧪 Probando: ${name}`)
  console.log(`   Host: ${config.host}:${config.port}`)
  console.log(`   User: ${config.user}`)
  console.log(`   Database: ${config.database || 'N/A'}`)
  console.log(`   SSL: ${config.ssl ? 'Habilitado' : 'Deshabilitado'}`)
  
  try {
    const startTime = Date.now()
    const connection = await mysql.createConnection(config)
    const endTime = Date.now()
    
    console.log(`✅ CONEXIÓN EXITOSA (${endTime - startTime}ms)`)
    
    // Probar consulta simple
    const [rows] = await connection.execute('SELECT 1 as test, NOW() as timestamp')
    console.log(`   Test query: ${rows[0].test}`)
    console.log(`   Timestamp BD: ${rows[0].timestamp}`)
    
    // Si conectó sin base de datos, mostrar las disponibles
    if (!config.database) {
      const [databases] = await connection.execute('SHOW DATABASES')
      console.log(`   Bases de datos disponibles:`)
      databases.forEach(db => {
        const dbName = Object.values(db)[0]
        console.log(`     - ${dbName}`)
      })
    }
    
    await connection.end()
    console.log('')
    
    // Si esta configuración funciona, usarla
    console.log('🎉 ¡CONFIGURACIÓN FUNCIONAL ENCONTRADA!')
    console.log('Actualiza tu archivo .env con esta configuración:')
    console.log('')
    console.log(`DB_HOST=${config.host}`)
    console.log(`DB_PORT=${config.port}`)
    console.log(`DB_USER=${config.user}`)
    console.log(`DB_PASSWORD=${process.env.DB_PASSWORD}`)
    if (config.database) {
      console.log(`DB_NAME=${config.database}`)
    }
    if (config.ssl) {
      console.log('NODE_ENV=production')
    }
    console.log('')
    break
    
  } catch (error) {
    console.log(`❌ FALLA: ${error.message}`)
    if (error.code) {
      console.log(`   Código: ${error.code}`)
    }
    if (error.errno) {
      console.log(`   Errno: ${error.errno}`)
    }
    console.log('')
  }
}

console.log('💡 RECOMENDACIONES:')
console.log('1. Si ninguna configuración funciona, verifica:')
console.log('   - Que las credenciales de Railway sean correctas')
console.log('   - Que no haya firewalls bloqueando el puerto')
console.log('   - Que el servicio de Railway esté activo')
console.log('')
console.log('2. Para verificar Railway desde la línea de comandos:')
console.log(`   mysql -h ${process.env.DB_HOST} -P ${process.env.DB_PORT} -u ${process.env.DB_USER} -p`)
console.log('')
console.log('3. Alternativa: Usar una base de datos local para desarrollo')
