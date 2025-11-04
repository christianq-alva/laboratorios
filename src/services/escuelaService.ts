import { api } from './api'
import type { ApiResponse, ApiMessageResponse, ApiCreateUpdateResponse } from './types'

export interface Escuela {
  id: number
  nombre: string
}

export interface CreateEscuelaData {
  nombre: string
}

export const escuelaService = {
  // Obtener todas las escuelas
  getAll: async (): Promise<ApiResponse<Escuela[]>> => {
    const response = await api.get('/escuelas')
    return response.data
  },

  // Obtener una escuela por ID
  getById: async (id: number): Promise<ApiResponse<Escuela>> => {
    const response = await api.get(`/escuelas/${id}`)
    return response.data
  },

  // Crear nueva escuela
  create: async (data: CreateEscuelaData): Promise<ApiCreateUpdateResponse<Escuela>> => {
    const response = await api.post('/escuelas', data)
    return response.data
  },

  // Actualizar escuela
  update: async (id: number, data: CreateEscuelaData): Promise<ApiCreateUpdateResponse<Escuela>> => {
    const response = await api.put(`/escuelas/${id}`, data)
    return response.data
  },

  // Eliminar escuela
  delete: async (id: number): Promise<ApiMessageResponse> => {
    const response = await api.delete(`/escuelas/${id}`)
    return response.data
  }
}

