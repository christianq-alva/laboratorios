import { z } from 'zod'
import { idParamSchema } from './common.js'

/**
 * Schema para crear una escuela
 */
export const createEscuelaSchema = z.object({
    body: z.object({
        nombre: z.string()
            .trim()
            .min(1, 'El nombre es obligatorio')
            .max(100, 'El nombre no puede exceder 100 caracteres')
    })
})

/**
 * Schema para actualizar una escuela
 */
export const updateEscuelaSchema = z.object({
    params: idParamSchema,
    body: z.object({
        nombre: z.string()
            .trim()
            .min(1, 'El nombre es obligatorio')
            .max(100, 'El nombre no puede exceder 100 caracteres')
    })
})

/**
 * Schema para obtener una escuela por ID
 */
export const getEscuelaByIdSchema = z.object({
    params: idParamSchema
})

/**
 * Schema para eliminar una escuela
 */
export const deleteEscuelaSchema = z.object({
    params: idParamSchema
})

