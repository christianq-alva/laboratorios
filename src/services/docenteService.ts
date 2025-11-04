import { api } from './api'
import type { ApiMessageResponse, ApiCreateUpdateResponse, ApiDataResponse } from './types'

export interface Docente {
  id: number
  nombre: string
  correo?: string | null
  escuela_id: number
  escuela?: string
}

export interface DocenteData {
  nombre: string
  correo?: string
  escuela_id: number
}

export const docenteService = {
  // Obtener todos los docentes
  getAll: async (): Promise<ApiDataResponse<Docente[]>> => {
    const response = await api.get('/docentes')
    return response.data
  },

  // Obtener docente por ID
  getById: async (id: number): Promise<ApiDataResponse<Docente>> => {
    const response = await api.get(`/docentes/${id}`)
    return response.data
  },

  // Crear nuevo docente
  create: async (data: DocenteData): Promise<ApiCreateUpdateResponse<Docente>> => {
    const response = await api.post('/docentes', data)
    return response.data
  },

  // Actualizar docente
  update: async (id: number, data: DocenteData): Promise<ApiCreateUpdateResponse<Docente>> => {
    const response = await api.put(`/docentes/${id}`, data)
    return response.data
  },

  // Eliminar docente
  delete: async (id: number): Promise<ApiMessageResponse> => {
    const response = await api.delete(`/docentes/${id}`)
    return response.data
  }
} 