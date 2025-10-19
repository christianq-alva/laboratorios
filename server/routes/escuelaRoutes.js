import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
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

// GET /api/escuelas - Obtener todas las escuelas
router.get('/', getEscuelas)

// GET /api/escuelas/:id - Obtener una escuela por ID
router.get('/:id', getEscuelaById)

// POST /api/escuelas - Crear nueva escuela
router.post('/', createEscuela)

// PUT /api/escuelas/:id - Actualizar escuela
router.put('/:id', updateEscuela)

// DELETE /api/escuelas/:id - Eliminar escuela
router.delete('/:id', deleteEscuela)

export default router

