import { z } from 'zod'

//Schema para validar IDs numéricos en parámetros de ruta
//Transforma el string a número automáticamente
export const idParamSchema = z.object({
  id: z.string()
    .regex(/^\d+$/, 'ID debe ser un número')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'ID debe ser mayor a 0')
})

