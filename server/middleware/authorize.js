import { defineAbilitiesFor } from '../abilities/defineAbilities.js'

// Middleware de autorización
export const authorize = (action, resource) => {
  return (req, res, next) => {
    try {
      console.log('🔍 Verificando:', action, resource, '| Método:', req.method, '| URL:', req.originalUrl)

      // Verificar si el usuario tiene permisos para el recurso
      const ability = defineAbilitiesFor(req.user)

      const canDo = ability.can(action, resource)

      if (!canDo) {
        return res.status(403).json({
          success: false,
          message: `No tienes permisos para ${action} ${resource}`
        })
      }

      // Verificar si el usuario es Jefe de Laboratorio y tiene permisos para el laboratorio
      if (req.user.rol === 'Jefe de Laboratorio') {
        const { laboratorio_id: idBody } = req.body || {}
        const { laboratorio_id: idParams } = req.params || {}
        const { laboratorio_id: idQuery } = req.query || {}

        const laboratorioId = parseInt(idBody || idParams || idQuery)
        const laboratorio_ids = req.user.laboratorio_ids

        if (laboratorioId && !laboratorio_ids.includes(laboratorioId)) {
          return res.status(403).json({
            success: false,
            message: `No tienes permisos para ${action} ${resource} ${laboratorioId}`
          })
        }
      }

      next()
    } catch (error) {
      console.error('💥 Error en authorize:', error)
      console.error('💥 Stack trace:', error.stack) // ← AGREGAR STACK TRACE
      res.status(500).json({
        success: false,
        message: 'Error de autorización'
      })
    }
  }
}
