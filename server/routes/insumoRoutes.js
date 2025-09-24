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
  upload
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

export default router