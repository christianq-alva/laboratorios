import { z } from 'zod'
import { idParamSchema } from './common.js'

/**
 * Acciones válidas para actividad de horarios
 */
const accionesValidas = ['crear', 'editar', 'eliminar', 'cerrar', 'reabrir']

/**
 * Schema para obtener un horario por ID
 */
export const getHorarioByIdSchema = z.object({
    params: idParamSchema
})

/**
 * Schema para obtener insumos requeridos por horario
 */
export const getInsumosRequeridosByIdSchema = z.object({
    params: idParamSchema
})

/**
 * Schema para obtener actividad de horarios
 */
export const getActividadHorariosSchema = z.object({
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
        accion: z.enum(accionesValidas, {
            errorMap: () => ({ message: `La acción debe ser una de: ${accionesValidas.join(', ')}` })
        }).optional(),
        usuario_id: z.string()
            .regex(/^\d+$/, 'ID de usuario debe ser un número')
            .transform((val) => parseInt(val, 10))
            .refine((val) => val > 0, 'ID de usuario debe ser mayor a 0')
            .optional()
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
 * Schema para crear un horario
 */
export const createHorarioSchema = z.object({
    body: z.object({
        laboratorio_id: z.number()
            .int('El ID de laboratorio debe ser un número entero')
            .positive('El ID de laboratorio debe ser mayor a 0'),
        docente_id: z.number()
            .int('El ID de docente debe ser un número entero')
            .positive('El ID de docente debe ser mayor a 0'),
        escuela_id: z.number()
            .int('El ID de escuela debe ser un número entero')
            .positive('El ID de escuela debe ser mayor a 0'),
        ciclo_id: z.number()
            .int('El ID de ciclo debe ser un número entero')
            .positive('El ID de ciclo debe ser mayor a 0'),
        descripcion: z.string()
            .trim()
            .min(1, 'La descripción es obligatoria')
            .max(500, 'La descripción no puede exceder 500 caracteres'),
        fecha_inicio: z.string()
            .min(1, 'La fecha de inicio es obligatoria'),
        fecha_fin: z.string()
            .min(1, 'La fecha de fin es obligatoria'),
        cantidad_alumnos: z.number()
            .int('La cantidad de alumnos debe ser un número entero')
            .positive('La cantidad de alumnos debe ser mayor a 0'),
        color: z.string()
            .regex(/^#[0-9A-Fa-f]{6}$/, 'El color debe estar en formato hexadecimal (#RRGGBB)')
            .default('#4ecdc4'),
        num_grupos: z.number()
            .int('El número de grupos debe ser un entero')
            .min(1, 'El número de grupos debe ser al menos 1')
            .default(1),
        insumos: z.array(
            z.object({
                insumo_id: z.number()
                    .int('El ID de insumo debe ser un número entero')
                    .positive('El ID de insumo debe ser mayor a 0'),
                cantidad: z.number()
                    .positive('La cantidad debe ser mayor a 0')
            })
        ).optional().default([]),
        equipos: z.array(
            z.object({
                equipo_id: z.number()
                    .int('El ID de equipo debe ser un número entero')
                    .positive('El ID de equipo debe ser mayor a 0')
            })
        ).optional().default([])
    }).refine((data) => {
        // Validar que fecha_fin sea posterior a fecha_inicio
        try {
            const fechaInicio = new Date(data.fecha_inicio)
            const fechaFin = new Date(data.fecha_fin)
            return fechaFin > fechaInicio
        } catch {
            return false
        }
    }, {
        message: 'La fecha de fin debe ser posterior a la fecha de inicio',
        path: ['fecha_fin']
    })
})

/**
 * Schema para actualizar un horario
 */
export const updateHorarioSchema = z.object({
    params: idParamSchema,
    body: z.object({
        laboratorio_id: z.number()
            .int('El ID de laboratorio debe ser un número entero')
            .positive('El ID de laboratorio debe ser mayor a 0'),
        docente_id: z.number()
            .int('El ID de docente debe ser un número entero')
            .positive('El ID de docente debe ser mayor a 0'),
        escuela_id: z.number()
            .int('El ID de escuela debe ser un número entero')
            .positive('El ID de escuela debe ser mayor a 0'),
        ciclo_id: z.number()
            .int('El ID de ciclo debe ser un número entero')
            .positive('El ID de ciclo debe ser mayor a 0'),
        descripcion: z.string()
            .trim()
            .min(1, 'La descripción es obligatoria')
            .max(500, 'La descripción no puede exceder 500 caracteres'),
        fecha_inicio: z.string()
            .min(1, 'La fecha de inicio es obligatoria'),
        fecha_fin: z.string()
            .min(1, 'La fecha de fin es obligatoria'),
        cantidad_alumnos: z.number()
            .int('La cantidad de alumnos debe ser un número entero')
            .positive('La cantidad de alumnos debe ser mayor a 0')
            .optional()
            .default(1),
        color: z.string()
            .regex(/^#[0-9A-Fa-f]{6}$/, 'El color debe estar en formato hexadecimal (#RRGGBB)')
            .optional()
            .default('#4ecdc4'),
        num_grupos: z.number()
            .int('El número de grupos debe ser un entero')
            .min(1, 'El número de grupos debe ser al menos 1')
            .optional()
            .default(1),
        insumos: z.array(
            z.object({
                insumo_id: z.number()
                    .int('El ID de insumo debe ser un número entero')
                    .positive('El ID de insumo debe ser mayor a 0'),
                cantidad: z.number()
                    .positive('La cantidad debe ser mayor a 0')
            })
        ).optional().default([]),
        equipos: z.array(
            z.object({
                equipo_id: z.number()
                    .int('El ID de equipo debe ser un número entero')
                    .positive('El ID de equipo debe ser mayor a 0')
            })
        ).optional().default([])
    }).refine((data) => {
        // Validar que fecha_fin sea posterior a fecha_inicio
        try {
            const fechaInicio = new Date(data.fecha_inicio)
            const fechaFin = new Date(data.fecha_fin)
            return fechaFin > fechaInicio
        } catch {
            return false
        }
    }, {
        message: 'La fecha de fin debe ser posterior a la fecha de inicio',
        path: ['fecha_fin']
    })
})

/**
 * Schema para eliminar un horario
 */
export const deleteHorarioSchema = z.object({
    params: idParamSchema
})

/**
 * Schema para verificar disponibilidad de horario
 */
export const verificarDisponibilidadSchema = z.object({
    body: z.object({
        laboratorio_id: z.number()
            .int('El ID de laboratorio debe ser un número entero')
            .positive('El ID de laboratorio debe ser mayor a 0'),
        docente_id: z.number()
            .int('El ID de docente debe ser un número entero')
            .positive('El ID de docente debe ser mayor a 0'),
        fecha_inicio: z.string()
            .min(1, 'La fecha de inicio es obligatoria'),
        fecha_fin: z.string()
            .min(1, 'La fecha de fin es obligatoria'),
        horario_id: z.number()
            .int('El ID de horario debe ser un número entero')
            .positive('El ID de horario debe ser mayor a 0')
            .optional()
            .nullable()
            .transform((val) => val === 0 ? null : val)
    }).refine((data) => {
        // Validar que fecha_fin sea posterior a fecha_inicio
        try {
            const fechaInicio = new Date(data.fecha_inicio)
            const fechaFin = new Date(data.fecha_fin)
            return fechaFin > fechaInicio
        } catch {
            return false
        }
    }, {
        message: 'La fecha de fin debe ser posterior a la fecha de inicio',
        path: ['fecha_fin']
    })
})

/**
 * Schema para cerrar horario
 */
export const cerrarHorarioSchema = z.object({
    body: z.object({
        laboratorio_id: z.number()
            .int('El ID de laboratorio debe ser un número entero')
            .positive('El ID de laboratorio debe ser mayor a 0'),
        tipo_movimiento: z.enum(['entrada', 'salida'], {
            errorMap: () => ({ message: 'El tipo de movimiento debe ser "entrada" o "salida"' })
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
            .positive('El ID de reserva debe ser mayor a 0'),
        detalles: z.array(
            z.object({
                insumo_id: z.number()
                    .int('El ID de insumo debe ser un número entero')
                    .positive('El ID de insumo debe ser mayor a 0'),
                cantidad: z.number()
                    .positive('La cantidad debe ser mayor a 0'),
                entrada_detalle_id: z.number()
                    .int('El ID de detalle de entrada debe ser un número entero')
                    .positive('El ID de detalle de entrada debe ser mayor a 0')
                    .optional()
                    .nullable()
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

