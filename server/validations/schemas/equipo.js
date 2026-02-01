import { z } from 'zod'
import { idParamSchema } from './common.js'

/**
 * Estados válidos para un equipo
 */
const estadosValidos = ['Operativo', 'En Mantenimiento', 'Fuera de Servicio']

/**
 * Condiciones válidas para un equipo
 */
const condicionesValidas = ['Excelente', 'Bueno', 'Regular', 'Malo']


const tipoMovimientosValidos = ['crear', 'actualizar', 'eliminar']
/**
 * Schema para crear un equipo
 */
export const createEquipoSchema = z.object({
    body: z.object({
        codigo: z.string()
            .trim()
            .min(1, 'El código es obligatorio')
            .max(50, 'El código no puede exceder 50 caracteres'),
        nombre: z.string()
            .trim()
            .min(1, 'El nombre es obligatorio')
            .max(255, 'El nombre no puede exceder 255 caracteres'),
        descripcion: z.string()
            .trim()
            .max(500, 'La descripción no puede exceder 500 caracteres')
            .optional()
            .nullable()
            .transform((val) => val === '' ? null : val),
        marca: z.string()
            .trim()
            .max(100, 'La marca no puede exceder 100 caracteres')
            .optional()
            .nullable()
            .transform((val) => val === '' ? null : val),
        modelo: z.string()
            .trim()
            .max(100, 'El modelo no puede exceder 100 caracteres')
            .optional()
            .nullable()
            .transform((val) => val === '' ? null : val),
        numero_serie: z.string()
            .trim()
            .max(100, 'El número de serie no puede exceder 100 caracteres')
            .optional()
            .nullable()
            .transform((val) => val === '' ? null : val),
        estado: z.enum(estadosValidos, {
            errorMap: () => ({ message: `El estado debe ser uno de: ${estadosValidos.join(', ')}` })
        }).default('Operativo'),
        fecha_ultimo_mantenimiento: z.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato YYYY-MM-DD')
            .optional()
            .nullable()
            .transform((val) => val === '' ? null : val),
        fecha_proximo_mantenimiento: z.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato YYYY-MM-DD')
            .optional()
            .nullable()
            .transform((val) => val === '' ? null : val),
        comentarios: z.string()
            .trim()
            .max(500, 'Los comentarios no pueden exceder 500 caracteres')
            .optional()
            .nullable()
            .transform((val) => val === '' ? null : val),
        condicion: z.enum(condicionesValidas, {
            errorMap: () => ({ message: `La condición debe ser una de: ${condicionesValidas.join(', ')}` })
        }).default('Bueno'),
        fecha_adquisicion: z.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato YYYY-MM-DD')
            .min(1, 'La fecha de adquisición es obligatoria'),
        tipo_equipo_id: z.number()
            .int('El ID de tipo de equipo debe ser un número entero')
            .positive('El ID de tipo de equipo debe ser mayor a 0'),
        laboratorio_id: z.number()
            .int('El ID de laboratorio debe ser un número entero')
            .positive('El ID de laboratorio debe ser mayor a 0')
    }).refine((data) => {
        // Si ambas fechas de mantenimiento existen, la próxima debe ser >= a la última
        if (data.fecha_ultimo_mantenimiento && data.fecha_proximo_mantenimiento) {
            const fechaUltimo = new Date(data.fecha_ultimo_mantenimiento)
            const fechaProximo = new Date(data.fecha_proximo_mantenimiento)
            return fechaProximo >= fechaUltimo
        }
        return true
    }, {
        message: 'La fecha del próximo mantenimiento no puede ser anterior a la fecha del último mantenimiento',
        path: ['fecha_proximo_mantenimiento']
    })
})

/**
 * Schema para actualizar un equipo
 */
