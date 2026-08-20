import { z } from 'zod'
import { idParamSchema } from './common.js'

/**
 * Categorías válidas para un insumo
 */
const categoriasValidas = ['Reactivos', 'Materiales', 'Material_Biologico', 'Farmacos', 'Insumos']

/**
 * Schema para crear un insumo
 */
export const createInsumoSchema = z.object({
    body: z.object({
        nombre: z.string()
            .trim()
            .min(1, 'El nombre es requerido')
            .max(255, 'El nombre no puede exceder 255 caracteres'),
        descripcion: z.string()
            .trim()
            .max(500, 'La descripción no puede exceder 500 caracteres')
            .optional()
            .nullable()
            .transform((val) => val === '' ? null : val),
        unidad_id: z.number()
            .int('El ID de unidad debe ser un número entero')
            .positive('El ID de unidad debe ser mayor a 0'),
        categoria: z.enum(categoriasValidas, {
            errorMap: () => ({ message: `La categoría debe ser una de: ${categoriasValidas.join(', ')}` })
        }),
        presentacion: z.string()
            .trim()
            .max(100, 'La presentación no puede exceder 100 caracteres')
            .optional()
            .nullable()
            .transform((val) => val === '' ? null : val),
        cantidad_por_presentacion: z.number({
            error: 'La cantidad por presentación debe ser un número'
        })
            .positive('La cantidad por presentación debe ser mayor a 0')
            .max(99999999, 'La cantidad por presentación es demasiado grande')
            .optional()
            .default(1)
    })
})

/**
 * Schema para actualizar un insumo
 */
export const updateInsumoSchema = z.object({
    params: idParamSchema,
    body: z.object({
        nombre: z.string()
            .trim()
            .min(1, 'El nombre es requerido')
            .max(255, 'El nombre no puede exceder 255 caracteres'),
        descripcion: z.string()
            .trim()
            .max(500, 'La descripción no puede exceder 500 caracteres')
            .optional()
            .nullable()
            .transform((val) => val === '' ? null : val),
        unidad_id: z.number()
            .int('El ID de unidad debe ser un número entero')
            .positive('El ID de unidad debe ser mayor a 0'),
        categoria: z.enum(categoriasValidas, {
            errorMap: () => ({ message: `La categoría debe ser una de: ${categoriasValidas.join(', ')}` })
        }),
        presentacion: z.string()
            .trim()
            .max(100, 'La presentación no puede exceder 100 caracteres')
            .optional()
            .nullable()
            .transform((val) => val === '' ? null : val),
        cantidad_por_presentacion: z.number({
            error: 'La cantidad por presentación debe ser un número'
        })
            .positive('La cantidad por presentación debe ser mayor a 0')
            .max(99999999, 'La cantidad por presentación es demasiado grande')
            .optional()
            .default(1)
    })
})

/**
 * Schema para eliminar un insumo
 */
export const deleteInsumoSchema = z.object({
    params: idParamSchema
})

