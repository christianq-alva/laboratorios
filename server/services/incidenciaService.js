import { Incidencia } from '../models/Incidencia.js'
import { Horario } from '../models/Horario.js'
import { AppError } from '../utils/errors.js'

function canVerIncidencia(incidencia, user) {
  if (user.rol === 'Administrador') return true
  if (user.rol === 'Jefe de Laboratorio') {
    const labIds = user.laboratorio_ids || []
    return labIds.includes(incidencia.laboratorio_id)
  }
  return false
}

function puedeCrearParaReserva(laboratorio_id, user) {
  if (user.rol === 'Administrador') return true
  if (user.rol === 'Jefe de Laboratorio') {
    const labIds = user.laboratorio_ids || []
    return labIds.includes(laboratorio_id)
  }
  return false
}

export const incidenciaService = {

  async getByUser(user) {
    const laboratorio_ids = user.rol === 'Administrador'
      ? null
      : (user.laboratorio_ids || [])
    return await Incidencia.getByUser({ laboratorio_ids })
  },

  async getById(id, user) {
    const incidencia = await Incidencia.getById(id)
    if (!incidencia) {
      throw new AppError('Incidencia no encontrada', 404)
    }
    if (!canVerIncidencia(incidencia, user)) {
      throw new AppError('No tienes permisos para ver esta incidencia', 403)
    }
    return incidencia
  },

  async getHorariosParaIncidencias(user) {
    return await Horario.getHorarioLastMonth(user.rol, user.laboratorio_ids)
  },

  async crearIncidencia(reserva_id, titulo, descripcion, user) {
    const reserva = await Incidencia.getReservaById(reserva_id)
    if (!reserva) {
      throw new AppError('Reserva no encontrada', 404)
    }
    if (!puedeCrearParaReserva(reserva.laboratorio_id, user)) {
      throw new AppError('No puedes crear incidencias para esta reserva', 403)
    }
    const incidencia_id = await Incidencia.create(
      { reserva_id, titulo, descripcion },
      user.userId
    )
    return incidencia_id
  },

  async eliminarIncidencia(incidenciaId, user) {
    const incidencia = await Incidencia.getById(incidenciaId)
    if (!incidencia) {
      throw new AppError('Incidencia no encontrada', 404)
    }
    if (!canVerIncidencia(incidencia, user)) {
      throw new AppError('No tienes permisos para eliminar esta incidencia', 403)
    }
    const deleted = await Incidencia.delete(incidenciaId)
    if (!deleted) {
      throw new AppError('No se pudo eliminar la incidencia', 404)
    }
  }
}
