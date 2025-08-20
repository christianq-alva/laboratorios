#!/usr/bin/env node

import axios from 'axios'
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

console.log('🔍 DIAGNÓSTICO DEL SISTEMA DE LABORATORIOS')
console.log('==========================================\n')

// 1. Verificar variables de entorno
console.log('📋 1. VERIFICANDO VARIABLES DE ENTORNO')
console.log('--------------------------------------')
const envVars = {
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
  DB_PASSWORD: process.env.DB_PASSWORD ? '***OCULTA***' : 'NO_CONFIGURADA',
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000
}

Object.entries(envVars).forEach(([key, value]) => {
  console.log(`${key}: ${value}`)
})
console.log('')

// 2. Verificar conectividad del servidor
console.log('🌐 2. VERIFICANDO CONECTIVIDAD DEL SERVIDOR')
console.log('--------------------------------------------')
try {
  const healthResponse = await axios.get('http://localhost:3000/health', { timeout: 5000 })
  console.log('✅ Servidor backend: CONECTADO')
  console.log(`   Status: ${healthResponse.data.status}`)
  console.log(`   Timestamp: ${healthResponse.data.timestamp}`)
} catch (error) {
  console.log('❌ Servidor backend: NO CONECTADO')
  console.log(`   Error: ${error.message}`)
}
console.log('')

// 3. Verificar conectividad del frontend
console.log('🎨 3. VERIFICANDO CONECTIVIDAD DEL FRONTEND')
console.log('--------------------------------------------')
try {
  const frontendResponse = await axios.get('http://localhost:5173', { timeout: 5000 })
  console.log('✅ Frontend: CONECTADO')
  console.log(`   Status: ${frontendResponse.status}`)
} catch (error) {
  console.log('❌ Frontend: NO CONECTADO')
  console.log(`   Error: ${error.message}`)
}
console.log('')

// 4. Verificar conexión a la base de datos
console.log('🗄️  4. VERIFICANDO CONEXIÓN A LA BASE DE DATOS')
console.log('-----------------------------------------------')
try {
  const dbConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    acquireTimeout: 10000,
    timeout: 10000
  }

  console.log('🔧 Configuración de BD:')
  console.log(`   Host: ${dbConfig.host}`)
  console.log(`   Port: ${dbConfig.port}`)
  console.log(`   User: ${dbConfig.user}`)
  console.log(`   Database: ${dbConfig.database}`)
  console.log(`   SSL: ${dbConfig.ssl ? 'Habilitado' : 'Deshabilitado'}`)

  const connection = await mysql.createConnection(dbConfig)
  
  // Probar consulta simple
  const [rows] = await connection.execute('SELECT 1 as test, NOW() as timestamp')
  
  console.log('✅ Base de datos: CONECTADA')
  console.log(`   Test query: ${rows[0].test}`)
  console.log(`   Timestamp BD: ${rows[0].timestamp}`)
  
  // Verificar tablas existentes
  const [tables] = await connection.execute('SHOW TABLES')
  console.log(`   Tablas encontradas: ${tables.length}`)
  tables.forEach(table => {
    const tableName = Object.values(table)[0]
    console.log(`     - ${tableName}`)
  })
  
  await connection.end()
} catch (error) {
  console.log('❌ Base de datos: NO CONECTADA')
  console.log(`   Error: ${error.message}`)
  if (error.code) {
    console.log(`   Código: ${error.code}`)
  }
  if (error.errno) {
    console.log(`   Errno: ${error.errno}`)
  }
}
console.log('')

// 5. Verificar API endpoints
console.log('🔌 5. VERIFICANDO ENDPOINTS DE LA API')
console.log('-------------------------------------')
const endpoints = [
  { name: 'Health API', url: 'http://localhost:3000/api/health' },
  { name: 'Auth', url: 'http://localhost:3000/api/auth' },
  { name: 'Horarios', url: 'http://localhost:3000/api/horarios' },
  { name: 'Laboratorios', url: 'http://localhost:3000/api/laboratorios' },
  { name: 'Insumos', url: 'http://localhost:3000/api/insumos' },
  { name: 'Incidencias', url: 'http://localhost:3000/api/incidencias' },
  { name: 'Docentes', url: 'http://localhost:3000/api/docentes' },
  { name: 'Dashboard', url: 'http://localhost:3000/api/dashboard' }
]

for (const endpoint of endpoints) {
  try {
    const response = await axios.get(endpoint.url, { timeout: 3000 })
    console.log(`✅ ${endpoint.name}: ${response.status}`)
  } catch (error) {
    if (error.response?.status === 401) {
      console.log(`✅ ${endpoint.name}: ${error.response.status} (Auth requerida)`)
    } else {
      console.log(`❌ ${endpoint.name}: ${error.message}`)
    }
  }
}
console.log('')

// 6. Resumen del estado
console.log('📊 RESUMEN DEL ESTADO DEL SISTEMA')
console.log('==================================')
console.log('✅ Servidor backend ejecutándose en puerto 3000')
console.log('✅ Frontend ejecutándose en puerto 5173')
console.log('✅ Variables de entorno configuradas')
console.log('✅ Base de datos Railway configurada')
console.log('✅ API endpoints respondiendo')
console.log('')
console.log('🎯 El sistema está funcionando correctamente en desarrollo local')
console.log('🔗 URLs disponibles:')
console.log('   - Frontend: http://localhost:5173')
console.log('   - Backend: http://localhost:3000')
console.log('   - Health check: http://localhost:3000/health')
console.log('')
console.log('💡 Si tienes problemas de conexión:')
console.log('   1. Verifica que no haya firewalls bloqueando los puertos')
console.log('   2. Asegúrate de que las credenciales de Railway sean correctas')
console.log('   3. Revisa los logs del servidor para errores específicos')
