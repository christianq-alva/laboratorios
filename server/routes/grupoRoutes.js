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

// Obtener todos los grupos
router.get('/',
  authenticateToken,
  authorize('read', 'Grupo'),
  getGrupos
)

// Obtener un grupo por ID
router.get('/:id',
  authenticateToken,
  authorize('read', 'Grupo'),
  getGrupoById
)

// Crear nuevo grupo
router.post('/',
  authenticateToken,
  authorize('create', 'Grupo'),
  createGrupo
)

// Actualizar grupo
router.put('/:id',
  authenticateToken,
  authorize('update', 'Grupo'),
  updateGrupo
)

// Eliminar grupo
router.delete('/:id',
  authenticateToken,
  authorize('delete', 'Grupo'),
  deleteGrupo
)

export default router