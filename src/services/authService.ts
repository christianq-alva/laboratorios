import { api } from './api'

export interface LoginRequest {
  usuario: string
  contrasena: string
}

export interface LoginResponse {
  success: boolean
  user?: {
    id: number
    nombre: string
    usuario: string
    rol: string
    laboratorio_ids?: number[]
  }
  permisos?: any[]
  message?: string
  token?: string
}

export interface User {
  id: number
  nombre: string
  usuario: string
  rol: string
  laboratorio_ids?: number[]
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  getProfile: async (): Promise<{ success: boolean; user?: User; message?: string }> => {
    const response = await api.get('/auth/profile')
    return response.data
  }
}