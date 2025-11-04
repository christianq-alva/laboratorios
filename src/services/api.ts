import axios from 'axios'
import { config } from '../config/environment'

// 🏗️ CREAR INSTANCIA BASE DE AXIOS
export const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 🎫 INTERCEPTOR: Agregar token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 🚨 INTERCEPTOR: Normalizar errores automáticamente
api.interceptors.response.use(
  // ✅ Respuesta exitosa (status 200-299)
  (response) => {
    // Retornar la respuesta tal cual (el backend ya tiene { success, message, data })
    return response
  },
  
  // ❌ Error HTTP (status 400-599) o error de red
  (error) => {
    // Logging mejorado
    console.error('🚨 Error en API:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      url: error.config?.url,
      method: error.config?.method,
      timestamp: new Date().toISOString(),
      hasResponse: !!error.response,
      hasRequest: !!error.request
    })
    
    // Manejar 401 (token expirado o no autorizado)
    if (error.response?.status === 401) {
      console.log('❌ Token expirado o no autorizado, limpiando sesión')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      // Redirigir al login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    
    // ✅ NORMALIZAR ERROR: Convertir a estructura consistente
    if (error.response) {
      // Error del backend (status 400-599)
      // El backend ya envía { success: false, message: "..." }
      return Promise.resolve({
        data: error.response.data || {
          success: false,
          message: 'Error del servidor'
        }
      })
    } else if (error.request) {
      // Error de red (sin respuesta del servidor)
      // Esto significa falta de conexión al servidor
      console.error('❌ Error de conexión: No se pudo conectar al servidor')
      
      // Limpiar sesión si hay token (por seguridad)
      const token = localStorage.getItem('token')
      if (token) {
        console.log('⚠️ Limpiando sesión por falta de conexión')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
      
      // Redirigir al login por falta de conexión
      if (window.location.pathname !== '/login') {
        console.log('🔄 Redirigiendo al login por falta de conexión')
        window.location.href = '/login'
      }
      
      return Promise.resolve({
        data: {
          success: false,
          message: 'Error de conexión. No se pudo conectar al servidor. Por favor, verifica tu conexión a internet.'
        }
      })
    } else {
      // Error inesperado (configuración, timeout, etc.)
      console.error('❌ Error inesperado:', error.message)
      
      return Promise.resolve({
        data: {
          success: false,
          message: 'Error inesperado. Por favor, intenta nuevamente.'
        }
      })
    }
  }
)