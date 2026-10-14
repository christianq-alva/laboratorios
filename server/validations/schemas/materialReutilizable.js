import { z } from 'zod'
import { idParamSchema } from './common.js'

/** Valor de UNA unidad del material: base de cálculo de la depreciación por práctica */
const valorUnitarioSchema = z.coerce.number({ error: 'El valor unitario debe ser un número' })
  .min(0, 'El valor unitario no puede ser negativo')
  .max(99999999.99, 'El valor unitario excede el máximo permitido')
  .refine((val) => Number(val.toFixed(2)) === val, 'El valor unitario no puede tener más de 2 decimales')
  .optional()
  .nullable()

const cantidadTotalSchema = z.coerce.number({ error: 'La cantidad total debe ser un número' })
  .int('La cantidad total debe ser un número entero')
  .min(0, 'La cantidad total no puede ser negativa')
  .max(999999, 'La cantidad total excede el máximo permitido')
  .default(0)

const depreciacionCategoriaIdSchema = z.coerce.number({ error: 'La categoría de depreciación debe ser un número' })
  .int('El ID de la categoría de depreciación debe ser un número entero')
  .positive('El ID de la categoría de depreciación debe ser mayor a 0')
  .optional()
  .nullable()

const codigoSchema = z.string()
  .trim()
  .min(1, 'El código es obligatorio')
  .max(50, 'El código no puede exceder 50 caracteres')

const nombreSchema = z.string()
  .trim()
  .min(1, 'El nombre es obligatorio')
  .max(255, 'El nombre no puede exceder 255 caracteres')

const descripcionSchema = z.string()
  .trim()
  .max(1000, 'La descripción no puede exceder 1000 caracteres')
  .optional()
  .nullable()
  .transform((val) => val === '' ? null : val)

const laboratorioIdSchema = z.coerce.number({ error: 'El laboratorio debe ser un número' })
  .int('El ID de laboratorio debe ser un número entero')
  .positive('El ID de laboratorio debe ser mayor a 0')

//Schema para crear un material reutilizable
export const createMaterialReutilizableSchema = z.object({
  body: z.object({
    codigo: codigoSchema,
    nombre: nombreSchema,
    descripcion: descripcionSchema,
    laboratorio_id: laboratorioIdSchema,
    cantidad_total: cantidadTotalSchema,
    valor_unitario: valorUnitarioSchema,
    depreciacion_categoria_id: depreciacionCategoriaIdSchema,
    activo: z.boolean().default(true)
  })
})

//Schema para actualizar un material reutilizable
export const updateMaterialReutilizableSchema = z.object({
  params: idParamSchema,
  body: z.object({
    codigo: codigoSchema,
    nombre: nombreSchema,
    descripcion: descripcionSchema,
    laboratorio_id: laboratorioIdSchema,
    cantidad_total: cantidadTotalSchema,
    valor_unitario: valorUnitarioSchema,
    depreciacion_categoria_id: depreciacionCategoriaIdSchema,
    activo: z.boolean().default(true)
  })
})

//Schema para obtener un material reutilizable por ID
export const getMaterialReutilizableByIdSchema = z.object({
  params: idParamSchema
})

//Schema para eliminar un material reutilizable
export const deleteMaterialReutilizableSchema = z.object({
  params: idParamSchema
})

//Schema para listar los materiales de un laboratorio
export const getMaterialesByLaboratorioSchema = z.object({
  params: z.object({
    laboratorio_id: z.string()
      .regex(/^\d+$/, 'El ID del laboratorio debe ser un número')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0, 'El ID del laboratorio debe ser mayor a 0')
  })
})