export const updateEquipoSchema = z.object({
    params: idParamSchema,
    body: z.object({
        codigo: z.string()
            .trim()
            .min(1, 'El código es obligatorio')
            .max(50, 'El código no puede exceder 50 caracteres')
            .optional(),
        nombre: z.string()
            .trim()
            .min(1, 'El nombre es obligatorio')
            .max(255, 'El nombre no puede exceder 255 caracteres')
            .optional(),
        descripcion: z.string()
            .trim()
            .max(500, 'La descripción no puede exceder 500 caracteres')
            .optional()
            .nullable()
            .transform((val) => val === '' ? null : val),
        marca: z.string()
            .trim()
            .max(100, 'La marca no puede exceder 100 caracteres')
            .optional()
            .nullable()
            .transform((val) => val === '' ? null : val),
        modelo: z.string()
            .trim()
            .max(100, 'El modelo no puede exceder 100 caracteres')
            .optional()
            .nullable()
            .transform((val) => val === '' ? null : val),
        numero_serie: z.string()
            .trim()
            .max(100, 'El número de serie no puede exceder 100 caracteres')
            .optional()
            .nullable()
            .transform((val) => val === '' ? null : val),
        estado: z.enum(estadosValidos, {
            errorMap: () => ({ message: `El estado debe ser uno de: ${estadosValidos.join(', ')}` })
        }).optional(),
        fecha_ultimo_mantenimiento: z.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato YYYY-MM-DD')
            .optional()
            .nullable()
            .transform((val) => val === '' ? null : val),
        fecha_proximo_mantenimiento: z.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato YYYY-MM-DD')
            .optional()
            .nullable()
            .transform((val) => val === '' ? null : val),
        comentarios: z.string()
            .trim()
            .max(500, 'Los comentarios no pueden exceder 500 caracteres')
            .optional()
            .nullable()
            .transform((val) => val === '' ? null : val),
        condicion: z.enum(condicionesValidas, {
            errorMap: () => ({ message: `La condición debe ser una de: ${condicionesValidas.join(', ')}` })
        }).optional(),
        fecha_adquisicion: z.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato YYYY-MM-DD')
            .optional(),
        tipo_equipo_id: z.number()
            .int('El ID de tipo de equipo debe ser un número entero')
            .positive('El ID de tipo de equipo debe ser mayor a 0')
            .optional(),
        laboratorio_id: z.number()
            .int('El ID de laboratorio debe ser un número entero')
            .positive('El ID de laboratorio debe ser mayor a 0')
            .optional()
    }).refine((data) => {
        // Si ambas fechas de mantenimiento existen, la próxima debe ser >= a la última
        if (data.fecha_ultimo_mantenimiento && data.fecha_proximo_mantenimiento) {
            const fechaUltimo = new Date(data.fecha_ultimo_mantenimiento)
            const fechaProximo = new Date(data.fecha_proximo_mantenimiento)
            return fechaProximo >= fechaUltimo
        }
        return true
    }, {
        message: 'La fecha del próximo mantenimiento no puede ser anterior a la fecha del último mantenimiento',
        path: ['fecha_proximo_mantenimiento']
    })
})

/**
 * Schema para eliminar un equipo
 */
export const deleteEquipoSchema = z.object({
    params: idParamSchema
})

/**
 * Schema para query de listado de equipos (GET /)
 */
export const getEquiposSchema = z.object({
    query: z.object({
        tipo_equipo_id: z.string()
            .regex(/^\d+$/, 'ID de tipo de equipo debe ser un número')
            .transform((val) => parseInt(val, 10))
            .refine((val) => val > 0, 'ID de tipo de equipo debe ser mayor a 0')
            .optional(),
        laboratorio_id: z.string()
            .regex(/^\d+$/, 'ID de laboratorio debe ser un número')
            .transform((val) => parseInt(val, 10))
            .refine((val) => val > 0, 'ID de laboratorio debe ser mayor a 0')
            .optional(),
        estado: z.enum(estadosValidos, {
            errorMap: () => ({ message: `El estado debe ser uno de: ${estadosValidos.join(', ')}` })
        }).optional()
    }).optional()
})

/**
 * Schema para obtener equipos por laboratorio
 */
export const getEquipoByLaboratorioSchema = z.object({
    params: z.object({
        laboratorio_id: z.string()
            .regex(/^\d+$/, 'ID de laboratorio debe ser un número')
            .transform((val) => parseInt(val, 10))
            .refine((val) => val > 0, 'ID de laboratorio debe ser mayor a 0')
    }),
    query: z.object({
        tipo_equipo_id: z.string()
            .regex(/^\d+$/, 'ID de tipo de equipo debe ser un número')
            .transform((val) => parseInt(val, 10))
            .refine((val) => val > 0, 'ID de tipo de equipo debe ser mayor a 0')
            .optional(),
        estado: z.enum(estadosValidos, {
            errorMap: () => ({ message: `El estado debe ser uno de: ${estadosValidos.join(', ')}` })
        }).optional()
    }).optional()
})

/**
 * Schema para obtener actividad de equipos
 */
export const getActividadEquiposSchema = z.object({
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
        tipo_movimiento: z.enum(tipoMovimientosValidos, {
            errorMap: () => ({ message: `El tipo de movimiento debe ser uno de: ${tipoMovimientosValidos.join(', ')}` })
        }).optional(),
        usuario_id: z.coerce.number()
            .int('El ID de usuario debe ser un número entero')
            .positive('El ID de usuario debe ser mayor a 0')
            .optional()
    }).optional().refine((data) => {
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