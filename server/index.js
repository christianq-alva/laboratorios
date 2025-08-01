import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { testConnection } from './config/database.js'
import authRoutes from './routes/authRoutes.js'
import laboratorioRoutes from './routes/laboratorioRoutes.js'
import horarioRoutes from './routes/horarioRoutes.js'
import insumoRoutes from './routes/insumoRoutes.js'
import incidenciaRoutes from './routes/incidenciaRoutes.js'
import docenteRoutes from './routes/docenteRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const port = process.env.PORT || 3000

// Middleware para logging en producción
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

app.use(express.json())
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://laboratorios-production-bd0d.up.railway.app']
    : true,
  credentials: true
}))

// Servir archivos estáticos del frontend compilado
app.use(express.static(path.join(__dirname, '../dist'), {
  maxAge: '1y',
  etag: true
}))

// Rutas de la API
app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/laboratorios', laboratorioRoutes)
app.use('/api/horarios', horarioRoutes)
app.use('/api/insumos', insumoRoutes)
app.use('/api/incidencias', incidenciaRoutes)
app.use('/api/docentes', docenteRoutes)

// Endpoint de salud para Railway
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Laboratorios API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: port,
    version: process.env.npm_package_version || '1.0.0'
  })
})

// Endpoint de información del sistema
app.get('/api/info', (req, res) => {
  res.json({
    nodeVersion: process.version,
    platform: process.platform,
    memory: process.memoryUsage(),
    uptime: process.uptime()
  })
})

// Manejar todas las demás rutas sirviendo index.html (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'))
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  })
})

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${port}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`📁 Static files: ${path.join(__dirname, '../dist')}`)
  testConnection()
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  process.exit(0)
})