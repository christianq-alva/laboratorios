import { z } from 'zod'
import { idParamSchema } from './common.js'

/**
 * Schema para crear una unidad
 */
export const createUnidadSchema = z.object({
    body: z.object({
        simbolo: z.string()
            .trim()
            .min(1, 'El símbolo es requerido')
            .max(10, 'El símbolo no puede exceder 10 caracteres'),
        nombre: z.string()
            .trim()
            .min(1, 'El nombre es requerido')
            .max(120, 'El nombre no puede exceder 120 caracteres'),
        descripcion: z.string()
            .trim()
            .max(250, 'La descripción no puede exceder 250 caracteres')
            .optional()
            .nullable()
            .transform((val) => val === '' ? null : val)
    })
})

/**
 * Schema para actualizar una unidad
 */
export const updateUnidadSchema = z.object({
    params: idParamSchema,
    body: z.object({
        simbolo: z.string()
            .trim()
            .min(1, 'El símbolo es requerido')
            .max(10, 'El símbolo no puede exceder 10 caracteres'),
        nombre: z.string()
            .trim()
            .min(1, 'El nombre es requerido')
            .max(120, 'El nombre no puede exceder 120 caracteres'),
        descripcion: z.string()
            .trim()
            .max(250, 'La descripción no puede exceder 250 caracteres')
            .optional()
            .nullable()
            .transform((val) => val === '' ? null : val)
    })
})

/**
 * Schema para obtener una unidad por ID
 */
export const getUnidadByIdSchema = z.object({
    params: idParamSchema
})

/**
 * Schema para eliminar una unidad
 */
export const deleteUnidadSchema = z.object({
    params: idParamSchema
})

