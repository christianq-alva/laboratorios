import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import {
  getHorarios,
  getHorario,
  createHorario,
  updateHorario,
  deleteHorario,
  verificarDisponibilidad,
  getActividadHorarios,
  cerrarHorario,
  getInsumosRequeridosById,
} from '../controllers/horarioController.js'

const router = express.Router()

// Cerrar horario y registrar consumo de insumos
router.post('/cerrar',
  authenticateToken,
  authorize('update', 'Horario'),
  cerrarHorario
)

// Listar horarios
router.get('/',
  authenticateToken,
  authorize('read', 'Horario'),
  getHorarios
)

// Obtener actividad de horarios (debe ir antes de /:id)
router.get('/actividad',
  authenticateToken,
  authorize('read', 'Horario'),
  getActividadHorarios
)

// Obtener horario específico
router.get('/:id',
  authenticateToken,
  authorize('read', 'Horario'),
  getHorario
)

// Obtener insumos requeridos por horario
router.get('/:id/insumos-requeridos',
  authenticateToken,
  authorize('read', 'Horario'),
  getInsumosRequeridosById
)

// Crear horario
router.post('/',
  authenticateToken,
  authorize('create', 'Horario'),
  createHorario
)

// Editar horario
router.put('/:id',
  authenticateToken,
  authorize('update', 'Horario'),
  updateHorario
)

// Eliminar horario
router.delete('/:id',
  authenticateToken,
  authorize('delete', 'Horario'),
  deleteHorario
)

// Verificar disponibilidad
router.post('/verificar-disponibilidad',
  authenticateToken,
  authorize('read', 'Horario'),
  verificarDisponibilidad
)

export default router