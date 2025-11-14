import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import {
  getGrupos,
  getGrupoById,
  createGrupo,
  updateGrupo,
  deleteGrupo
} from '../controllers/grupoController.js'

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(authenticateToken)

// Obtener todos los grupos
router.get(
  '/',
  authorize('read', 'Grupo'),
  getGrupos
)

// Obtener un grupo por ID
router.get(
  '/:id',
  authorize('read', 'Grupo'),
  getGrupoById
)

// Crear nuevo grupo
router.post(
  '/',
  authorize('create', 'Grupo'),
  createGrupo
)

// Actualizar grupo
router.put(
  '/:id',
  authorize('update', 'Grupo'),
  updateGrupo
)

// Eliminar grupo
router.delete(
  '/:id',
  authorize('delete', 'Grupo'),
  deleteGrupo
)

export default router