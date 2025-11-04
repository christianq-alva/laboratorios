import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { authorize, authorizeResource } from '../middleware/authorize.js'
import {
  getHorarios,
  getHorario,
  createHorario,
  updateHorario,
  deleteHorario,
  verificarDisponibilidad,
  getActividadHorarios, // ← NUEVO
  cerrarHorario     // ← CERRAR HORARIO
} from '../controllers/horarioController.js'

const router = express.Router()

// ✅ CERRAR HORARIO Y REGISTRAR CONSUMO
router.post('/cerrar',
  authenticateToken,
  authorize('update', 'Horario'),
  cerrarHorario
)

// 📅 LISTAR HORARIOS
router.get('/',
  authenticateToken,
  authorize('read', 'Horario'),
  getHorarios
)

// 📊 OBTENER ACTIVIDAD DE HORARIOS (debe ir antes de /:id)
router.get('/actividad',
  authenticateToken,
  authorize('read', 'Horario'),
  getActividadHorarios
)

// 🔍 OBTENER HORARIO ESPECÍFICO
router.get('/:id',
  authenticateToken,
  authorize('read', 'Horario'),
  getHorario
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

// 🔍 VERIFICAR DISPONIBILIDAD
router.post('/verificar-disponibilidad',
  authenticateToken,
  authorize('read', 'Horario'),
  verificarDisponibilidad
)

export default router