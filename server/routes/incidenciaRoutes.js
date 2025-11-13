import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { 
  getIncidencias,
  getIncidencia, 
  createIncidencia,
  getHorariosParaIncidencias,
  deleteIncidencia
} from '../controllers/incidenciaController.js'

const router = express.Router()

// 📋 LISTAR INCIDENCIAS
router.get('/', 
  authenticateToken,
  authorize('read', 'Incidencia'),
  getIncidencias
)

// 🔍 VER INCIDENCIA ESPECÍFICA
router.get('/:id', 
  authenticateToken,
  authorize('read', 'Incidencia'),
  getIncidencia
)

// ➕ CREAR INCIDENCIA
router.post('/', 
  authenticateToken,
  authorize('create', 'Incidencia'),
  createIncidencia
)

// 📅 OBTENER HORARIOS PARA REPORTAR INCIDENCIAS
router.get('/horarios/disponibles', 
  authenticateToken,
  authorize('read', 'Incidencia'),
  getHorariosParaIncidencias
)

// 🗑️ ELIMINAR INCIDENCIA
router.delete('/:id', 
  authenticateToken,
  authorize('delete', 'Incidencia'),
  deleteIncidencia
)

export default router