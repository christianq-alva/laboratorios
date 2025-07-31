import express from 'express'
import cors from 'cors'
import { testConnection } from './config/database.js'
import authRoutes from './routes/authRoutes.js'
import laboratorioRoutes from './routes/laboratorioRoutes.js'
import horarioRoutes from './routes/horarioRoutes.js'
import insumoRoutes from './routes/insumoRoutes.js'
import incidenciaRoutes from './routes/incidenciaRoutes.js'
import docenteRoutes from './routes/docenteRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())

// Configuración de CORS mejorada para dispositivos móviles
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como apps móviles)
    if (!origin) return callback(null, true)
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://laboratorios-production.up.railway.app',
      'https://laboratorios-frontend-production.up.railway.app'
    ]
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      console.log('🚫 Origin bloqueado:', origin)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Endpoint de salud para verificar conectividad
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    origin: req.headers.origin,
    environment: process.env.NODE_ENV || 'development'
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/laboratorios', laboratorioRoutes)
app.use('/api/horarios', horarioRoutes)
app.use('/api/insumos', insumoRoutes)
app.use('/api/incidencias', incidenciaRoutes)
app.use('/api/docentes', docenteRoutes)

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  testConnection()
})