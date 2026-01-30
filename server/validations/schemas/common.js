import { z } from 'zod'

//Schema para validar IDs numéricos en parámetros de ruta
//Transforma el string a número automáticamente
export const idParamSchema = z.object({
  id: z.string()
    .regex(/^\d+$/, 'ID debe ser un número')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'ID debe ser mayor a 0')
})

/** Contraseña obligatoria (crear usuario): mínimo 6 caracteres, máximo 255 */
export const passwordSchema = z.string()
  .min(6, 'La contraseña debe tener al menos 6 caracteres')
  .max(255, 'La contraseña no puede exceder 255 caracteres')

/** Contraseña opcional (actualizar usuario): si se envía, mismo rango que passwordSchema */
export const passwordOptionalSchema = z.string()
  .min(6, 'La contraseña debe tener al menos 6 caracteres')
  .max(255, 'La contraseña no puede exceder 255 caracteres')
  .optional()

