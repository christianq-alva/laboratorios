import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { 
  getDocentes,
  getDocente,
  createDocente,
  updateDocente,
  deleteDocente
} from '../controllers/docenteController.js'

const router = express.Router()

// Obtener todos los docentes
router.get('/', 
  authenticateToken,
  authorize('read', 'Docente'),
  getDocentes
)

// Obtener docente por ID
router.get('/:id', 
  authenticateToken,
  authorize('read', 'Docente'),
  getDocente
)

// Crear nuevo docente
router.post('/', 
  authenticateToken,
  authorize('create', 'Docente'),
  createDocente
)

// Actualizar docente
router.put('/:id', 
  authenticateToken,
  authorize('update', 'Docente'),
  updateDocente
)

// Eliminar docente
router.delete('/:id', 
  authenticateToken,
  authorize('delete', 'Docente'),
  deleteDocente
)

export default router 