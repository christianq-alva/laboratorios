import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import {
  getEscuelas,
  getEscuelaById,
  createEscuela,
  updateEscuela,
  deleteEscuela
} from '../controllers/escuelaController.js'
import {
  validate,
  createEscuelaSchema,
  updateEscuelaSchema,
  getEscuelaByIdSchema,
  deleteEscuelaSchema
} from '../validations/index.js'

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(authenticateToken)

// Obtener todas las escuelas
router.get(
  '/',
  authorize('read', 'Escuela'),
  getEscuelas
)

// Obtener una escuela por ID
router.get(
  '/:id', 
  authorize('read', 'Escuela'),
  validate(getEscuelaByIdSchema),
  getEscuelaById
)

// Crear nueva escuela
router.post(
  '/', 
  authorize('create', 'Escuela'),
  validate(createEscuelaSchema),
  createEscuela
)

// Actualizar escuela
router.put(
  '/:id', 
  authorize('update', 'Escuela'),
  validate(updateEscuelaSchema),
  updateEscuela
)

// Eliminar escuela
router.delete(
  '/:id', 
  authorize('delete', 'Escuela'),
  validate(deleteEscuelaSchema),
  deleteEscuela
)

export default router

