import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { validate } from '../validations/middleware.js'
import {
  getIncidenciaByIdSchema,
  createIncidenciaSchema,
  deleteIncidenciaSchema
} from '../validations/index.js'
import {
  getIncidencias,
  getIncidencia,
  createIncidencia,
  getHorariosParaIncidencias,
  deleteIncidencia
} from '../controllers/incidenciaController.js'

const router = express.Router()

// Listar incidencias
router.get('/',
  authenticateToken,
  authorize('read', 'Incidencia'),
  getIncidencias
)

// Obtener horarios disponibles para reportar incidencias
router.get('/horarios/disponibles',
  authenticateToken,
  authorize('read', 'Incidencia'),
  getHorariosParaIncidencias
)

// Ver incidencia específica
router.get('/:id',
  authenticateToken,
  authorize('read', 'Incidencia'),
  validate(getIncidenciaByIdSchema),
  getIncidencia
)

// Crear incidencia
router.post('/',
  authenticateToken,
  authorize('create', 'Incidencia'),
  validate(createIncidenciaSchema),
  createIncidencia
)

// Eliminar incidencia
router.delete('/:id',
  authenticateToken,
  authorize('delete', 'Incidencia'),
  validate(deleteIncidenciaSchema),
  deleteIncidencia
)

export default router