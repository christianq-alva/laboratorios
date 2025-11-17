import axios, { AxiosError } from 'axios'
import { config } from '../config/environment'

// 🏗️ CREAR INSTANCIA BASE DE AXIOS
export const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interfaz para errores enriquecidos
export interface ApiError extends AxiosError {
  isUnauthorized?: boolean
  isNetworkError?: boolean
  isValidationError?: boolean
  isServerError?: boolean
  isRateLimited?: boolean
  retryAfter?: number
  validationErrors?: Record<string, string[]>
}

// 🎫 INTERCEPTOR: Agregar token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 🚨 INTERCEPTOR: Enriquecer errores con flags útiles
api.interceptors.response.use(
  // ✅ Respuesta exitosa (status 200-299)
  (response) => response,

  // ❌ Error HTTP (status 400-599) o error de red
  (error: AxiosError) => {
    const apiError = error as ApiError
    const errorData = error.response?.data as any
    // Logging
    console.error('🚨 Error en API:', {
      status: error.response?.status,
      message: errorData?.message,
      endpoint: `${error.config?.method?.toUpperCase()} ${error.config?.url}`,
      timestamp: new Date().toISOString(),
      errors: errorData?.errors
    })

    // Enriquecer error con flags útiles
    if (error.response) {
      // Error del backend (status 400-599)
      const status = error.response.status

      apiError.isUnauthorized = status === 401
      apiError.isNetworkError = false
      apiError.isValidationError = status === 400 || status === 422
      apiError.isServerError = status >= 500
      apiError.isRateLimited = status === 429

      // Extraer retryAfter si es rate limit
      if (status === 429) {
        const retryAfterHeader = error.response.headers['retry-after']
        const retryAfterData = errorData?.retryAfter
        apiError.retryAfter = retryAfterHeader 
          ? parseInt(retryAfterHeader, 10) 
          : retryAfterData || 900
        
        console.warn('🚫 Rate limit alcanzado. Reintentar después de:', apiError.retryAfter, 'segundos')
      }

      // Extraer errores de validación si existen
      if (apiError.isValidationError && error.response.data) {
        const data = error.response.data as any
        if (data.errors) {
          apiError.validationErrors = data.errors
        }
      }

      // Agregar mensaje al error si existe
      if (errorData?.message) {
        (apiError as any).message = errorData.message
      }
    } else if (error.request) {
      // Error de red (sin respuesta del servidor)
      apiError.isUnauthorized = false
      apiError.isNetworkError = true
      apiError.isValidationError = false
      apiError.isServerError = false
    } else {
      // Error inesperado (configuración, timeout, etc.)
      apiError.isUnauthorized = false
      apiError.isNetworkError = false
      apiError.isValidationError = false
      apiError.isServerError = false
    }

    // Rechazar con error enriquecido
    return Promise.reject(apiError)
  }
)
