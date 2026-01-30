import { z } from 'zod'
import { passwordSchema } from './common.js'

/**
 * Schema para login (POST /api/auth/login)
 */
export const loginSchema = z.object({
  body: z.object({
    usuario: z.string()
      .trim()
      .min(1, 'El nombre de usuario es obligatorio')
      .max(50, 'El nombre de usuario no puede exceder 50 caracteres'),
    contrasena: passwordSchema
  })
})
