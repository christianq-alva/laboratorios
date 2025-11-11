/**
 * Tipos base para respuestas de API
 * Todos los servicios deben usar estos tipos para mantener consistencia
 */

/**
 * Respuesta genérica de API con datos opcionales
 * Usar cuando la respuesta puede contener datos o solo un mensaje
 */
export type ApiResponse<T = void> = {
  data: T
  message?: string
}

/**
 * Respuesta de API que siempre incluye datos cuando es exitosa
 * Usar para operaciones GET que siempre retornan datos si son exitosas
 */
export type ApiDataResponse<T> = {
  data: T
  message?: string
  success: boolean //Temporalmente
}

/** 
 * Respuesta de API solo con mensaje (sin datos)
 * Usar para operaciones DELETE o acciones que solo retornan éxito/error
 */
export type ApiMessageResponse = {
  message: string
}

/**
 * Respuesta de API para operaciones CREATE/UPDATE
 * Incluye el recurso creado/actualizado y mensaje
 */
export type ApiCreateUpdateResponse<T> = {
  data?: T
  message: string
}
