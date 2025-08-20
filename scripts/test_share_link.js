import jwt from 'jsonwebtoken'

// Generar un token de prueba para el laboratorio ID 1
const payload = {
  laboratorio_id: 1,
  created_by: 1,
  type: 'share_link',
  timestamp: Date.now()
}

const token = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '365d' })

console.log('🔗 Token de prueba generado:')
console.log(token)
console.log('')
console.log('🌐 URL de prueba:')
console.log(`http://localhost:5174/horarios/publico/1?token=${token}`)
console.log('')
console.log('📡 Endpoint API:')
console.log(`http://localhost:3000/api/share/public/1?token=${encodeURIComponent(token)}`)
