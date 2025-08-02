import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

// Configuración del servidor
export const PORT = process.env.PORT || 3000
export const NODE_ENV = process.env.NODE_ENV || 'development'

// Configuración de la base de datos
export const DB_HOST = process.env.DB_HOST || 'localhost'
export const DB_PORT = parseInt(process.env.DB_PORT) || 3306
export const DB_USER = process.env.DB_USER || 'root'
export const DB_PASSWORD = process.env.DB_PASSWORD || ''
export const DB_NAME = process.env.DB_NAME || 'laboratorios'
export const DB_PROVIDER = process.env.DB_PROVIDER || 'railway'

// Configuración JWT
export const JWT_SECRET = process.env.JWT_SECRET || 'mi_clave_super_secreta_123'

// Configuración del frontend
export const VITE_API_URL = process.env.VITE_API_URL || '/api'

// Configuración SSL según el proveedor
export const getSSLConfig = () => {
  switch (DB_PROVIDER.toLowerCase()) {
    case 'railway':
      return NODE_ENV === 'production' ? {
        rejectUnauthorized: false
      } : false
    case 'planetscale':
      return {
        rejectUnauthorized: false
      }
    case 'aws':
    case 'rds':
      return {
        rejectUnauthorized: false
      }
    case 'google':
    case 'gcp':
      return {
        rejectUnauthorized: false
      }
    case 'azure':
      return {
        rejectUnauthorized: false
      }
    case 'digitalocean':
      return {
        rejectUnauthorized: false
      }
    default:
      return false
  }
}

// Configuración completa de la base de datos
export const dbConfig = {
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: getSSLConfig(),
  // Configuraciones adicionales para estabilidad
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
}

// Función para mostrar la configuración (sin contraseñas)
export const showConfig = () => {
  console.log('🔧 Configuración de la aplicación:')
  console.log('   Servidor:', { PORT, NODE_ENV })
  console.log('   Base de datos:', {
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    database: DB_NAME,
    provider: DB_PROVIDER,
    ssl: getSSLConfig() ? 'habilitado' : 'deshabilitado'
  })
  console.log('   Frontend API:', VITE_API_URL)
} 