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
  getEscuelaById
)

// Crear nueva escuela
router.post(
  '/', 
  authorize('create', 'Escuela'), 
  createEscuela
)

// Actualizar escuela
router.put(
  '/:id', 
  authorize('update', 'Escuela'), 
  updateEscuela
)

// Eliminar escuela
router.delete(
  '/:id', 
  authorize('delete', 'Escuela'), 
  deleteEscuela
)

export default router

