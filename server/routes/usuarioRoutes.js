import express from 'express'
import {
  getAll,
  getById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  updateEstado
} from '../controllers/usuarioController.js'
import { authenticateToken } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'

const router = express.Router()

// Aplicar autenticación a todas las rutas
router.use(authenticateToken)

// Rutas de usuarios
router.get(
  '/',
  authorize('read', 'Usuario'),
  getAll
)

router.get(
  '/:id',
  authorize('read', 'Usuario'),
  getById
)

router.post(
  '/',
  authorize('create', 'Usuario'),
  createUsuario
)

router.put(
  '/:id',
  authorize('update', 'Usuario'),
  updateUsuario
)

router.delete(
  '/:id',
  authorize('delete', 'Usuario'),
  deleteUsuario
)

router.patch(
  '/:id/estado',
  authorize('update', 'Usuario'),
  updateEstado
)

export default router

