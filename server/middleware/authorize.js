import { defineAbilitiesFor } from '../abilities/defineAbilities.js'

// 🛡️ MIDDLEWARE GENÉRICO DE AUTORIZACIÓN
export const authorize = (action, resource) => {
    return (req, res, next) => {
      try {
        console.log('🔍 req.user en authorize:', req.user)
        console.log('🔍 Verificando:', action, resource)
        
        const ability = defineAbilitiesFor(req.user)
        console.log('🔍 Ability creado exitosamente')
        
        const canDo = ability.can(action, resource)
        console.log('🔍 ability.can resultado:', canDo)
        
        if (canDo) {
          console.log(`✅ ${req.user.usuario} puede ${action} ${resource}`)
          next()
        } else {
          console.log(`❌ ${req.user.usuario} NO puede ${action} ${resource}`)
          res.status(403).json({ 
            success: false, 
            message: `No tienes permisos para ${action} ${resource}` 
          })
        }
      } catch (error) {
        console.error('💥 Error en authorize:', error)
        console.error('💥 Stack trace:', error.stack) // ← AGREGAR STACK TRACE
        res.status(500).json({ success: false, message: 'Error de autorización' })
      }
    }
  }

// 🎯 MIDDLEWARE ESPECÍFICO PARA RECURSOS CON CONDICIONES
export const authorizeResource = (action, resource) => {
    return (req, res, next) => {
      try {
        console.log('🔍 authorizeResource - req.user:', req.user)
        console.log('🔍 authorizeResource - action:', action, 'resource:', resource)
        console.log('🔍 authorizeResource - req.body:', req.body)
        console.log('🔍 authorizeResource - req.params:', req.params)
        
        const ability = defineAbilitiesFor(req.user)
        
        // Para las verificaciones con condiciones, necesitamos estructurar mejor los datos
        let resourceToCheck = resource
        
        // Si es un recurso específico (con :id), intentamos verificar con condiciones
        if (req.params.id) {
          const resourceId = parseInt(req.params.id)
          console.log('🔍 Verificando recurso específico con ID:', resourceId)
          
          // Crear objeto para verificación de condiciones
          const subjectForConditions = {
            id: resourceId,
            laboratorio_id: req.body?.laboratorio_id || resourceId,
            ...req.body
          }
          
          console.log('🔍 Subject para condiciones:', subjectForConditions)
          
          // Verificar sin el tercer parámetro problemático
          const canDo = ability.can(action, resource)
          console.log('🔍 ability.can resultado (sin condiciones):', canDo)
          
          // Si puede hacer la acción generalmente, permitir
          if (canDo) {
            return next()
          }
          
          // Si no, verificar condiciones específicas de laboratorio
          if (req.user.rol === 'Jefe de Laboratorio' && req.user.laboratorio_ids) {
            const hasAccess = req.user.laboratorio_ids.includes(resourceId) || 
                             req.user.laboratorio_ids.includes(subjectForConditions.laboratorio_id)
            
            if (hasAccess) {
              console.log(`✅ ${req.user.usuario} tiene acceso por laboratorio_ids`)
              return next()
            }
          }
        } else {
          // Verificación simple sin condiciones
          const canDo = ability.can(action, resource)
          if (canDo) {
            return next()
          }
        }
        
        // Si llegamos aquí, no tiene permisos
        console.log(`❌ ${req.user.usuario} NO puede ${action} este ${resource}`)
        res.status(403).json({ 
          success: false, 
          message: `No tienes permisos para ${action} este ${resource}` 
        })
      } catch (error) {
        console.error('💥 Error en authorizeResource:', error)
        console.error('💥 Stack trace:', error.stack)
        res.status(500).json({ success: false, message: 'Error de autorización' })
      }
    }
  }