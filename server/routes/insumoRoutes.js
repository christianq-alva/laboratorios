import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { 
  getInsumos, 
  createInsumo,
  getActividadInsumos,
  reabastecimientoInsumos
} from '../controllers/insumoController.js'

const router = express.Router()

router.get('/', 
  authenticateToken,
  authorize('read', 'Insumo'),
  getInsumos
)

router.post('/', 
  authenticateToken,
  authorize('create', 'Insumo'),
  createInsumo
)

router.get('/actividad', 
  authenticateToken,
  authorize('read', 'Insumo'),
  getActividadInsumos
)

router.post('/reabastecimiento', 
  authenticateToken,
  authorize('create', 'Insumo'),
  reabastecimientoInsumos
)

export default router