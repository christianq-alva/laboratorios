import { z } from 'zod'
import { idParamSchema } from './common.js'

/**
 * Schema para crear un docente
 */
export const createDocenteSchema = z.object({
    body: z.object({
        nombre: z.string()
            .trim()
            .min(1, 'El nombre es obligatorio')
            .max(100, 'El nombre no puede exceder 100 caracteres'),
        correo: z.union([
            z.string().trim().email('El correo debe tener un formato válido').max(100, 'El correo no puede exceder 100 caracteres'),
            z.string().max(0), // Permite cadena vacía
            z.null(),
            z.undefined()
        ]).optional().transform((val) => !val || val === '' ? null : val),
        escuela_id: z.number()
            .int('El ID de escuela debe ser un número entero')
            .positive('El ID de escuela debe ser mayor a 0')
            .optional()
            .nullable()
            .transform((val) => val === null ? undefined : val)
    })
})

/**
 * Schema para actualizar un docente
 */
export const updateDocenteSchema = z.object({
    params: idParamSchema,
    body: z.object({
        nombre: z.string()
            .trim()
            .min(1, 'El nombre es obligatorio')
            .max(100, 'El nombre no puede exceder 100 caracteres')
            .optional(),
        correo: z.union([
            z.string().trim().email('El correo debe tener un formato válido').max(100, 'El correo no puede exceder 100 caracteres'),
            z.string().max(0), // Permite cadena vacía
            z.null(),
            z.undefined()
        ]).optional().transform((val) => !val || val === '' ? null : val),
        escuela_id: z.number()
            .int('El ID de escuela debe ser un número entero')
            .positive('El ID de escuela debe ser mayor a 0')
            .optional()
            .nullable()
            .transform((val) => val === null ? undefined : val)
    })
})

/**
 * Schema para obtener un docente por ID
 */
export const getDocenteByIdSchema = z.object({
    params: idParamSchema
})

/**
 * Schema para eliminar un docente
 */
export const deleteDocenteSchema = z.object({
    params: idParamSchema
})

