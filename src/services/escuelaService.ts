import { api } from './api'

export interface Escuela {
  id: number
  nombre: string
}

export interface CreateEscuelaData {
  nombre: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export const escuelaService = {
  // Obtener todas las escuelas
  getAll: async (): Promise<ApiResponse<Escuela[]>> => {
    try {
      const response = await api.get('/escuelas')
      return response.data
    } catch (error: any) {
      console.error('Error al obtener escuelas:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener escuelas'
      }
    }
  },

  // Obtener una escuela por ID
  getById: async (id: number): Promise<ApiResponse<Escuela>> => {
    try {
      const response = await api.get(`/escuelas/${id}`)
      return response.data
    } catch (error: any) {
      console.error('Error al obtener escuela:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener escuela'
      }
    }
  },

  // Crear nueva escuela
  create: async (data: CreateEscuelaData): Promise<ApiResponse<Escuela>> => {
    try {
      const response = await api.post('/escuelas', data)
      return response.data
    } catch (error: any) {
      console.error('Error al crear escuela:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Error al crear escuela'
      }
    }
  },

  // Actualizar escuela
  update: async (id: number, data: CreateEscuelaData): Promise<ApiResponse<Escuela>> => {
    try {
      const response = await api.put(`/escuelas/${id}`, data)
      return response.data
    } catch (error: any) {
      console.error('Error al actualizar escuela:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar escuela'
      }
    }
  },

  // Eliminar escuela
  delete: async (id: number): Promise<ApiResponse<void>> => {
    try {
      const response = await api.delete(`/escuelas/${id}`)
      return response.data
    } catch (error: any) {
      console.error('Error al eliminar escuela:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Error al eliminar escuela'
      }
    }
  }
}

