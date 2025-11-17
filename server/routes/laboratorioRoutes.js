import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import {
  getLaboratorios,
  createLaboratorio,
  updateLaboratorio,
  deleteLaboratorio,
  changeEstadoLaboratorio,
  getInsumosLaboratorio,
  configurarInsumosLaboratorio
} from '../controllers/laboratorioController.js'
import {
  validate,
  createLaboratorioSchema,
  updateLaboratorioSchema,
  deleteLaboratorioSchema,
  changeEstadoLaboratorioSchema,
  getInsumosLaboratorioSchema,
  configurarInsumosLaboratorioSchema
} from '../validations/index.js'

const router = express.Router()

// Obtener todos los laboratorios
router.get('/',
  authenticateToken,
  authorize('read', 'Laboratorio'),
  getLaboratorios
)

// Crear nuevo laboratorio
router.post('/',
  authenticateToken,
  authorize('create', 'Laboratorio'),
  validate(createLaboratorioSchema),
  createLaboratorio
)

// Actualizar laboratorio
router.put('/:id',
  authenticateToken,
  authorize('update', 'Laboratorio'),
  validate(updateLaboratorioSchema),
  updateLaboratorio
)

// Eliminar laboratorio
router.delete('/:id',
  authenticateToken,
  authorize('update', 'Laboratorio'),
  validate(deleteLaboratorioSchema),
  deleteLaboratorio
)

// Cambiar estado de un laboratorio
router.patch('/:id/estado',
  authenticateToken,
  authorize('update', 'Laboratorio'),
  validate(changeEstadoLaboratorioSchema),
  changeEstadoLaboratorio
)

// Obtener insumos configurados de un laboratorio
router.get('/:id/insumos',
  authenticateToken,
  authorize('read', 'Laboratorio'),
  validate(getInsumosLaboratorioSchema),
  getInsumosLaboratorio
)

// Configurar insumos de un laboratorio
router.put('/:id/insumos',
  authenticateToken,
  authorize('update', 'Laboratorio'),
  validate(configurarInsumosLaboratorioSchema),
  configurarInsumosLaboratorio
)

export default router