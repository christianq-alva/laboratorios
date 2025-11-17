import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import {
  createShareLink,
  getPublicHorarios,
  getUserShareLinks,
  deactivateShareLink,
  deleteShareLink
} from '../controllers/shareController.js'
import { authorize } from '../middleware/authorize.js'
import {
  validate,
  createShareLinkSchema,
  getPublicHorariosSchema,
  deactivateShareLinkSchema,
  deleteShareLinkSchema
} from '../validations/index.js'

const router = express.Router()

// Rutas protegidas (requieren autenticación)
router.post('/create', 
  authenticateToken, 
  authorize('create', 'ShareLink'),
  validate(createShareLinkSchema),
  createShareLink)
router.get('/my-links', 
  authenticateToken, 
  authorize('read', 'ShareLink'),
  getUserShareLinks)
router.put('/deactivate/:id', 
  authenticateToken, 
  authorize('update', 'ShareLink'),
  validate(deactivateShareLinkSchema),
  deactivateShareLink)
router.delete('/delete/:id', 
  authenticateToken, 
  authorize('delete', 'ShareLink'),
  validate(deleteShareLinkSchema),
  deleteShareLink)

// Rutas públicas (sin autenticación)
router.get('/public/:laboratorio_id', 
  validate(getPublicHorariosSchema),
  getPublicHorarios)

export default router
