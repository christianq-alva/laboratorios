import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { 
  getEquipos, 
  createEquipo,
  updateEquipo,
  deleteEquipo,
  getActividadEquipos
} from '../controllers/equipoController.js'

const router = express.Router()

router.get('/', 
  authenticateToken,
  authorize('read', 'Equipo'),
  getEquipos
)

router.post('/', 
  authenticateToken,
  authorize('create', 'Equipo'),
  createEquipo
)

router.put('/:id', 
  authenticateToken,
  authorize('update', 'Equipo'),
  updateEquipo
)

router.delete('/:id',
  authenticateToken,
  authorize('delete', 'Equipo'),
  deleteEquipo
)

router.get('/actividad', 
  authenticateToken,
  authorize('read', 'Equipo'),
  getActividadEquipos
)

export default router
