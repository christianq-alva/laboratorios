import mysql from 'mysql2/promise'

const dbConfig = {
  host: 'localhost',
  user: 'root',          // Cambia por tu usuario
  password: '',          // Cambia por tu password
  database: 'laboratorios', // Cambia por tu BD
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}

export const pool = mysql.createPool(dbConfig)

// Test de conexión
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection()
    console.log('✅ Conectado a MySQL')
    connection.release()
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message)
  }
}