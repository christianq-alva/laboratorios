import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { 
    getAllInsumosWithStock, 
    getInsumosWithPositiveStock, 
    getInsumosWithStock, 
    getActividadInsumos, 
    generarPlantillaReabastecimiento, 
    procesarArchivoExcel, 
    ejecutarReabastecimientoMasivo, 
    getLotesConSaldo, 
    registrarMovimientoManual, 
} from '../controllers/inventarioController.js'
import { upload } from '../controllers/insumoController.js'


const router = express.Router()

//Obtener los insumos y su stock de todos los laboratorios
router.get('/all-con-saldo',
    authenticateToken,
    authorize('read', 'Insumo'),
    getAllInsumosWithStock
)

//Obtener los insumos y su stock de un laboratorio
router.get('/insumos-con-saldo',
    authenticateToken,
    authorize('read', 'Insumo'),
    getInsumosWithStock
)

//Obtener solo los insumos con stock de un laboratorio
router.get('/insumos-con-saldo-positivo',
    authenticateToken,
    authorize('read', 'Insumo'),
    getInsumosWithPositiveStock
)

//Obtener listado de movimiento con filtro de laboratorio, rango de fechas y tipo de movimiento
router.get('/actividad',
    authenticateToken,
    authorize('read', 'Insumo'),
    getActividadInsumos
)

//Generar plantilla excel para reabastecimiento masivo
router.get('/plantilla-excel',
    authenticateToken,
    authorize('create', 'Inventario'),
    generarPlantillaReabastecimiento
)

//Procesar archivo excel para reabastecimiento masivo
router.post('/procesar-excel',
    authenticateToken,
    authorize('create', 'Insumo'),
    upload.single('archivo_excel'),
    procesarArchivoExcel
)
//Ejecutar reabastecimiento masivo 
router.post('/reabastecimiento-masivo',
    authenticateToken,
    authorize('create', 'Insumo'),
    ejecutarReabastecimientoMasivo
)
//Obtener lotes con saldo disponible por insumo y laboratorio
router.get('/lotes-con-saldo',
    authenticateToken,
    authorize('read', 'Insumo'),
    getLotesConSaldo
)

// Registrar movimiento manual (entrada o salida)
router.post('/movimiento-manual',
    authenticateToken,
    authorize('create', 'Insumo'),
    registrarMovimientoManual
)
export default router