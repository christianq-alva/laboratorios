import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { validate } from '../validations/middleware.js'
import {
  getRequeridoVsConsumidoSchema,
  getStockVsRequeridoSchema,
  getHorariosConCostoSchema,
  getCostoPorEscuelaSchema,
  getHorariosPorLaboratorioSchema,
  getHorasUsoLaboratorioSchema
} from '../validations/index.js'
import {
  getRequeridoVsConsumido,
  getStockVsRequerido,
  getHorariosConCosto,
  getCostoPorEscuela,
  getHorariosPorLaboratorio,
  getHorasUsoLaboratorio
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

router.get('/horarios-costo',
  authenticateToken,
  authorize('read', 'Reporte'),
  validate(getHorariosConCostoSchema),
  getHorariosConCosto
)

router.get('/costo-por-escuela',
  authenticateToken,
  authorize('read', 'Reporte'),
  validate(getCostoPorEscuelaSchema),
  getCostoPorEscuela
)

router.get('/horarios-por-laboratorio',
  authenticateToken,
  authorize('read', 'Reporte'),
  validate(getHorariosPorLaboratorioSchema),
  getHorariosPorLaboratorio
)

router.get('/horas-uso-laboratorio',
  authenticateToken,
  authorize('read', 'Reporte'),
  validate(getHorasUsoLaboratorioSchema),
  getHorasUsoLaboratorio
)

export default router
