import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { validate } from '../validations/middleware.js'
import {
  getRequeridoVsConsumidoSchema,
  getStockVsRequeridoSchema
} from '../validations/index.js'
import {
  getRequeridoVsConsumido,
  getStockVsRequerido
} from '../controllers/reporteController.js'

const router = express.Router()

// Comparación de cantidad requerida vs consumida
router.get('/requerido-vs-consumido',
  authenticateToken,
  authorize('read', 'Reporte'),
  validate(getRequeridoVsConsumidoSchema),
  getRequeridoVsConsumido
)

// Comparación de stock actual vs cantidad requerida
router.get('/stock-vs-requerido',
  authenticateToken,
  authorize('read', 'Reporte'),
  validate(getStockVsRequeridoSchema),
  getStockVsRequerido
)

export default router
