
import { authenticateToken } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { getGrupos } from '../controllers/grupoController.js'
import express from 'express'

const router = express.Router()

router.get('/',
    authenticateToken,
    authorize('read', 'Grupo'),
    getGrupos)

export default router