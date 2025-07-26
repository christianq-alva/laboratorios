import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { authorize, authorizeResource } from '../middleware/authorize.js'
import { 
  getHorarios, 
  createHorario, 
  updateHorario,
  deleteHorario 
} from '../controllers/horarioController.js'

const router = express.Router()

// 📅 LISTAR HORARIOS
router.get('/', 
  authenticateToken,
  authorize('read', 'Horario'),
  getHorarios
)

// ➕ CREAR HORARIO
router.post('/', 
  authenticateToken,
  authorize('create', 'Horario'),
  createHorario
)

// ✏️ EDITAR HORARIO
router.put('/:id', 
    authenticateToken,                    // Solo verificar JWT
    authorize('update', 'Horario'),       // Verificar permiso general
    updateHorario                         // El controlador maneja la lógica específica
  )

// 🗑️ ELIMINAR HORARIO
router.delete('/:id', 
  authenticateToken,
  authorize('delete', 'Horario'),
  deleteHorario
)

export default router