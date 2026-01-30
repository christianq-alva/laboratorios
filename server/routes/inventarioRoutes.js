import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { 
    getAllInsumosWithStock, 
    getInsumosWithPositiveStock, 
    getInsumosWithStock, 
    getActividadInsumos, 
    getActividadDetalleInsumos,
    generarPlantillaReabastecimiento, 
    procesarArchivoExcel, 
    ejecutarReabastecimientoMasivo, 
    getLotesConSaldo, 
    getLotesPorInsumo,
    registrarMovimientoManual,
    eliminarMovimientoInventario, 
} from '../controllers/inventarioController.js'
import {
    validate,
    getInsumosWithStockSchema,
    getInsumosWithPositiveStockSchema,
    getActividadInsumosSchema,
    getActividadDetalleInsumosSchema,
    procesarArchivoExcelSchema,
    ejecutarReabastecimientoMasivoSchema,
    getLotesConSaldoSchema,
    getLotesPorInsumoSchema,
    registrarMovimientoManualSchema
} from '../validations/index.js'
import { upload } from '../controllers/insumoController.js'


const router = express.Router()

// Obtener los insumos y su stock de todos los laboratorios
router.get('/all-con-saldo',
    authenticateToken,
    authorize('read', 'Inventario'),
    getAllInsumosWithStock
)
    
// Obtener los insumos y su stock de un laboratorio
router.get('/insumos-con-saldo',
    authenticateToken,
    authorize('read', 'Inventario'),
    validate(getInsumosWithStockSchema),
    getInsumosWithStock
)

// Obtener solo los insumos con stock de un laboratorio
router.get('/insumos-con-saldo-positivo',
    authenticateToken,
    authorize('read', 'Inventario'),
    validate(getInsumosWithPositiveStockSchema),
    getInsumosWithPositiveStock
)

// Obtener listado de movimiento con filtro de laboratorio, rango de fechas y tipo de movimiento
router.get('/actividad',
    authenticateToken,
    authorize('read', 'Inventario'),
    validate(getActividadInsumosSchema),
    getActividadInsumos
)

// Obtener detalle de movimientos de un insumo específico
router.get('/actividad-detalle',
    authenticateToken,
    authorize('read', 'Inventario'),
    validate(getActividadDetalleInsumosSchema),
    getActividadDetalleInsumos
)

// Generar plantilla excel para reabastecimiento masivo
router.get('/plantilla-excel',
    authenticateToken,
    authorize('create', 'Inventario'),
    generarPlantillaReabastecimiento
)

// Procesar archivo excel para reabastecimiento masivo
router.post('/procesar-excel',
    authenticateToken,
    authorize('create', 'Inventario'),
    upload.single('archivo_excel'),
    validate(procesarArchivoExcelSchema),
    procesarArchivoExcel
)
// Ejecutar reabastecimiento masivo 
router.post('/reabastecimiento-masivo',
    authenticateToken,
    authorize('create', 'Inventario'),
    validate(ejecutarReabastecimientoMasivoSchema),
    ejecutarReabastecimientoMasivo
)
// Obtener lotes con saldo disponible por insumo y laboratorio
router.get('/lotes-con-saldo',
    authenticateToken,
    authorize('read', 'Inventario'),
    validate(getLotesConSaldoSchema),
    getLotesConSaldo
)

// Obtener todos los lotes de un insumo agrupados por laboratorio
router.get('/lotes-por-insumo',
    authenticateToken,
    authorize('read', 'Inventario'),
    validate(getLotesPorInsumoSchema),
    getLotesPorInsumo
)

// Registrar movimiento manual (entrada o salida)
router.post('/movimiento-manual',
    authenticateToken,
    authorize('create', 'Inventario'),
    validate(registrarMovimientoManualSchema),
    registrarMovimientoManual
)

// Eliminar movimiento
router.post('/movimiento-manual/eliminar',
    authenticateToken,
    authorize('delete', 'Inventario'),
    eliminarMovimientoInventario
)
export default router