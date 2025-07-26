import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { authorize, authorizeResource } from '../middleware/authorize.js'
import { 
  getLaboratorios, 
  createLaboratorio, 
  updateLaboratorio,
  deleteLaboratorio 
} from '../controllers/laboratorioController.js'

const router = express.Router()

// 🔍 LISTAR LABORATORIOS
router.get('/', 
  authenticateToken,                    // 1️⃣ Verificar JWT
  authorize('read', 'Laboratorio'),     // 2️⃣ Verificar permiso general
  getLaboratorios
)

// ➕ CREAR LABORATORIO
router.post('/', 
  authenticateToken,                    // 1️⃣ JWT
  authorize('create', 'Laboratorio'),   // 2️⃣ Solo Admin puede crear labs
  createLaboratorio
)

// ✏️ EDITAR LABORATORIO
router.put('/:id', 
  authenticateToken,                         // 1️⃣ JWT
  authorizeResource('update', 'Laboratorio'), // 2️⃣ Admin o Jefe de su lab
  updateLaboratorio
)

// 🗑️ ELIMINAR LABORATORIO
router.delete('/:id', 
  authenticateToken,                         // 1️⃣ JWT
  authorize('delete', 'Laboratorio'),        // 2️⃣ Solo Admin
  deleteLaboratorio
)

export default router