import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import {
  createShareLink,
  getPublicHorarios,
  getUserShareLinks,
  deactivateShareLink
} from '../controllers/shareController.js'

const router = express.Router()

// Rutas protegidas (requieren autenticación)
router.post('/create', authenticateToken, createShareLink)
router.get('/my-links', authenticateToken, getUserShareLinks)
router.put('/deactivate/:id', authenticateToken, deactivateShareLink)

// Rutas públicas (sin autenticación)
router.get('/public/:laboratorio_id', getPublicHorarios)

export default router
