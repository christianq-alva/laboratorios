import { z } from 'zod'
import { idParamSchema } from './common.js'

/**
 * Tipos de movimiento válidos
 */
const tiposMovimientoValidos = ['entrada', 'salida']

/**
 * Schema para obtener insumos con stock por laboratorio
 */
export const getInsumosWithStockSchema = z.object({
    query: z.object({
        laboratorio_id: z.string()
            .regex(/^\d+$/, 'ID de laboratorio debe ser un número')
            .transform((val) => parseInt(val, 10))
            .refine((val) => val > 0, 'ID de laboratorio debe ser mayor a 0')
    })
})

/**
 * Schema para obtener insumos con stock positivo por laboratorio
 */
export const getInsumosWithPositiveStockSchema = z.object({
    query: z.object({
        laboratorio_id: z.string()
            .regex(/^\d+$/, 'ID de laboratorio debe ser un número')
            .transform((val) => parseInt(val, 10))
            .refine((val) => val > 0, 'ID de laboratorio debe ser mayor a 0')
    })
})

/**
 * Schema para obtener actividad de insumos
 */
export const getActividadInsumosSchema = z.object({
    query: z.object({
        laboratorio_id: z.string()
            .regex(/^\d+$/, 'ID de laboratorio debe ser un número')
            .transform((val) => parseInt(val, 10))
            .refine((val) => val > 0, 'ID de laboratorio debe ser mayor a 0')
            .optional(),
        fecha_inicio: z.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato YYYY-MM-DD')
            .optional(),
        fecha_fin: z.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato YYYY-MM-DD')
            .optional(),
        tipo_movimiento: z.enum(tiposMovimientoValidos, {
            errorMap: () => ({ message: `El tipo de movimiento debe ser uno de: ${tiposMovimientoValidos.join(', ')}` })
        }).optional()
    }).refine((data) => {
        // Si ambas fechas existen, la fecha de inicio debe ser <= a la fecha de fin
        if (data.fecha_inicio && data.fecha_fin) {
            const fechaInicio = new Date(data.fecha_inicio)
            const fechaFin = new Date(data.fecha_fin)
            return fechaInicio <= fechaFin
        }
        return true
    }, {
        message: 'La fecha de inicio no puede ser mayor a la fecha de fin',
        path: ['fecha_inicio', 'fecha_fin']
    })
})

/**
 * Schema para obtener actividad detalle de insumos
 */
export const getActividadDetalleInsumosSchema = z.object({
    query: z.object({
        insumo_id: z.string()
            .regex(/^\d+$/, 'ID de insumo debe ser un número')
            .transform((val) => parseInt(val, 10))
            .refine((val) => val > 0, 'ID de insumo debe ser mayor a 0'),
        laboratorio_id: z.string()
            .regex(/^\d+$/, 'ID de laboratorio debe ser un número')
            .transform((val) => parseInt(val, 10))
            .refine((val) => val > 0, 'ID de laboratorio debe ser mayor a 0')
            .optional()
    })
})

/**
 * Schema para procesar archivo Excel de reabastecimiento
 */
export const procesarArchivoExcelSchema = z.object({
    query: z.object({
        laboratorio_id: z.string()
            .regex(/^\d+$/, 'ID de laboratorio debe ser un número')
            .transform((val) => parseInt(val, 10))
            .refine((val) => val > 0, 'ID de laboratorio debe ser mayor a 0')
    })
})

/**
 * Schema para ejecutar reabastecimiento masivo
 */
export const ejecutarReabastecimientoMasivoSchema = z.object({
    body: z.object({
        laboratorio_id: z.number()
            .int('El ID de laboratorio debe ser un número entero')
            .positive('El ID de laboratorio debe ser mayor a 0'),
        fecha_movimiento: z.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato YYYY-MM-DD'),
        motivo_general: z.string()
            .trim()
            .min(1, 'El motivo es obligatorio')
            .max(500, 'El motivo no puede exceder 500 caracteres')
            .optional()
            .nullable()
            .transform((val) => val === '' ? null : val),
        datos_reabastecimiento: z.array(
            z.object({
                insumo_id: z.number()
                    .int('El ID de insumo debe ser un número entero')
                    .positive('El ID de insumo debe ser mayor a 0'),
                cantidad: z.number()
                    .int('La cantidad debe ser un número entero')
                    .positive('La cantidad debe ser mayor a 0'),
                lote: z.string()
                    .trim()
                    .max(100, 'El lote no puede exceder 100 caracteres')
                    .optional()
                    .nullable()
                    .transform((val) => val === '' ? null : val),
                fecha_vencimiento: z.string()
                    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato YYYY-MM-DD')
                    .optional()
                    .nullable()
                    .transform((val) => val === '' ? null : val)
            })
        ).min(1, 'Debe haber al menos un registro de reabastecimiento')
    })
})

