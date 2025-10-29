import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import {
  createInsumo,
  updateInsumo,
  deleteInsumo,
  getAllInsumos,
  generarPlantillaImportacion,
  previsualizarImportacionMasiva,
  importacionMasiva,
  upload
} from '../controllers/insumoController.js'

const router = express.Router()

//Crear nuevo insumo
router.post('/',
  authenticateToken,
  authorize('create', 'Insumo'),
  createInsumo
)

//Actualizar insumo
router.put('/:id',
  authenticateToken,
  authorize('update', 'Insumo'),
  updateInsumo
)

//Eliminar insumo
router.delete('/:id',
  authenticateToken,
  authorize('delete', 'Insumo'),
  deleteInsumo
)

//Obtener listado de insumos
router.get('/list',
  authenticateToken,
  authorize('read', 'Insumo'),
  getAllInsumos
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
  upload.single('archivo_excel'),
  previsualizarImportacionMasiva
)

//Ejecutar importación masiva de insumos
router.post('/importacion-masiva',
  authenticateToken,
  authorize('create', 'Insumo'),
  upload.single('archivo_excel'),
  importacionMasiva
)

export default router