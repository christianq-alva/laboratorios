import mysql from 'mysql2/promise'
import { dbConfig, showConfig } from './config.js'

// Mostrar configuración al iniciar
showConfig()

export const pool = mysql.createPool(dbConfig)

// Test de conexión mejorado
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection()
    
    // Probar una consulta simple
    const [rows] = await connection.execute('SELECT 1 as test')
    
    console.log('✅ Conectado a MySQL en la nube - Host:', dbConfig.host)
    console.log('✅ Base de datos:', dbConfig.database)
    console.log('✅ Test query exitoso:', rows[0])
    
    connection.release()
  } catch (error) {
    console.error('❌ Error conectando a MySQL en la nube:')
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
    
    // Sugerencias de solución según el error
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Sugerencia: Verifica que las credenciales sean correctas')
    }
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 Sugerencia: Verifica usuario y contraseña de la base de datos')
    }
    if (error.code === 'ENOTFOUND') {
      console.error('💡 Sugerencia: Verifica que el host sea correcto')
    }
    if (error.code === 'ETIMEDOUT') {
      console.error('💡 Sugerencia: Verifica la conectividad de red')
    }
  }
}