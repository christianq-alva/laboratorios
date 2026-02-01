import { Horario } from '../models/Horario.js'
import { Incidencia } from '../models/Incidencia.js'
import { incidenciaService } from '../services/incidenciaService.js'
export const getIncidencias = async (req, res, next) => {
  try {
    const incidencias = await Incidencia.getByUser(req.user)
    res.status(200).json({
      data: incidencias,
      total: incidencias.length
    })
  } catch (error) {
    next(error)
  }
}
export const getIncidencia = async (req, res, next) => {
  try {
    const { id } = req.params
    const incidencia = await Incidencia.getById(id, req.user)
    if (!incidencia) {
      return res.status(404).json({
        success: false,
        message: 'Incidencia no encontrada o sin permisos para verla'
      })
    }
    res.status(200).json({
      data: incidencia
    })
  } catch (error) {
    next(error)
  }
}
export const createIncidencia = async (req, res, next) => {
  try {
    const { reserva_id, titulo, descripcion } = req.body
    const incidencia_id = await incidenciaService.crearIncidencia(reserva_id, titulo, descripcion, req.user)
    res.status(201).json({
      success: true,
      message: 'Incidencia creada correctamente',
      incidencia_id
    })
  } catch (error) {
    next(error)
  }
}
// Obtener horarios disponibles para reportar incidencias
export const getHorariosParaIncidencias = async (req, res, next) => {
  try {
    const horarios = await Horario.getHorarioLastMonth(req.user.rol, req.user.laboratorio_ids)
    res.status(200).json({
      data: horarios
    })
  } catch (error) {
    next(error)
  }
}

// Eliminar incidencia
export const deleteIncidencia = async (req, res, next) => {
  try {
    const { id } = req.params
    await incidenciaService.eliminarIncidencia(id, req.user)
    res.status(200).json({
      success: true,
      message: 'Incidencia eliminada exitosamente'
    })
  } catch (error) {
    next(error)
  }
}