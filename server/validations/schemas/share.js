import { z } from 'zod'
import { idParamSchema } from './common.js'

/**
 * Schema para crear un enlace compartido
 */
export const createShareLinkSchema = z.object({
  body: z.object({
    laboratorio_id: z.coerce
      .number()
      .int('El ID de laboratorio debe ser un número entero')
      .positive('El ID de laboratorio debe ser mayor a 0'),
    expires_in_days: z.coerce
      .number()
      .int('Los días de expiración deben ser un número entero')
      .min(1, 'Los días de expiración deben ser al menos 1')
      .max(3650, 'Los días de expiración no pueden exceder 3650 (10 años)')
      .optional()
      .default(365)
  })
})

/**
 * Schema para obtener horarios públicos
 */
export const getPublicHorariosSchema = z.object({
  params: z.object({
    laboratorio_id: z.string()
      .regex(/^\d+$/, 'ID de laboratorio debe ser un número')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0, 'ID de laboratorio debe ser mayor a 0')
  }),
  query: z.object({
    token: z.string()
      .min(1, 'El token es requerido')
      .trim()
  })
})

/**
 * Schema para desactivar un enlace compartido
 */
export const deactivateShareLinkSchema = z.object({
  params: idParamSchema
})

/**
 * Schema para eliminar un enlace compartido
 */
export const deleteShareLinkSchema = z.object({
  params: idParamSchema
})

