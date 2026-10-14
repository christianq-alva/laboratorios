import express from 'express'
import {
  getMateriales,
  getMaterialesByLaboratorio,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial
} from '../controllers/materialReutilizableController.js'
import { authenticateToken } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import {
  validate,
  createMaterialReutilizableSchema,
  updateMaterialReutilizableSchema,
  getMaterialReutilizableByIdSchema,
  deleteMaterialReutilizableSchema,
  getMaterialesByLaboratorioSchema
} from '../validations/index.js'

const router = express.Router()

// Aplicar autenticación a todas las rutas
router.use(authenticateToken)

// Listar materiales reutilizables (filtrado por rol)
router.get(
  '/',
  authorize('read', 'MaterialReutilizable'),
  getMateriales
)

// Materiales de un laboratorio (para armar un horario)
router.get(
  '/laboratorio/:laboratorio_id',
  authorize('read', 'MaterialReutilizable'),
  validate(getMaterialesByLaboratorioSchema),
  getMaterialesByLaboratorio
)

// Obtener material por ID
router.get(
  '/:id',
  authorize('read', 'MaterialReutilizable'),
  validate(getMaterialReutilizableByIdSchema),
  getMaterialById
)

// Crear material
router.post(
  '/',
  authorize('create', 'MaterialReutilizable'),
  validate(createMaterialReutilizableSchema),
  createMaterial
)

// Actualizar material
router.put(
  '/:id',
  authorize('update', 'MaterialReutilizable'),
  validate(updateMaterialReutilizableSchema),
  updateMaterial
)

// Eliminar material
router.delete(
  '/:id',
  authorize('delete', 'MaterialReutilizable'),
  validate(deleteMaterialReutilizableSchema),
  deleteMaterial
)

export default router
