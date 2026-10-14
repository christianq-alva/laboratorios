import { z } from 'zod'
import { idParamSchema } from './common.js'

/**
 * Porcentaje de depreciación aplicado por práctica sobre el valor del bien.
 * Se expresa en puntos porcentuales (1 = 1%, 0.05 = 0.05%) con hasta 4 decimales,
 * igual que la columna depreciacion_categorias.porcentaje DECIMAL(7,4).
 */
const porcentajeSchema = z.coerce.number({ error: 'El porcentaje debe ser un número' })
  .min(0, 'El porcentaje no puede ser negativo')
  .max(100, 'El porcentaje no puede exceder 100')
  .refine(
    (val) => Number(val.toFixed(4)) === val,
    'El porcentaje no puede tener más de 4 decimales'
  )

/** Activo se recibe como booleano JSON desde el cliente; por defecto la categoría nace activa */
const activoSchema = z.boolean().default(true)

const nombreSchema = z.string()
  .trim()
  .min(1, 'El nombre es obligatorio')
  .max(50, 'El nombre no puede exceder 50 caracteres')

const descripcionSchema = z.string()
  .trim()
  .max(500, 'La descripción no puede exceder 500 caracteres')
  .optional()
  .nullable()
  .transform((val) => val === '' ? null : val)

//Schema para crear una categoría de depreciación
export const createDepreciacionCategoriaSchema = z.object({
  body: z.object({
    nombre: nombreSchema,
    porcentaje: porcentajeSchema,
    descripcion: descripcionSchema,
    activo: activoSchema
  })
})

//Schema para actualizar una categoría de depreciación
export const updateDepreciacionCategoriaSchema = z.object({
  params: idParamSchema,
  body: z.object({
    nombre: nombreSchema,
    porcentaje: porcentajeSchema,
    descripcion: descripcionSchema,
    activo: activoSchema
  })
})

//Schema para obtener una categoría de depreciación por ID
export const getDepreciacionCategoriaByIdSchema = z.object({
  params: idParamSchema
})

//Schema para eliminar una categoría de depreciación
export const deleteDepreciacionCategoriaSchema = z.object({
  params: idParamSchema
})
