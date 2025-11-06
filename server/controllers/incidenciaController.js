import { pool } from '../config/database.js'
import { Horario } from '../models/Horario.js'
import { Incidencia } from '../models/Incidencia.js'
export const getIncidencias = async (req, res) => {
  try {
    const incidencias = await Incidencia.getByUser(req.user)
    res.status(200).json({
      data: incidencias,
      total: incidencias.length
    })
  } catch (error) {
    res.status(500).json({
      message: error.message
    })
  }
}
export const getIncidencia = async (req, res) => {
  try {
    const { id } = req.params
    const incidencia = await Incidencia.getById(id, req.user)
    if (!incidencia) {
      return res.status(404).json({
        message: 'Incidencia no encontrada o sin permisos para verla'
      })
    }
    res.status(200).json({
      data: incidencia
    })
  } catch (error) {
    res.status(500).json({
      message: error.message
    })
  }
}
export const createIncidencia = async (req, res) => {
  try {
    const { reserva_id, titulo, descripcion } = req.body
    // Verificar que puede crear incidencia para esta reserva
    const canCreate = await Incidencia.canCreateForReserva(reserva_id, req.user)
    if (!canCreate) {
      return res.status(403).json({
        message: 'No puedes crear incidencias para esta reserva'
      })
    }
    // Crear la incidencia
    const incidencia_id = await Incidencia.create(
      { reserva_id, titulo, descripcion },
      req.user.userId
    )
    res.status(201).json({
      message: 'Incidencia creada correctamente',
      incidencia_id: incidencia_id
    })
  } catch (error) {
    res.status(500).json({
      message: error.message
    })
  }
}
// Obtener horarios disponibles para reportar incidencias
export const getHorariosParaIncidencias = async (req, res) => {
  try {
    const horarios = await Horario.getHorarioLastMonth(req.user.rol, req.user.laboratorio_ids)
    res.status(200).json({
      data: horarios
    })
  } catch (error) {
    res.status(500).json({
      message: error.message
    })
  }
}