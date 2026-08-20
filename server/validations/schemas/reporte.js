import { z } from 'zod'

const mesSchema = z.string()
  .regex(/^\d{4}-\d{2}$/, 'El mes debe estar en formato YYYY-MM')
  .optional()

const entidadIdSchema = (nombre) =>
  z.string()
    .regex(/^\d+$/, `ID de ${nombre} debe ser un número`)
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, `ID de ${nombre} debe ser mayor a 0`)
    .optional()

export const getHorariosConCostoSchema = z.object({
  query: z.object({
    escuela_id: entidadIdSchema('escuela'),
    laboratorio_id: entidadIdSchema('laboratorio'),
    ciclo_id: entidadIdSchema('ciclo'),
    mes_inicio: mesSchema,
    mes_fin: mesSchema,
  })
})

export const getCostoPorEscuelaSchema = z.object({
  query: z.object({
    laboratorio_id: entidadIdSchema('laboratorio'),
    mes_inicio: mesSchema,
    mes_fin: mesSchema,
  })
})

export const getHorariosPorLaboratorioSchema = z.object({
  query: z.object({
    laboratorio_id: entidadIdSchema('laboratorio'),
    escuela_id: entidadIdSchema('escuela'),
    mes_inicio: mesSchema,
    mes_fin: mesSchema,
  })
})

export const getHorasUsoLaboratorioSchema = z.object({
  query: z.object({
    laboratorio_id: entidadIdSchema('laboratorio'),
    escuela_id: entidadIdSchema('escuela'),
    ciclo_id: entidadIdSchema('ciclo'),
    mes_inicio: mesSchema,
    mes_fin: mesSchema,
    granularidad: z.enum(['dia', 'semana', 'mes']).optional(),
  })
})


/**
 * Schema para query de reporte requerido vs consumido
 * GET /api/reportes/requerido-vs-consumido
 */
export const getRequeridoVsConsumidoSchema = z.object({
  query: z.object({
    laboratorio_id: z.string()
      .regex(/^\d+$/, 'ID de laboratorio debe ser un número')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0, 'ID de laboratorio debe ser mayor a 0')
      .optional(),
    escuela_id: z.string()
      .regex(/^\d+$/, 'ID de escuela debe ser un número')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0, 'ID de escuela debe ser mayor a 0')
      .optional(),
    fecha_inicio: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato YYYY-MM-DD')
      .optional(),
    fecha_fin: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato YYYY-MM-DD')
      .optional()
  }).refine((data) => {
    if (data.fecha_inicio && data.fecha_fin) {
      const fechaInicio = new Date(data.fecha_inicio)
      const fechaFin = new Date(data.fecha_fin)
      return fechaInicio <= fechaFin
    }
    return true
  }, {
    message: 'La fecha de inicio no puede ser mayor a la fecha de fin',
    path: ['fecha_inicio', 'fecha_fin']
  })
})

/**
 * Schema para query de reporte stock vs requerido
 * GET /api/reportes/stock-vs-requerido
 */
export const getStockVsRequeridoSchema = z.object({
  query: z.object({
    laboratorio_id: z.string()
      .regex(/^\d+$/, 'ID de laboratorio debe ser un número')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0, 'ID de laboratorio debe ser mayor a 0')
      .optional(),
    fecha_inicio: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato YYYY-MM-DD')
      .optional(),
    fecha_fin: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato YYYY-MM-DD')
      .optional()
  }).refine((data) => {
    if (data.fecha_inicio && data.fecha_fin) {
      const fechaInicio = new Date(data.fecha_inicio)
      const fechaFin = new Date(data.fecha_fin)
      return fechaInicio <= fechaFin
    }
    return true
  }, {
    message: 'La fecha de inicio no puede ser mayor a la fecha de fin',
    path: ['fecha_inicio', 'fecha_fin']
  })
})
