import { z } from 'zod'
import { idParamSchema } from './common.js'

/**
 * Estados válidos para un laboratorio
 */
const estadosValidos = ['Activo', 'En Mantenimiento', 'Inhabilitado', 'Baja']

/**
 * Schema para crear un laboratorio
 */
export const createLaboratorioSchema = z.object({
    body: z.object({
        codigo: z.string()
            .trim()
            .min(1, 'El código es obligatorio')
            .max(50, 'El código no puede exceder 50 caracteres'),
        nombre: z.string()
            .trim()
            .min(1, 'El nombre es obligatorio')
            .max(100, 'El nombre no puede exceder 100 caracteres'),
        ubicacion: z.string()
            .trim()
            .min(1, 'La ubicación es obligatoria')
            .max(100, 'La ubicación no puede exceder 100 caracteres'),
        escuela_id: z.number()
            .int('El ID de escuela debe ser un número entero')
            .positive('El ID de escuela debe ser mayor a 0'),
        piso: z.number()
            .int('El piso debe ser un número entero')
            .positive('El piso debe ser mayor a 0'),
        estado: z.enum(estadosValidos, {
            errorMap: () => ({ message: `El estado debe ser uno de: ${estadosValidos.join(', ')}` })
        }).default('Activo')
    })
})

/**
 * Schema para actualizar un laboratorio
 */
export const updateLaboratorioSchema = z.object({
    params: idParamSchema,
    body: z.object({
        codigo: z.string()
            .trim()
            .min(1, 'El código es obligatorio')
            .max(50, 'El código no puede exceder 50 caracteres'),
        nombre: z.string()
            .trim()
            .min(1, 'El nombre es obligatorio')
            .max(100, 'El nombre no puede exceder 100 caracteres')
            .optional(),
        ubicacion: z.string()
            .trim()
            .max(100, 'La ubicación no puede exceder 100 caracteres')
            .optional(),
        escuela_id: z.number()
            .int('El ID de escuela debe ser un número entero')
            .positive('El ID de escuela debe ser mayor a 0')
            .optional(),
        piso: z.number()
            .int('El piso debe ser un número entero')
            .positive('El piso debe ser mayor a 0')
            .optional(),
        estado: z.enum(estadosValidos, {
            errorMap: () => ({ message: `El estado debe ser uno de: ${estadosValidos.join(', ')}` })
        }).optional()
    })
})

/**
 * Schema para obtener un laboratorio por ID
 */
export const getLaboratorioByIdSchema = z.object({
    params: idParamSchema
})

/**
 * Schema para eliminar un laboratorio
 */
export const deleteLaboratorioSchema = z.object({
    params: idParamSchema
})

/**
 * Schema para cambiar el estado de un laboratorio
 */
export const changeEstadoLaboratorioSchema = z.object({
    params: idParamSchema,
    body: z.object({
        estado: z.enum(estadosValidos, {
            errorMap: () => ({ message: `El estado debe ser uno de: ${estadosValidos.join(', ')}` })
        })
    })
})

/**
 * Schema para obtener insumos de un laboratorio
 */
export const getInsumosLaboratorioSchema = z.object({
    params: idParamSchema
})

/**
 * Schema para configurar insumos de un laboratorio
 */
export const configurarInsumosLaboratorioSchema = z.object({
    params: idParamSchema,
    body: z.object({
        insumo_ids: z.array(
            z.number().int('Cada ID de insumo debe ser un número entero').positive('Cada ID de insumo debe ser mayor a 0')
        ).min(0, 'insumo_ids debe ser un array')
    })
})

