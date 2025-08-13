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

const app = express()
const port = process.env.PORT || 3000

// Resolver __dirname en ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(express.json())

// CORS abierto solo para rutas /api (full-stack mismo dominio)
app.use('/api', cors({ origin: true, credentials: true }))
// Preflight para cualquier ruta /api en Express 5
app.options(/^\/api\/.*$/, cors({ origin: true, credentials: true }))

// Healthcheck para Railway
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/laboratorios', laboratorioRoutes)
app.use('/api/horarios', horarioRoutes)
app.use('/api/insumos', insumoRoutes)
app.use('/api/incidencias', incidenciaRoutes)
app.use('/api/docentes', docenteRoutes)

// Servir frontend en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')))
  // Usar RegExp en Express 5 para catch-all (excepto /api)
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'))
  })
}

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`)
  testConnection()
})