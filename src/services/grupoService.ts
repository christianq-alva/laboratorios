import { api } from './api'
import type { ApiDataResponse, ApiMessageResponse, ApiCreateUpdateResponse } from './types'

export interface Grupo {
  id: number
  nombre: string
  escuela_id: number
  ciclo_id: number
  escuela?: string
  ciclo?: string
}

export interface CreateGrupoData {
  nombre: string
  escuela_id: number
  ciclo_id: number
}

export const grupoService = {
  // Obtener todos los grupos (con filtros opcionales)
  getAll: async (escuela_id?: number, ciclo_id?: number): Promise<ApiDataResponse<Grupo[]>> => {
    const params = new URLSearchParams()
    if (escuela_id) params.append('escuela_id', escuela_id.toString())
    if (ciclo_id) params.append('ciclo_id', ciclo_id.toString())
    
    const queryString = params.toString()
    const url = queryString ? `/grupos?${queryString}` : '/grupos'
    const response = await api.get(url)
    return response.data
  },

  // Obtener un grupo por ID
  getById: async (id: number): Promise<ApiDataResponse<Grupo>> => {
    const response = await api.get(`/grupos/${id}`)
    return response.data
  },

  // Crear nuevo grupo
  create: async (data: CreateGrupoData): Promise<ApiCreateUpdateResponse<Grupo>> => {
    const response = await api.post('/grupos', data)
    return response.data
  },

  // Actualizar grupo
  update: async (id: number, data: CreateGrupoData): Promise<ApiCreateUpdateResponse<Grupo>> => {
    const response = await api.put(`/grupos/${id}`, data)
    return response.data
  },

  // Eliminar grupo
  delete: async (id: number): Promise<ApiMessageResponse> => {
    const response = await api.delete(`/grupos/${id}`)
    return response.data
  }
}

