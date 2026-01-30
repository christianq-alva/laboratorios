import { z } from 'zod'
import { idParamSchema } from './common.js'

/**
 * Schema para obtener una incidencia por ID
 */
export const getIncidenciaByIdSchema = z.object({
  params: idParamSchema
})

/**
 * Schema para crear una incidencia
 */
export const createIncidenciaSchema = z.object({
  body: z.object({
    reserva_id: z.coerce
      .number()
      .int('El ID de reserva debe ser un número entero')
      .positive('El ID de reserva debe ser mayor a 0'),
    titulo: z.string()
      .trim()
      .min(1, 'El título es obligatorio')
      .max(200, 'El título no puede exceder 200 caracteres'),
    descripcion: z.string()
      .trim()
      .max(2000, 'La descripción no puede exceder 2000 caracteres')
      .optional()
      .default('')
  })
})

/**
 * Schema para eliminar una incidencia
 */
export const deleteIncidenciaSchema = z.object({
  params: idParamSchema
})
