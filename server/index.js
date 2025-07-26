import express from 'express'
import cors from 'cors'
import { testConnection } from './config/database.js'
import authRoutes from './routes/authRoutes.js'
import laboratorioRoutes from './routes/laboratorioRoutes.js'
import horarioRoutes from './routes/horarioRoutes.js'

const app = express()
const port = 3000

app.use(express.json())
app.use(cors())

app.use('/api/auth', authRoutes)
app.use('/api/laboratorios', laboratorioRoutes)
app.use('/api/horarios', horarioRoutes)

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`)
  testConnection()
})