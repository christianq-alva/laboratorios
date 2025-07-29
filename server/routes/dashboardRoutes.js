import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { getDashboardStats, debugDashboard } from '../controllers/dashboardController.js'

const router = express.Router()

// 📊 OBTENER ESTADÍSTICAS DEL DASHBOARD
router.get('/stats', 
  authenticateToken,
  getDashboardStats
)

// 🔧 DEBUG DEL DASHBOARD (temporal)
router.get('/debug', 
  authenticateToken,
  debugDashboard
)

export default router 