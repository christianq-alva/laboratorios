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

// Middleware de autenticación para todas las rutas
router.use(authenticateToken)

// 📊 Rutas de Reportes de Consumo

// GET /api/reportes/consumo-resumen - Obtener resumen de consumo mensual/anual
router.get('/consumo-resumen', getConsumoResumen)

// GET /api/reportes/dashboard-ejecutivo - Obtener datos del dashboard ejecutivo
router.get('/dashboard-ejecutivo', getDashboardEjecutivo)

// GET /api/reportes/top-insumos - Obtener top insumos más consumidos
router.get('/top-insumos', getTopInsumosConsumidos)

// GET /api/reportes/analisis-eficiencia - Obtener análisis de eficiencia por laboratorio
router.get('/analisis-eficiencia', getAnalisisEficiencia)

// GET /api/reportes/exportar - Exportar reportes en diferentes formatos
router.get('/exportar', exportarReporte)

export default router
