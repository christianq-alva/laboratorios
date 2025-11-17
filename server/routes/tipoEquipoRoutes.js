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

// Rutas de tipos de equipo
router.get(
  '/',
  authorize('read', 'TipoEquipo'),
  getAll
)

router.get(
  '/activos',
  authorize('read', 'TipoEquipo'),
  getActivos
)

router.get(
  '/with-count-equipos',
  authorize('read', 'TipoEquipo'),
  getAllWithCountEquipos
)

router.get(
  '/:id',
  authorize('read', 'TipoEquipo'),
  validate(getTipoEquipoByIdSchema),
  getById
)

router.post(
  '/',
  authorize('create', 'TipoEquipo'),
  validate(createTipoEquipoSchema),
  createTipoEquipo
)

router.put(
  '/:id',
  authorize('update', 'TipoEquipo'),
  validate(updateTipoEquipoSchema),
  updateTipoEquipo
)

router.delete(
  '/:id',
  authorize('delete', 'TipoEquipo'),
  validate(deleteTipoEquipoSchema),
  deleteTipoEquipo
)


export default router

