import { api } from './api'
import type { ApiResponse, ApiMessageResponse, ApiCreateUpdateResponse } from './types'

export interface Unidad {
  id: number
  simbolo: string
  nombre: string
  descripcion?: string
}

export interface UnidadInput {
  simbolo: string
  nombre: string
  descripcion?: string
}

export const unidadService = {
  // Obtener todas las unidades
  getAll: async (): Promise<ApiResponse<Unidad[]>> => {
    const response = await api.get('/unidades')
    return response.data
  },

  // Obtener una unidad por ID
  getById: async (id: number): Promise<ApiResponse<Unidad>> => {
    const response = await api.get(`/unidades/${id}`)
    return response.data
  },

  // Crear una nueva unidad
  create: async (data: UnidadInput): Promise<ApiCreateUpdateResponse<Unidad>> => {
    const response = await api.post('/unidades', data)
    return response.data
  },

  // Actualizar una unidad
  update: async (id: number, data: UnidadInput): Promise<ApiCreateUpdateResponse<Unidad>> => {
    const response = await api.put(`/unidades/${id}`, data)
    return response.data
  },

  // Eliminar una unidad
  delete: async (id: number): Promise<ApiMessageResponse> => {
    const response = await api.delete(`/unidades/${id}`)
    return response.data
  }
}

