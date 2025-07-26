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
        const resourceObject = req.body || req.params
        
        console.log('🔍 resourceObject para verificar:', resourceObject)
        
        const canDo = ability.can(action, resource, resourceObject)
        console.log('🔍 ability.can con condiciones resultado:', canDo)
        
        if (canDo) {
          console.log(`✅ ${req.user.usuario} puede ${action} ${resource} específico`)
          next()
        } else {
          console.log(`❌ ${req.user.usuario} NO puede ${action} este ${resource}`)
          res.status(403).json({ 
            success: false, 
            message: `No tienes permisos para ${action} este ${resource}` 
          })
        }
      } catch (error) {
        console.error('💥 Error en authorizeResource:', error)
        console.error('💥 Stack trace:', error.stack)
        res.status(500).json({ success: false, message: 'Error de autorización' })
      }
    }
  }