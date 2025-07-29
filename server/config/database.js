import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 31787,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'laboratorios',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  ssl: false // Railway interno no necesita SSL
}

console.log('🔧 Configuración de BD:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
  password: dbConfig.password ? '***oculta***' : 'sin_password'
})

export const pool = mysql.createPool(dbConfig)

// Test de conexión mejorado
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection()
    
    // Probar una consulta simple
    const [rows] = await connection.execute('SELECT 1 as test')
    
    console.log('✅ Conectado a MySQL Railway - Host:', dbConfig.host)
    console.log('✅ Base de datos:', dbConfig.database)
    console.log('✅ Test query exitoso:', rows[0])
    
    connection.release()
  } catch (error) {
    console.error('❌ Error conectando a MySQL Railway:')
    console.error('   Host:', dbConfig.host)
    console.error('   Port:', dbConfig.port)
    console.error('   Database:', dbConfig.database)
    console.error('   User:', dbConfig.user)
    console.error('   Error:', error.message)
    
    // Si es error de conexión, mostrar más detalles
    if (error.code) {
      console.error('   Código:', error.code)
    }
    if (error.errno) {
      console.error('   Errno:', error.errno)
    }
  }
}