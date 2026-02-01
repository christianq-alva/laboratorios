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
import {
  validate,
  createUsuarioSchema,
  updateUsuarioSchema,
  getUsuarioByIdSchema,
  deleteUsuarioSchema,
  updateEstadoUsuarioSchema
} from '../validations/index.js'

const router = express.Router()

// Aplicar autenticación a todas las rutas
router.use(authenticateToken)

// Listar usuarios
router.get(
  '/',
  authorize('read', 'Usuario'),
  getAll
)

// Obtener usuario por ID
router.get(
  '/:id',
  authorize('read', 'Usuario'),
  validate(getUsuarioByIdSchema),
  getById
)

// Crear usuario
router.post(
  '/',
  authorize('create', 'Usuario'),
  validate(createUsuarioSchema),
  createUsuario
)

// Actualizar usuario
router.put(
  '/:id',
  authorize('update', 'Usuario'),
  validate(updateUsuarioSchema),
  updateUsuario
)

// Eliminar usuario
router.delete(
  '/:id',
  authorize('delete', 'Usuario'),
  validate(deleteUsuarioSchema),
  deleteUsuario
)

// Cambiar estado de un usuario
router.patch(
  '/:id/estado',
  authorize('update', 'Usuario'),
  validate(updateEstadoUsuarioSchema),
  updateEstado
)

export default router

