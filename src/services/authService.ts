import { api } from './api'

export interface LoginData {
  usuario: string
  contrasena: string
}

export interface User {
  id: number
  nombre: string
  usuario: string
  rol: string
  laboratorio_ids?: number[]  // ← AGREGAR: Array de IDs de laboratorios asignados
}

export interface LoginResponse {
  success: boolean
  user?: User
  permisos?: Array<{nombre: string, ruta: string}>
  token?: string
  message?: string
}

export interface Laboratorio {
  id: number
  nombre: string
  ubicacion: string
}

export const authService = {
  // 🚀 SÚPER SIMPLE: Solo la lógica, sin configuración
  login: async (data: LoginData): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', data)
    return response.data  // Axios envuelve la respuesta en .data
  },

  // 🔒 RUTA PROTEGIDA: El token se agrega automáticamente
  getProfile: async () => {
    const response = await api.get('/auth/profile')
    return response.data
  },

  // 🏢 OBTENER LABORATORIOS ASIGNADOS AL USUARIO
  getLaboratorios: async (): Promise<{success: boolean, data: Laboratorio[]}> => {
    const response = await api.get('/laboratorios')
    return response.data
  }
}