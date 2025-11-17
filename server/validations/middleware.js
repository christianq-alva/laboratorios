import { z } from 'zod'

/**
 * Middleware de validación genérico para Express
 * Valida req.body, req.params, req.query según el schema proporcionado
 * 
 * @param {z.ZodSchema} schema - Schema de Zod que puede validar body, params, query
 * @returns {Function} Middleware de Express
 */
export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      // Validar cada parte del request según el schema
      const validationResult = await schema.safeParseAsync({
        body: req.body,
        params: req.params,
        query: req.query
      })

      if (!validationResult.success) {
        // En Zod v4, los errores están en la propiedad 'issues'
        const issues = validationResult.error.issues

        if (!issues || !Array.isArray(issues)) {
          console.error('[Validation] Error: No se pudo extraer array de errores de ZodError')
          return res.status(500).json({
            success: false,
            message: 'Error en el formato de validación'
          })
        }

        // Formatear errores de Zod de manera legible
        const errors = issues.map(err => ({
          field: err.path ? err.path.join('.') : 'unknown',
          message: err.message || 'Error de validación',
          code: err.code || 'unknown'
        }))

        return res.status(400).json({
          success: false,
          message: 'Error de validación',
          errors: errors
        })
      }

      // Actualizar solo las propiedades validadas en params, preservando el resto
      if (validationResult.data.params) {
        Object.keys(validationResult.data.params).forEach(key => {
          req.params[key] = validationResult.data.params[key]
        })
      }
      
      // Reemplazar los datos originales con los datos validados y transformados
      if (validationResult.data.body) {
        req.body = validationResult.data.body
      }
      
      if (validationResult.data.query) {
        Object.keys(validationResult.data.query).forEach(key => {
          req.query[key] = validationResult.data.query[key]
        })
      }

      next()
    } catch (error) {
      console.error('[Validation] Excepción inesperada:', {
        message: error.message,
        name: error.name
      })
      return res.status(500).json({
        success: false,
        message: 'Error interno en la validación'
      })
    }
  }
}

/**
 * Middleware para validar solo el body
 * @param {z.ZodSchema} schema - Schema para validar el body
 * @returns {Function} Middleware de Express
 */
export const validateBody = (schema) => {
  return validate(z.object({ body: schema }))
}

/**
 * Middleware para validar solo los params
 * @param {z.ZodSchema} schema - Schema para validar los params
 * @returns {Function} Middleware de Express
 */
export const validateParams = (schema) => {
  return validate(z.object({ params: schema }))
}

/**
 * Middleware para validar solo el query
 * @param {z.ZodSchema} schema - Schema para validar el query
 * @returns {Function} Middleware de Express
 */
export const validateQuery = (schema) => {
  return validate(z.object({ query: schema }))
}

