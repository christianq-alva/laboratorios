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
import {
  validate,
  createDocenteSchema,
  updateDocenteSchema,
  getDocenteByIdSchema,
  deleteDocenteSchema
} from '../validations/index.js'

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
  validate(getDocenteByIdSchema),
  getDocente
)

// Crear nuevo docente
router.post('/', 
  authenticateToken,
  authorize('create', 'Docente'),
  validate(createDocenteSchema),
  createDocente
)

// Actualizar docente
router.put('/:id', 
  authenticateToken,
  authorize('update', 'Docente'),
  validate(updateDocenteSchema),
  updateDocente
)

// Eliminar docente
router.delete('/:id', 
  authenticateToken,
  authorize('delete', 'Docente'),
  validate(deleteDocenteSchema),
  deleteDocente
)

export default router 