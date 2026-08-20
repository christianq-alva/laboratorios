import * as reporteService from '../services/reporteService.js'

export const getHorariosConCosto = async (req, res, next) => {
  try {
    const payload = await reporteService.getHorariosConCosto(req.query, req.user)
    res.status(200).json(payload)
  } catch (error) {
    next(error)
  }
}

export const getCostoPorEscuela = async (req, res, next) => {
  try {
    const payload = await reporteService.getCostoPorEscuela(req.query, req.user)
    res.status(200).json(payload)
  } catch (error) {
    next(error)
  }
}

export const getHorasUsoLaboratorio = async (req, res, next) => {
  try {
    const payload = await reporteService.getHorasUsoLaboratorio(req.query, req.user)
    res.status(200).json(payload)
  } catch (error) {
    next(error)
  }
}

export const getHorariosPorLaboratorio = async (req, res, next) => {
  try {
    const payload = await reporteService.getHorariosPorLaboratorio(req.query, req.user)
    res.status(200).json(payload)
  } catch (error) {
    next(error)
  }
}

/**
 * Patrón: router → controller → service → model.
 * El controlador solo delega en el servicio y pasa errores con next(error).
 */

/**
 * GET /api/reportes/requerido-vs-consumido
 */
export const getRequeridoVsConsumido = async (req, res, next) => {
  try {
    const params = req.query
    const payload = await reporteService.getRequeridoVsConsumido(params, req.user)
    res.status(200).json(payload)
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/reportes/stock-vs-requerido
 */
export const getStockVsRequerido = async (req, res, next) => {
  try {
    const params = req.query
    const payload = await reporteService.getStockVsRequerido(params, req.user)
    res.status(200).json(payload)
  } catch (error) {
    next(error)
  }
}
