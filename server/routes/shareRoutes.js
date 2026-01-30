import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { validate } from '../validations/middleware.js'
import {
  createShareLinkSchema,
  getPublicHorariosSchema,
  deactivateShareLinkSchema,
  deleteShareLinkSchema
} from '../validations/index.js'
import {
  createShareLink,
  getPublicHorarios,
  getUserShareLinks,
  deactivateShareLink,
  deleteShareLink
} from '../controllers/shareController.js'

const router = express.Router()

// Crear link compartido
router.post('/create',
  authenticateToken,
  authorize('create', 'ShareLink'),
  validate(createShareLinkSchema),
  createShareLink
)

// Obtener links compartidos por el usuario
router.get('/my-links',
  authenticateToken,
  authorize('read', 'ShareLink'),
  getUserShareLinks
)

// Desactivar link compartido
router.put('/deactivate/:id',
  authenticateToken,
  authorize('update', 'ShareLink'),
  validate(deactivateShareLinkSchema),
  deactivateShareLink
)

// Eliminar link compartido
router.delete('/delete/:id',
  authenticateToken,
  authorize('delete', 'ShareLink'),
  validate(deleteShareLinkSchema),
  deleteShareLink
)

// Obtener horarios compartidos públicamente (sin autenticación)
router.get('/public/:laboratorio_id',
  validate(getPublicHorariosSchema),
  getPublicHorarios
)

export default router
