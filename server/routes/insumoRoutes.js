import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { 
  getInsumos, 
  createInsumo,
  updateInsumo,
  deleteInsumo,
  getActividadInsumos,
  reabastecimientoInsumos,
  generarPlantillaExcel,
  procesarArchivoExcel,
  ejecutarReabastecimientoMasivo,
  generarPlantillaImportacion,
  previsualizarImportacionMasiva,
  importacionMasiva,
  upload,
  // Nuevos endpoints para stock mínimo
  getStockActual,
  configurarStockMinimo,
  getConfiguracionStock,
  getInsumosStockBajo,
  getInsumosProximosVencer,
  getResumenAlertas,
  // Nuevos endpoints para movimientos manuales
  getLotesConSaldo,
  registrarMovimientoManual
} from '../controllers/insumoController.js'

const router = express.Router()

router.get('/', 
  authenticateToken,
  authorize('read', 'Insumo'),
  getInsumos
)

router.post('/', 
  authenticateToken,
  authorize('create', 'Insumo'),
  createInsumo
)

router.put('/:id', 
  authenticateToken,
  authorize('update', 'Insumo'),
  updateInsumo
)

router.delete('/:id',
  authenticateToken,
  authorize('delete', 'Insumo'),
  deleteInsumo
)

router.get('/actividad', 
  authenticateToken,
  authorize('read', 'Insumo'),
  getActividadInsumos
)

router.post('/reabastecimiento', 
  authenticateToken,
  authorize('create', 'Insumo'),
  reabastecimientoInsumos
)

// Rutas para carga masiva
router.get('/plantilla-excel', 
  authenticateToken,
  authorize('create', 'Insumo'),
  generarPlantillaExcel
)

router.post('/procesar-excel', 
  authenticateToken,
  authorize('create', 'Insumo'),
  upload.single('archivo_excel'),
  procesarArchivoExcel
)

router.post('/reabastecimiento-masivo', 
  authenticateToken,
  authorize('create', 'Insumo'),
  ejecutarReabastecimientoMasivo
)

// Rutas para importación masiva de insumos
router.get('/plantilla-importacion', 
  authenticateToken,
  authorize('create', 'Insumo'),
  generarPlantillaImportacion
)

router.post('/previsualizar-importacion', 
  authenticateToken,
  authorize('create', 'Insumo'),
  upload.single('archivo_excel'),
  previsualizarImportacionMasiva
)

router.post('/importacion-masiva', 
  authenticateToken,
  authorize('create', 'Insumo'),
  upload.single('archivo_excel'),
  importacionMasiva
)

// ================================================================
// NUEVAS RUTAS - SISTEMA DE STOCK MÍNIMO
// ================================================================

// Obtener stock actual de un insumo en un laboratorio
router.get('/stock-actual/:insumo_id/:laboratorio_id',
  authenticateToken,
  authorize('read', 'Insumo'),
  getStockActual
)

// Configurar stock mínimo
router.post('/config-stock',
  authenticateToken,
  authorize('update', 'Insumo'),
  configurarStockMinimo
)

// Obtener configuración de stock de un insumo
router.get('/config-stock/:insumo_id',
  authenticateToken,
  authorize('read', 'Insumo'),
  getConfiguracionStock
)

// Reportes
router.get('/stock-bajo',
  authenticateToken,
  authorize('read', 'Insumo'),
  getInsumosStockBajo
)

router.get('/proximos-vencer',
  authenticateToken,
  authorize('read', 'Insumo'),
  getInsumosProximosVencer
)

router.get('/resumen-alertas',
  authenticateToken,
  authorize('read', 'Insumo'),
  getResumenAlertas
)

// ================================================================
// NUEVAS RUTAS - MOVIMIENTOS MANUALES CON SELECCIÓN DE LOTES
// ================================================================

// Obtener lotes con saldo disponible
router.get('/lotes-con-saldo',
  authenticateToken,
  authorize('read', 'Insumo'),
  getLotesConSaldo
)

// Registrar movimiento manual (entrada o salida)
router.post('/movimiento-manual',
  authenticateToken,
  authorize('create', 'Insumo'),
  registrarMovimientoManual
)

export default router