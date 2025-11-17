import { z } from 'zod'
import { idParamSchema } from './common.js'

//Schema para crear un tipo de equipo
export const createTipoEquipoSchema = z.object({
    body: z.object({
        nombre: z.string()
            .trim()
            .min(1, 'El nombre es obligatorio')
            .max(100, 'El nombre no puede exceder 100 caracteres')
        ,
        descripcion: z.string()
            .trim()
            .max(255, 'La descripción no puede exceder 255 caracteres')
            .optional()
            .nullable()
            .transform((val) => val === '' ? null : val)
    })
})

//Schema para actualizar un tipo de equipo
export const updateTipoEquipoSchema = z.object({
    params: idParamSchema,
    body: z.object({
        nombre: z.string()
            .trim()
            .min(1, 'El nombre es obligatorio')
            .max(100, 'El nombre no puede exceder 100 caracteres')
        ,
        descripcion: z.string()
            .trim()
            .max(255, 'La descripción no puede exceder 255 caracteres')
            .optional()
            .nullable()
            .transform((val) => val === '' ? null : val)
    })
})

//Schema para obtener un tipo de equipo por ID
export const getTipoEquipoByIdSchema = z.object({
    params: idParamSchema
})

//Schema para eliminar un tipo de equipo
export const deleteTipoEquipoSchema = z.object({
    params: idParamSchema
})

