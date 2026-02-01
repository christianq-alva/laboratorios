/**
 * Clase de error con statusCode para respuestas HTTP.
 * Uso: throw new AppError('Mensaje', 404)
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message)
    this.statusCode = statusCode
    this.name = 'AppError'
    Error.captureStackTrace?.(this, this.constructor)
  }
}

