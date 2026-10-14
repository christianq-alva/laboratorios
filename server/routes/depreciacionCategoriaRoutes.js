import express from 'express'
import {
  getAll,
  getActivas,
  getAllWithCount,
  getById,
  createDepreciacionCategoria,
  updateDepreciacionCategoria,
  deleteDepreciacionCategoria
} from '../controllers/depreciacionCategoriaController.js'
import { authenticateToken } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import {
  validate,
  createDepreciacionCategoriaSchema,
  updateDepreciacionCategoriaSchema,
  getDepreciacionCategoriaByIdSchema,
  deleteDepreciacionCategoriaSchema
} from '../validations/index.js'

const router = express.Router()

// Aplicar autenticación a todas las rutas
router.use(authenticateToken)

// Listar categorías de depreciación
router.get(
  '/',
  authorize('read', 'DepreciacionCategoria'),
  getAll
)

// Obtener categorías activas (para los selectores de equipos y materiales)
router.get(
  '/activas',
  authorize('read', 'DepreciacionCategoria'),
  getActivas
)

// Obtener categorías con la cantidad de bienes asignados
router.get(
  '/with-count',
  authorize('read', 'DepreciacionCategoria'),
  getAllWithCount
)

// Obtener categoría por ID
router.get(
  '/:id',
  authorize('read', 'DepreciacionCategoria'),
  validate(getDepreciacionCategoriaByIdSchema),
  getById
)

// Crear categoría
router.post(
  '/',
  authorize('create', 'DepreciacionCategoria'),
  validate(createDepreciacionCategoriaSchema),
  createDepreciacionCategoria
)

// Actualizar categoría
router.put(
  '/:id',
  authorize('update', 'DepreciacionCategoria'),
  validate(updateDepreciacionCategoriaSchema),
  updateDepreciacionCategoria
)

// Eliminar categoría
router.delete(
  '/:id',
  authorize('delete', 'DepreciacionCategoria'),
  validate(deleteDepreciacionCategoriaSchema),
  deleteDepreciacionCategoria
)

export default router
