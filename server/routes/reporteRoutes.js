import express from 'express'
import { 
  getRequeridoVsConsumido,
  getStockVsRequerido
} from '../controllers/reporteController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// GET /api/reportes/requerido-vs-consumido - Comparación de cantidad requerida vs consumida
router.get('/requerido-vs-consumido', 
  authenticateToken,
  getRequeridoVsConsumido)

// GET /api/reportes/stock-vs-requerido - Comparación de stock actual vs cantidad requerida
router.get('/stock-vs-requerido', 
  authenticateToken,
  getStockVsRequerido)

export default router
