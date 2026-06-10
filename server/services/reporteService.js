import { Reporte, buildLabFilter } from '../models/Reporte.js'

function firstDayOfMonth(mesYYYYMM) {
  return `${mesYYYYMM}-01`
}
function lastDayOfMonth(mesYYYYMM) {
  const [year, month] = mesYYYYMM.split('-').map(Number)
  return new Date(year, month, 0).toISOString().split('T')[0]
}

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

export async function getHorariosConCosto(params, user) {
  const { escuela_id, laboratorio_id, mes_inicio, mes_fin } = params
  const labFilter = tieneRestriccionLaboratorio(user)
    ? buildLabFilter(user.laboratorio_ids)
    : ''
  const fecha_desde = mes_inicio ? firstDayOfMonth(mes_inicio) : null
  const fecha_hasta = mes_fin ? lastDayOfMonth(mes_fin) : null

  const { data, total_registros } = await Reporte.getHorariosConCosto(
    { escuela_id, laboratorio_id, fecha_desde, fecha_hasta },
    labFilter
  )
  return { data, filtros: { escuela_id: escuela_id || null, laboratorio_id: laboratorio_id || null, mes_inicio: mes_inicio || null, mes_fin: mes_fin || null }, total_registros }
}

export async function getCostoPorEscuela(params, user) {
  const { laboratorio_id, mes_inicio, mes_fin } = params
  const labFilter = tieneRestriccionLaboratorio(user)
    ? buildLabFilter(user.laboratorio_ids)
    : ''
  const fecha_desde = mes_inicio ? firstDayOfMonth(mes_inicio) : null
  const fecha_hasta = mes_fin ? lastDayOfMonth(mes_fin) : null

  const { data, total_registros } = await Reporte.getCostoPorEscuela(
    { laboratorio_id, fecha_desde, fecha_hasta },
    labFilter
  )
  return { data, filtros: { laboratorio_id: laboratorio_id || null, mes_inicio: mes_inicio || null, mes_fin: mes_fin || null }, total_registros }
}

export async function getHorariosPorLaboratorio(params, user) {
  const { laboratorio_id, mes_inicio, mes_fin } = params
  const labFilter = tieneRestriccionLaboratorio(user)
    ? buildLabFilter(user.laboratorio_ids)
    : ''
  const fecha_desde = mes_inicio ? firstDayOfMonth(mes_inicio) : null
  const fecha_hasta = mes_fin ? lastDayOfMonth(mes_fin) : null

  const { data, total_registros } = await Reporte.getHorariosPorLaboratorio(
    { laboratorio_id, fecha_desde, fecha_hasta },
    labFilter
  )
  return { data, filtros: { laboratorio_id: laboratorio_id || null, mes_inicio: mes_inicio || null, mes_fin: mes_fin || null }, total_registros }
}
