import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { testConnection } from './config/database.js'
import { generalLimiter } from './middleware/rateLimiter.js'
import authRoutes from './routes/authRoutes.js'
import laboratorioRoutes from './routes/laboratorioRoutes.js'
import horarioRoutes from './routes/horarioRoutes.js'
import insumoRoutes from './routes/insumoRoutes.js'
import inventarioRoutes from './routes/inventarioRoutes.js'
import equipoRoutes from './routes/equipoRoutes.js'
import incidenciaRoutes from './routes/incidenciaRoutes.js'
import docenteRoutes from './routes/docenteRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import shareRoutes from './routes/shareRoutes.js'
import reporteRoutes from './routes/reporteRoutes.js'
import tipoEquipoRoutes from './routes/tipoEquipoRoutes.js'
import unidadRoutes from './routes/unidadRoutes.js'
import escuelaRoutes from './routes/escuelaRoutes.js'
import cicloRoutes from './routes/cicloRoutes.js'
import usuarioRoutes from './routes/usuarioRoutes.js'
import rolRoutes from './routes/rolRoutes.js'

const app = express()
const port = process.env.PORT || 3000

// Resolver __dirname en ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(express.json())

// Configurar Express para confiar en el proxy (necesario para obtener IP real en producción)
app.set('trust proxy', 1)

// CORS abierto solo para rutas /api (full-stack mismo dominio)
app.use('/api', cors({ origin: true, credentials: true }))
// Preflight para cualquier ruta /api en Express 5
app.options(/^\/api\/.*$/, cors({ origin: true, credentials: true }))

// ============================================
// RATE LIMITING GLOBAL
// ============================================
// Aplicar rate limiting general a todas las rutas /api
app.use('/api', generalLimiter)
// Healthcheck para Railway
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString()
  })
})

// Health de API (misma-origin)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    scope: 'api',
    timestamp: new Date().toISOString()
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/laboratorios', laboratorioRoutes)
app.use('/api/horarios', horarioRoutes)
app.use('/api/insumos', insumoRoutes)
app.use('/api/inventario', inventarioRoutes)
app.use('/api/equipos', equipoRoutes)
app.use('/api/incidencias', incidenciaRoutes)
app.use('/api/docentes', docenteRoutes)
app.use('/api/share', shareRoutes)
app.use('/api/reportes', reporteRoutes)
app.use('/api/tipos-equipo', tipoEquipoRoutes)
app.use('/api/unidades', unidadRoutes)
app.use('/api/escuelas', escuelaRoutes)
app.use('/api/ciclos', cicloRoutes)
app.use('/api/usuarios', usuarioRoutes)
app.use('/api/roles', rolRoutes)

// Servir frontend en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')))
  // Usar RegExp en Express 5 para catch-all (excepto /api)
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'))
  })
} else {
  // En desarrollo, solo servir el catch-all para rutas que no sean API
  // Las rutas públicas del frontend son manejadas por Vite
}

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗 Health check: http://localhost:${port}/health`)
  testConnection()
})

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
})

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
  process.exit(1)
})