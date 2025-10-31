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
  getCiclos,        // ← NUEVO
  getGrupos,        // ← NUEVO
  debugHorarios,    // ← DEBUG
  diagnosticarZonaHoraria,  // ← DIAGNÓSTICO ZONA HORARIA
  cerrarHorario     // ← CERRAR HORARIO
} from '../controllers/horarioController.js'

const router = express.Router()

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

// ==================== RUTAS UTILITARIAS ==================== 

// 📅 OBTENER CICLOS  
router.get('/utils/ciclos', 
  authenticateToken,
  authorize('read', 'Horario'),
  getCiclos
)

// 👥 OBTENER GRUPOS (con filtros opcionales)
router.get('/utils/grupos', 
  authenticateToken,
  authorize('read', 'Horario'),
  getGrupos
)

// 🔍 DEBUG: VERIFICAR TODOS LOS REGISTROS
router.get('/debug', 
  authenticateToken,
  debugHorarios
)

// 🕐 DIAGNÓSTICO: ZONA HORARIA DEL SERVIDOR
router.get('/diagnostico/timezone', 
  authenticateToken,
  diagnosticarZonaHoraria
)

// ✅ CERRAR HORARIO Y REGISTRAR CONSUMO
router.post('/:id/cerrar', 
  authenticateToken,
  authorize('update', 'Horario'),
  cerrarHorario
)

export default router