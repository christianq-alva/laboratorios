import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { getAll } from '../controllers/rolController.js'

const router = express.Router()

// Obtener todos los roles
router.get('/',
    authenticateToken,
    authorize('read', 'Rol'),
    getAll
)


export default router