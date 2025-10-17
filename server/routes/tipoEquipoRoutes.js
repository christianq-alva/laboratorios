import express from 'express'
import { tipoEquipoController } from '../controllers/tipoEquipoController.js'
import { authenticateToken } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'

const router = express.Router()

// Aplicar autenticación a todas las rutas
router.use(authenticateToken)

// Rutas de tipos de equipo
router.get(
  '/',
  authorize('read', 'TipoEquipo'),
  tipoEquipoController.getAll
)

router.get(
  '/activos',
  authorize('read', 'TipoEquipo'),
  tipoEquipoController.getActivos
)

router.get(
  '/:id',
  authorize('read', 'TipoEquipo'),
  tipoEquipoController.getById
)

router.get(
  '/:id/count-equipos',
  authorize('read', 'TipoEquipo'),
  tipoEquipoController.countEquipos
)

router.post(
  '/',
  authorize('create', 'TipoEquipo'),
  tipoEquipoController.create
)

router.put(
  '/:id',
  authorize('update', 'TipoEquipo'),
  tipoEquipoController.update
)

router.delete(
  '/:id',
  authorize('delete', 'TipoEquipo'),
  tipoEquipoController.delete
)

export default router

