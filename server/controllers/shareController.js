import * as shareService from '../services/shareService.js'

/**
 * Patrón complejo: router → controller → service → model.
 * El controlador solo delega en el servicio y pasa errores con next(error).
 */

export const createShareLink = async (req, res, next) => {
  try {
    const { laboratorio_id, expires_in_days = 365 } = req.body
    const userId = req.user.userId

    const { shareLink, laboratorio } = await shareService.createShareLink(
      laboratorio_id,
      userId,
      expires_in_days
    )

    res.status(201).json({
      message: 'Enlace compartible creado exitosamente',
      data: {
        id: shareLink.id,
        laboratorio_id: parseInt(laboratorio_id),
        laboratorio_nombre: shareLink.laboratorio_nombre,
        laboratorio_ubicacion: shareLink.laboratorio_ubicacion,
        token: shareLink.token,
        url: shareLink.url,
        fecha_expiracion: shareLink.fecha_expiracion,
        activo: shareLink.activo
      }
    })
  } catch (error) {
    next(error)
  }
}

export const getPublicHorarios = async (req, res, next) => {
  try {
    const { laboratorio_id } = req.params
    const { token } = req.query

    const payload = await shareService.getPublicHorarios(laboratorio_id, token)

    res.status(200).json({
      data: payload
    })
  } catch (error) {
    next(error)
  }
}

export const getUserShareLinks = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const userRole = req.user.rol
    const laboratorioIds = req.user.laboratorio_ids || []

    const enlaces = await shareService.getUserShareLinks(userId, userRole, laboratorioIds)

    res.status(200).json({
      data: enlaces
    })
  } catch (error) {
    next(error)
  }
}

export const deactivateShareLink = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const link = await shareService.deactivateShareLink(id, userId)

    res.status(200).json({
      message: `Enlace para ${link.laboratorio_nombre} desactivado`
    })
  } catch (error) {
    next(error)
  }
}

export const deleteShareLink = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const link = await shareService.deleteShareLink(id, userId)

    res.status(200).json({
      message: `Enlace para ${link.laboratorio_nombre} eliminado correctamente`
    })
  } catch (error) {
    next(error)
  }
}
