import { Reporte, buildLabFilter } from '../models/Reporte.js'

/**
 * Determina si el usuario tiene restricción por laboratorios (Jefe de Laboratorio con laboratorios asignados).
 */
function tieneRestriccionLaboratorio(user) {
  return user?.rol === 'Jefe de Laboratorio' && user?.laboratorio_ids?.length > 0
}

/**
 * Comparación cantidad requerida vs consumida.
 * Patrón: router → controller → service → model.
 */
export async function getRequeridoVsConsumido(params, user) {
  const { laboratorio_id, escuela_id, fecha_inicio, fecha_fin } = params
  const labFilter = tieneRestriccionLaboratorio(user)
    ? buildLabFilter(user.laboratorio_ids)
    : ''

  const { data, total_registros } = await Reporte.getRequeridoVsConsumido(
    { fecha_inicio, fecha_fin, laboratorio_id, escuela_id },
    labFilter
  )

  return {
    data,
    filtros: {
      laboratorio_id: laboratorio_id || null,
      escuela_id: escuela_id || null,
      fecha_inicio: fecha_inicio || null,
      fecha_fin: fecha_fin || null
    },
    total_registros
  }
}

/**
 * Comparación stock actual vs cantidad requerida.
 * Patrón: router → controller → service → model.
 */
export async function getStockVsRequerido(params, user) {
  const { laboratorio_id, fecha_inicio, fecha_fin } = params
  const labFilter = tieneRestriccionLaboratorio(user)
    ? buildLabFilter(user.laboratorio_ids)
    : ''

  const { data, total_registros } = await Reporte.getStockVsRequerido(
    { fecha_inicio, fecha_fin, laboratorio_id },
    labFilter
  )

  return {
    data,
    filtros: {
      laboratorio_id: laboratorio_id || null,
      fecha_inicio: fecha_inicio || null,
      fecha_fin: fecha_fin || null
    },
    total_registros
  }
}
