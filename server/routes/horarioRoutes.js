import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { authorize, authorizeResource } from '../middleware/authorize.js'
import { 
  getHorarios, 
  createHorario, 
  updateHorario,
  deleteHorario,
  verificarDisponibilidad,
  getEscuelas,      // ← NUEVO
  getCiclos,        // ← NUEVO
  getGrupos,        // ← NUEVO
  debugHorarios     // ← DEBUG
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

// 🔍 VERIFICAR DISPONIBILIDAD
router.post('/verificar-disponibilidad', 
  authenticateToken,
  authorize('read', 'Horario'),
  verificarDisponibilidad
)

// ==================== RUTAS UTILITARIAS ==================== 

// 🏫 OBTENER ESCUELAS
router.get('/utils/escuelas', 
  authenticateToken,
  authorize('read', 'Horario'),
  getEscuelas
)

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

export default router