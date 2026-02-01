import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import logger from '../utils/logger.js'

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
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  acquireTimeout: 60000,
  timeout: 60000,
  timezone: '-05:00'
}

logger.info({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
  password: dbConfig.password ? '***oculta***' : 'sin_password'
}, 'Configuración de BD')

export const pool = mysql.createPool(dbConfig)

// Test de conexión mejorado
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection()
    
    // Probar una consulta simple
    const [rows] = await connection.execute('SELECT 1 as test')
    logger.info({
      host: dbConfig.host,
      database: dbConfig.database,
      test: rows[0]
    }, 'Conectado a MySQL')
    connection.release()
  } catch (error) {
    logger.error({
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      message: error.message,
      code: error.code,
      errno: error.errno
    }, 'Error conectando a MySQL')
  }
}