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
    if (error.response?.status === 401) {
      console.log('❌ Token expirado, limpiando sesión')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Podrías redirigir al login aquí
    }
    return Promise.reject(error)
  }
)