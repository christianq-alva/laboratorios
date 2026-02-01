import express from 'express'
import {
  getAll,
  getActivos,
  getById,
  createTipoEquipo,
  updateTipoEquipo,
  deleteTipoEquipo,
  getAllWithCountEquipos
} from '../controllers/tipoEquipoController.js'
import { authenticateToken } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import {
  validate,
  createTipoEquipoSchema,
  updateTipoEquipoSchema,
  getTipoEquipoByIdSchema,
  deleteTipoEquipoSchema
} from '../validations/index.js'

const router = express.Router()

// Aplicar autenticación a todas las rutas
router.use(authenticateToken)

// Listar tipos de equipo
router.get(
  '/',
  authorize('read', 'TipoEquipo'),
  getAll
)

// Obtener tipos de equipo activos
router.get(
  '/activos',
  authorize('read', 'TipoEquipo'),
  getActivos
)

// Obtener tipos de equipo con cantidad de equipos asociados
router.get(
  '/with-count-equipos',
  authorize('read', 'TipoEquipo'),
  getAllWithCountEquipos
)

// Obtener tipo de equipo por ID
router.get(
  '/:id',
  authorize('read', 'TipoEquipo'),
  validate(getTipoEquipoByIdSchema),
  getById
)

// Crear tipo de equipo
router.post(
  '/',
  authorize('create', 'TipoEquipo'),
  validate(createTipoEquipoSchema),
  createTipoEquipo
)

// Actualizar tipo de equipo
router.put(
  '/:id',
  authorize('update', 'TipoEquipo'),
  validate(updateTipoEquipoSchema),
  updateTipoEquipo
)

// Eliminar tipo de equipo
router.delete(
  '/:id',
  authorize('delete', 'TipoEquipo'),
  validate(deleteTipoEquipoSchema),
  deleteTipoEquipo
)


export default router

