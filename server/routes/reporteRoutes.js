import express from 'express'
import { 
  getConsumoResumen,
  getDashboardEjecutivo,
  getTopInsumosConsumidos,
  getAnalisisEficiencia,
  exportarReporte
} from '../controllers/reporteController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// GET /api/reportes/consumo-resumen - Obtener resumen de consumo mensual/anual
router.get('/consumo-resumen', 
  authenticateToken,
  getConsumoResumen)

// GET /api/reportes/dashboard-ejecutivo - Obtener datos del dashboard ejecutivo
router.get('/dashboard-ejecutivo', 
  authenticateToken,
  getDashboardEjecutivo)

// GET /api/reportes/top-insumos - Obtener top insumos más consumidos
router.get('/top-insumos', 
  authenticateToken,
  getTopInsumosConsumidos)

// GET /api/reportes/analisis-eficiencia - Obtener análisis de eficiencia por laboratorio
router.get('/analisis-eficiencia', 
  authenticateToken,
  getAnalisisEficiencia)

// GET /api/reportes/exportar - Exportar reportes en diferentes formatos
router.get('/exportar', 
  authenticateToken,
  exportarReporte)

export default router
