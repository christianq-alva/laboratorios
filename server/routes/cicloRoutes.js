
import { authenticateToken } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { getCiclos } from '../controllers/cicloController.js'
import express from 'express'

const router = express.Router()

router.get('/',
    authenticateToken,
    authorize('read', 'Ciclo'),
    getCiclos)  

export default router