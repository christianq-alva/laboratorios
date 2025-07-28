import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { 
  getDocentes,
  getDocente,
  createDocente,
  updateDocente,
  deleteDocente,
  getDocenteHorarios,
  getEscuelas
} from '../controllers/docenteController.js'

const router = express.Router()

// 📋 LISTAR DOCENTES
router.get('/', 
  authenticateToken,
  authorize('read', 'Docente'),
  getDocentes
)

// 🔍 VER DOCENTE ESPECÍFICO
router.get('/:id', 
  authenticateToken,
  authorize('read', 'Docente'),
  getDocente
)

// ➕ CREAR DOCENTE
router.post('/', 
  authenticateToken,
  authorize('create', 'Docente'),
  createDocente
)

// ✏️ EDITAR DOCENTE
router.put('/:id', 
  authenticateToken,
  authorize('update', 'Docente'),
  updateDocente
)

// 🗑️ ELIMINAR DOCENTE
router.delete('/:id', 
  authenticateToken,
  authorize('delete', 'Docente'),
  deleteDocente
)

// 📅 VER HORARIOS DE UN DOCENTE
router.get('/:id/horarios', 
  authenticateToken,
  authorize('read', 'Docente'),
  getDocenteHorarios
)

// 🏫 OBTENER ESCUELAS (para el selector)
router.get('/utils/escuelas', 
  authenticateToken,
  authorize('read', 'Docente'),
  getEscuelas
)

export default router 