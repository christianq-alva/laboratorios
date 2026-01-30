import { z } from 'zod'
import { idParamSchema, passwordSchema, passwordOptionalSchema } from './common.js'

/**
 * Schema para crear un usuario
 */
export const createUsuarioSchema = z.object({
    body: z.object({
        nombre_completo: z.string()
            .trim()
            .min(1, 'El nombre completo es obligatorio')
            .max(100, 'El nombre completo no puede exceder 100 caracteres'),
        usuario: z.string()
            .trim()
            .min(1, 'El nombre de usuario es obligatorio')
            .max(50, 'El nombre de usuario no puede exceder 50 caracteres'),
        contrasena: passwordSchema,
        rol_id: z.number()
            .int('El ID de rol debe ser un número entero')
            .positive('El ID de rol debe ser mayor a 0'),
        laboratorio_ids: z.array(
            z.number().int('Cada ID de laboratorio debe ser un número entero').positive('Cada ID de laboratorio debe ser mayor a 0')
        ).optional()
            .default([])
    }).refine((data) => {
        // Si es Jefe de Laboratorio (rol_id === 2), debe tener al menos un laboratorio
        if (data.rol_id === 2) {
            return data.laboratorio_ids && data.laboratorio_ids.length > 0
        }
        return true
    }, {
        message: 'Los jefes de laboratorio deben tener al menos un laboratorio asignado',
        path: ['laboratorio_ids']
    })
})

/**
 * Schema para actualizar un usuario
 */
export const updateUsuarioSchema = z.object({
    params: idParamSchema,
    body: z.object({
        nombre_completo: z.string()
            .trim()
            .min(1, 'El nombre completo no puede estar vacío')
            .max(100, 'El nombre completo no puede exceder 100 caracteres')
            .optional(),
        usuario: z.string()
            .trim()
            .min(1, 'El nombre de usuario no puede estar vacío')
            .max(50, 'El nombre de usuario no puede exceder 50 caracteres')
            .optional(),
        contrasena: passwordOptionalSchema,
        rol_id: z.number()
            .int('El ID de rol debe ser un número entero')
            .positive('El ID de rol debe ser mayor a 0')
            .optional(),
        laboratorio_ids: z.array(
            z.number().int('Cada ID de laboratorio debe ser un número entero').positive('Cada ID de laboratorio debe ser mayor a 0')
        ).optional()
    }).refine((data) => {
        // Si se proporciona rol_id y es Jefe de Laboratorio (rol_id === 2), debe tener al menos un laboratorio
        if (data.rol_id === 2 && data.laboratorio_ids !== undefined) {
            return data.laboratorio_ids.length > 0
        }
        return true
    }, {
        message: 'Los jefes de laboratorio deben tener al menos un laboratorio asignado',
        path: ['laboratorio_ids']
    })
})

/**
 * Schema para obtener un usuario por ID
 */
export const getUsuarioByIdSchema = z.object({
    params: idParamSchema
})

/**
 * Schema para eliminar un usuario
 */
export const deleteUsuarioSchema = z.object({
    params: idParamSchema
})

/**
 * Schema para actualizar el estado de un usuario
 */
export const updateEstadoUsuarioSchema = z.object({
    params: idParamSchema,
    body: z.object({
        estado: z.enum(['activo', 'A', 'inactivo', 'I'], {
            errorMap: () => ({ message: 'El estado debe ser "activo"/"A" o "inactivo"/"I"' })
        })
    })
})

