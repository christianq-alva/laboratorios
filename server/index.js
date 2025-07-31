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
app.use(cors())

// Endpoint de salud para verificar que el servidor funciona
app.get('/', (req, res) => {
  res.json({ 
    message: 'Laboratorios API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
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