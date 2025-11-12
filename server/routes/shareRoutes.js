import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import {
  createShareLink,
  getPublicHorarios,
  getUserShareLinks,
  deactivateShareLink
} from '../controllers/shareController.js'
import { authorize } from '../middleware/authorize.js'

const router = express.Router()

// Rutas protegidas (requieren autenticación)
router.post('/create', 
  authenticateToken, 
  authorize('create', 'ShareLink'),
  createShareLink)
router.get('/my-links', 
  authenticateToken, 
  authorize('read', 'ShareLink'),
  getUserShareLinks)
router.put('/deactivate/:id', 
  authenticateToken, 
  authorize('update', 'ShareLink'),
  deactivateShareLink)

// Rutas públicas (sin autenticación)
router.get('/public/:laboratorio_id', 
  getPublicHorarios)

export default router
