import { defineAbilitiesFor } from '../abilities/defineAbilities.js'
import { AppError } from '../utils/errors.js'
import logger from '../utils/logger.js'

// Middleware de autorización
export const authorize = (action, resource) => {
  return (req, res, next) => {
    try {
      // Verificar si el usuario tiene permisos para el recurso
      const ability = defineAbilitiesFor(req.user)

      const canDo = ability.can(action, resource)

      if (!canDo) {
        return next(new AppError(`No tienes permisos para ${action} ${resource}`, 403))
      }

      //Login temporal para peticiones
      logger.info({ user: req.user.usuario, api: req.originalUrl, action: action, resource: resource, canDo: canDo }, 'authorize')

      // Verificar si el usuario es Jefe de Laboratorio y tiene permisos para el laboratorio
      if (req.user.rol === 'Jefe de Laboratorio') {
        const { laboratorio_id: idBody } = req.body || {}
        const { laboratorio_id: idParams } = req.params || {}
        const { laboratorio_id: idQuery } = req.query || {}

        const laboratorioId = parseInt(idBody || idParams || idQuery)
        const laboratorio_ids = req.user.laboratorio_ids

        if (laboratorioId && !laboratorio_ids.includes(laboratorioId)) {
          return next(new AppError(`No tienes permisos para ${action} ${resource} ${laboratorioId}`, 403))
        }
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}
