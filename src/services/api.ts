import axios from 'axios'

// 🏗️ CREAR INSTANCIA BASE DE AXIOS
// Detectar automáticamente si estamos en Railway
const isRailway = window.location.hostname.includes('railway.app')
const API_URL = isRailway 
  ? `${window.location.origin}/api`
  : 'http://localhost:3000/api'

console.log('🌐 API URL:', API_URL)
console.log('🏠 Hostname:', window.location.hostname)
console.log('🚂 Is Railway:', isRailway)

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000, // 15 segundos para dispositivos móviles
  withCredentials: true
})

// 🎫 INTERCEPTOR: Agregar token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Log para debugging en producción
    if (process.env.NODE_ENV === 'development') {
      console.log('🌐 Request:', config.method?.toUpperCase(), config.url)
    }
    
    return config
  },
  (error) => {
    console.error('❌ Request error:', error)
    return Promise.reject(error)
  }
)

// 🚨 INTERCEPTOR: Manejar errores automáticamente  
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('🚨 API Error:', {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url
    })
    
    if (error.response?.status === 401) {
      console.log('❌ Token expirado, limpiando sesión')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Redirigir al login si es necesario
      window.location.href = '/login'
    }
    
    if (error.code === 'ECONNABORTED') {
      console.log('⏰ Timeout - Conexión lenta')
    }
    
    return Promise.reject(error)
  }
)