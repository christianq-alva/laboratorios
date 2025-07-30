import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { getDashboardStats } from '../controllers/dashboardController.js'

const router = express.Router()

// 📊 OBTENER ESTADÍSTICAS DEL DASHBOARD
router.get('/stats', 
  authenticateToken,
  getDashboardStats
)

export default router 