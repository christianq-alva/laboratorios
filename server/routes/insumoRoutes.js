import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { heavyOperationLimiter } from '../middleware/rateLimiter.js'
import {
  createInsumo,
  updateInsumo,
  deleteInsumo,
  getAllInsumos,
  getPrecioInsumo,
  setPrecioInsumo,
  generarPlantillaImportacion,
  previsualizarImportacionMasiva,
  importacionMasiva,
  upload
} from '../controllers/insumoController.js'
import {
  validate,
  createInsumoSchema,
  updateInsumoSchema,
  deleteInsumoSchema
} from '../validations/index.js'

const router = express.Router()

//Crear nuevo insumo
router.post('/',
  authenticateToken,
  authorize('create', 'Insumo'),
  validate(createInsumoSchema),
  createInsumo
)

//Actualizar insumo
router.put('/:id',
  authenticateToken,
  authorize('update', 'Insumo'),
  validate(updateInsumoSchema),
  updateInsumo
)

//Eliminar insumo
router.delete('/:id',
  authenticateToken,
  authorize('delete', 'Insumo'),
  validate(deleteInsumoSchema),
  deleteInsumo
)

//Obtener listado de insumos
router.get('/list',
  authenticateToken,
  authorize('read', 'Insumo'),
  getAllInsumos
)

// Obtener precio e historial de un insumo
router.get('/:id/precio',
  authenticateToken,
  authorize('read', 'Insumo'),
  getPrecioInsumo
)

// Establecer nuevo precio de un insumo
router.put('/:id/precio',
  authenticateToken,
  authorize('update', 'Insumo'),
  setPrecioInsumo
)

//Generar plantilla Excel para importación masiva de insumos
router.get('/plantilla-importacion',
  authenticateToken,
  authorize('create', 'Insumo'),
  generarPlantillaImportacion
)
//Procesar archivo Excel para importación masiva de insumos
router.post('/previsualizar-importacion',
  authenticateToken,
  authorize('create', 'Insumo'),
  heavyOperationLimiter,
  upload.single('archivo_excel'),
  previsualizarImportacionMasiva
)

//Ejecutar importación masiva de insumos
router.post('/importacion-masiva',
  authenticateToken,
  authorize('create', 'Insumo'),
  heavyOperationLimiter,
  upload.single('archivo_excel'),
  importacionMasiva
)

export default router