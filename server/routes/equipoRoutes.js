import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { 
  getEquipos,
  getEquipoByLaboratorio,
  createEquipo,
  updateEquipo,
  deleteEquipo,
  getActividadEquipos,
  generarPlantillaImportacionEquipos,
  previsualizarImportacionMasivaEquipos,
  importacionMasivaEquipos
} from '../controllers/equipoController.js'
import multer from 'multer'

// Configurar multer para upload de archivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB límite
  }
})

const router = express.Router()

// Rutas para importación masiva de equipos
router.get('/plantilla-importacion', 
  authenticateToken,
  authorize('create', 'Equipo'),
  generarPlantillaImportacionEquipos
)

router.get('/actividad', 
  authenticateToken,
  authorize('read', 'Equipo'),
  getActividadEquipos
)

router.get('/:laboratorio_id', 
  authenticateToken, 
  authorize('read', 'Equipo'), 
  getEquipoByLaboratorio
)

router.get('/', 
  authenticateToken, 
  authorize('read', 'Equipo'), 
  getEquipos
)

router.post('/', 
  authenticateToken,
  authorize('create', 'Equipo'),
  createEquipo
)

router.put('/:id', 
  authenticateToken,
  authorize('update', 'Equipo'),
  updateEquipo
)

router.delete('/:id',
  authenticateToken,
  authorize('delete', 'Equipo'),
  deleteEquipo
)

router.post('/previsualizar-importacion', 
  authenticateToken,
  authorize('create', 'Equipo'),
  upload.single('archivo_excel'),
  previsualizarImportacionMasivaEquipos
)

router.post('/importacion-masiva', 
  authenticateToken,
  authorize('create', 'Equipo'),
  upload.single('archivo_excel'),
  importacionMasivaEquipos
)

export default router
