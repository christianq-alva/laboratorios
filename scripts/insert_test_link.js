import { pool } from '../server/config/database.js'
import jwt from 'jsonwebtoken'

async function insertTestLink() {
  try {
    console.log('🔗 Insertando enlace de prueba...')
    
    // Generar token
    const payload = {
      laboratorio_id: 1,
      created_by: 1,
      type: 'share_link',
      timestamp: Date.now()
    }
    
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '365d' })
    
    // Fecha de expiración (1 año)
    const fechaExpiracion = new Date()
    fechaExpiracion.setFullYear(fechaExpiracion.getFullYear() + 1)
    
    // Insertar en la base de datos
    await pool.execute(`
      INSERT INTO enlaces_compartidos 
      (laboratorio_id, token, creado_por, fecha_expiracion, activo, created_at, updated_at)
      VALUES (?, ?, ?, ?, TRUE, NOW(), NOW())
    `, [1, token, 1, fechaExpiracion])
    
    console.log('✅ Enlace de prueba insertado exitosamente')
    console.log('🔗 Token:', token)
    console.log('🌐 URL de prueba:')
    console.log(`http://localhost:5174/horarios/publico/1?token=${token}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    process.exit(0)
  }
}

insertTestLink()
