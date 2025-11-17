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
import {
  validate,
  getHorarioByIdSchema,
  getInsumosRequeridosByIdSchema,
  getActividadHorariosSchema,
  createHorarioSchema,
  updateHorarioSchema,
  deleteHorarioSchema,
  verificarDisponibilidadSchema,
  cerrarHorarioSchema
} from '../validations/index.js'

const router = express.Router()

// Cerrar horario y registrar consumo de insumos
router.post('/cerrar',
  authenticateToken,
  authorize('update', 'Horario'),
  validate(cerrarHorarioSchema),
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
  validate(getActividadHorariosSchema),
  getActividadHorarios
)

// Obtener horario específico
router.get('/:id',
  authenticateToken,
  authorize('read', 'Horario'),
  validate(getHorarioByIdSchema),
  getHorario
)

// Obtener insumos requeridos por horario
router.get('/:id/insumos-requeridos',
  authenticateToken,
  authorize('read', 'Horario'),
  validate(getInsumosRequeridosByIdSchema),
  getInsumosRequeridosById
)

// Crear horario
router.post('/',
  authenticateToken,
  authorize('create', 'Horario'),
  validate(createHorarioSchema),
  createHorario
)

// Editar horario
router.put('/:id',
  authenticateToken,
  authorize('update', 'Horario'),
  validate(updateHorarioSchema),
  updateHorario
)

// Eliminar horario
router.delete('/:id',
  authenticateToken,
  authorize('delete', 'Horario'),
  validate(deleteHorarioSchema),
  deleteHorario
)

// Verificar disponibilidad
router.post('/verificar-disponibilidad',
  authenticateToken,
  authorize('read', 'Horario'),
  validate(verificarDisponibilidadSchema),
  verificarDisponibilidad
)

export default router