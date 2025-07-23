import express from 'express'
import cors from 'cors'
import { testConnection } from './config/database.js'
import authRoutes from './routes/authRoutes.js'

const app = express()
const port = 3000

app.use(express.json())
app.use(cors())

app.use('/api/auth', authRoutes)

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`)
  testConnection()
})