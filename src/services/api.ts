import axios from 'axios'

// 🏗️ CREAR INSTANCIA BASE DE AXIOS
// Detectar automáticamente si estamos en Railway
const isRailway = window.location.hostname.includes('railway.app')
const API_URL = isRailway 
  ? `https://${window.location.hostname.replace('laboratorios-frontend', 'laboratorios')}/api`
  : 'http://localhost:3000/api'

console.log('🌐 API URL:', API_URL)
console.log('🏠 Hostname:', window.location.hostname)
console.log('🚂 Is Railway:', isRailway)

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 segundos de timeout
})

// 🎫 INTERCEPTOR: Agregar token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('🎫 Token agregado automáticamente')
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 🚨 INTERCEPTOR: Manejar errores automáticamente  
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('🚨 Error de API:', {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url
    })
    
    if (error.response?.status === 401) {
      console.log('❌ Token expirado, limpiando sesión')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    return Promise.reject(error)
  }
)