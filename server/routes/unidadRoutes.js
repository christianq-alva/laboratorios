import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import {
  createUnidad,
  updateUnidad,
  deleteUnidad,
  getAllUnidades,
  getUnidadById
} from '../controllers/unidadController.js'
import {
  validate,
  createUnidadSchema,
  updateUnidadSchema,
  getUnidadByIdSchema,
  deleteUnidadSchema
} from '../validations/index.js'

const router = express.Router()

// Aplicar autenticación a todas las rutas
router.use(authenticateToken)

// Crear unidad
router.post(
  '/',
  authorize('create', 'Unidad'),
  validate(createUnidadSchema),
  createUnidad
)

// Actualizar unidad
router.put(
  '/:id',
  authorize('update', 'Unidad'),
  validate(updateUnidadSchema),
  updateUnidad
)

// Eliminar unidad
router.delete(
  '/:id',
  authorize('delete', 'Unidad'),
  validate(deleteUnidadSchema),
  deleteUnidad
)

// Obtener listado de unidades
router.get(
  '/',
  authorize('read', 'Unidad'),
  getAllUnidades
)

// Obtener unidad por ID
router.get(
  '/:id',
  authorize('read', 'Unidad'),
  validate(getUnidadByIdSchema),
  getUnidadById
)

export default router

