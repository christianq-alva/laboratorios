import { Incidencia } from '../models/Incidencia.js'
import { AppError } from '../utils/errors.js'

export const incidenciaService = {

  async crearIncidencia(reserva_id, titulo, descripcion, user) {
    const canCreate = await Incidencia.canCreateForReserva(reserva_id, user)
    if (!canCreate) {
      throw new AppError('No puedes crear incidencias para esta reserva', 403)
    }
    const incidencia_id = await Incidencia.create(
      { reserva_id, titulo, descripcion },
      user.userId
    )
    return incidencia_id
  },

  async eliminarIncidencia(incidenciaId, user) {
    const incidencia = await Incidencia.getById(incidenciaId, user)
    if (!incidencia) {
      throw new AppError('Incidencia no encontrada o no tienes permisos para eliminarla', 404)
    }
    const deleted = await Incidencia.delete(incidenciaId)
    if (!deleted) {
      throw new AppError('No se pudo eliminar la incidencia', 404)
    }
  }
}
