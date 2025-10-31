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
  getById
)

router.post(
  '/',
  authorize('create', 'TipoEquipo'),
  createTipoEquipo
)

router.put(
  '/:id',
  authorize('update', 'TipoEquipo'),
  updateTipoEquipo
)

router.delete(
  '/:id',
  authorize('delete', 'TipoEquipo'),
  deleteTipoEquipo
)


export default router