/**
 * Schema para obtener lotes con saldo
 */
export const getLotesConSaldoSchema = z.object({
    query: z.object({
        laboratorio_id: z.string()
            .regex(/^\d+$/, 'ID de laboratorio debe ser un número')
            .transform((val) => parseInt(val, 10))
            .refine((val) => val > 0, 'ID de laboratorio debe ser mayor a 0'),
        insumo_id: z.string()
            .regex(/^\d+$/, 'ID de insumo debe ser un número')
            .transform((val) => parseInt(val, 10))
            .refine((val) => val > 0, 'ID de insumo debe ser mayor a 0')
    })
})

/**
 * Schema para obtener lotes por insumo
 */
export const getLotesPorInsumoSchema = z.object({
    query: z.object({
        insumo_id: z.string()
            .regex(/^\d+$/, 'ID de insumo debe ser un número')
            .transform((val) => parseInt(val, 10))
            .refine((val) => val > 0, 'ID de insumo debe ser mayor a 0'),
        laboratorio_id: z.string()
            .regex(/^\d+$/, 'ID de laboratorio debe ser un número')
            .transform((val) => parseInt(val, 10))
            .refine((val) => val > 0, 'ID de laboratorio debe ser mayor a 0')
            .optional()
    })
})

/**
 * Schema para registrar movimiento manual
 */
export const registrarMovimientoManualSchema = z.object({
    body: z.object({
        laboratorio_id: z.number()
            .int('El ID de laboratorio debe ser un número entero')
            .positive('El ID de laboratorio debe ser mayor a 0'),
        tipo_movimiento: z.enum(tiposMovimientoValidos, {
            errorMap: () => ({ message: `El tipo de movimiento debe ser uno de: ${tiposMovimientoValidos.join(', ')}` })
        }),
        fecha_movimiento: z.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato YYYY-MM-DD'),
        observaciones: z.string()
            .trim()
            .max(500, 'Las observaciones no pueden exceder 500 caracteres')
            .optional()
            .nullable()
            .transform((val) => val === '' ? null : val),
        reserva_id: z.number()
            .int('El ID de reserva debe ser un número entero')
            .positive('El ID de reserva debe ser mayor a 0')
            .optional()
            .nullable()
            .transform((val) => val === 0 ? null : val),
        detalles: z.array(
            z.object({
                insumo_id: z.number()
                    .int('El ID de insumo debe ser un número entero')
                    .positive('El ID de insumo debe ser mayor a 0'),
                cantidad: z.number()
                    .int('La cantidad debe ser un número entero')
                    .positive('La cantidad debe ser mayor a 0'),
                lote: z.string()
                    .trim()
                    .max(100, 'El lote no puede exceder 100 caracteres')
                    .optional()
                    .nullable()
                    .transform((val) => val === '' ? null : val),
                fecha_vencimiento: z.string()
                    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato YYYY-MM-DD')
                    .optional()
                    .nullable()
                    .transform((val) => val === '' ? null : val),
                entrada_detalle_id: z.number()
                    .int('El ID de detalle de entrada debe ser un número entero')
                    .positive('El ID de detalle de entrada debe ser mayor a 0')
                    .optional()
                    .nullable()
                    .transform((val) => val === undefined ? null : val)
            })
        ).min(1, 'Debe haber al menos un detalle en el movimiento')
    }).refine((data) => {
        // Si es salida, todos los detalles deben tener entrada_detalle_id
        if (data.tipo_movimiento === 'salida') {
            return data.detalles.every(detalle => detalle.entrada_detalle_id !== null && detalle.entrada_detalle_id !== undefined)
        }
        return true
    }, {
        message: 'Todos los detalles de salida deben incluir el ID del detalle de entrada (entrada_detalle_id)',
        path: ['detalles']
    })
})

