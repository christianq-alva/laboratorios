import axios from 'axios'

// 🏗️ CREAR INSTANCIA BASE DE AXIOS
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000, // Timeout de 15 segundos para dispositivos móviles
  withCredentials: true
})

// 🎫 INTERCEPTOR: Agregar token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('🎫 Token agregado automáticamente')
    }
    
    // Log para debugging en dispositivos móviles
    console.log('🌐 Request URL:', (config.baseURL || '') + (config.url || ''))
    console.log('📱 User Agent:', navigator.userAgent)
    
    return config
  },
  (error) => {
    console.error('❌ Error en request:', error)
    return Promise.reject(error)
  }
)

// 🚨 INTERCEPTOR: Manejar errores automáticamente  
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('🚨 Error de API:', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      message: error.message
    })
    
    if (error.response?.status === 401) {
      console.log('❌ Token expirado, limpiando sesión')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    
    if (error.code === 'ECONNABORTED') {
      console.log('⏰ Timeout - Conexión lenta en dispositivo móvil')
    }
    
    if (error.code === 'ERR_NETWORK') {
      console.log('🌐 Error de red - Verificar conectividad')
    }
    
    return Promise.reject(error)
  }
)