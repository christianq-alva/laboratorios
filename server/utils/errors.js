/**
 * Clase de error con statusCode para respuestas HTTP.
 * Soporta encadenado de errores con options.cause (estándar ES2022/Node 16.9+).
 *
 * @example throw new AppError('Mensaje', 404)
 * @example throw new AppError('Error de base de datos', 500, { cause: errorOriginal })
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, options = {}) {
    super(message, options.cause != null ? { cause: options.cause } : undefined)
    this.statusCode = statusCode
    this.name = 'AppError'
    if (options.cause != null) this.cause = options.cause
    Error.captureStackTrace?.(this, this.constructor)
  }
}

