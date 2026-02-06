import mysql from 'mysql2/promise'
import logger from '../utils/logger.js'

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
  const connection = await pool.getConnection()
  try {
    const [rows] = await connection.execute('SELECT 1 as test')
    logger.info({
      host: dbConfig.host,
      database: dbConfig.database,
      test: rows[0]
    }, 'Conectado a MySQL')
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
  } finally {
    connection.release()
  }
}