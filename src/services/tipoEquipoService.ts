import { api } from './api'
import type { ApiResponse, ApiMessageResponse, ApiCreateUpdateResponse } from './types'

export interface TipoEquipo {
  id: number
  nombre: string
  descripcion?: string
  created_at?: string
  count_equipos?: number
}

export interface TipoEquipoInput {
  nombre: string
  descripcion?: string
}

export const tipoEquipoService = {
  // Obtener todos los tipos de equipo
  getAll: async (): Promise<ApiResponse<TipoEquipo[]>> => {
    const response = await api.get('/tipos-equipo')
    return response.data
  },

  // Obtener solo tipos activos
  getActivos: async (): Promise<ApiResponse<TipoEquipo[]>> => {
    const response = await api.get('/tipos-equipo/activos')
    return response.data
  },

  // Obtener un tipo por ID
  getById: async (id: number): Promise<ApiResponse<TipoEquipo>> => {
    const response = await api.get(`/tipos-equipo/${id}`)
    return response.data
  },

  // Crear un nuevo tipo
  create: async (data: TipoEquipoInput): Promise<ApiCreateUpdateResponse<TipoEquipo>> => {
    const response = await api.post('/tipos-equipo', data)
    return response.data
  },

  // Actualizar un tipo
  update: async (id: number, data: TipoEquipoInput): Promise<ApiCreateUpdateResponse<TipoEquipo>> => {
    const response = await api.put(`/tipos-equipo/${id}`, data)
    return response.data
  },

  // Eliminar un tipo
  delete: async (id: number): Promise<ApiMessageResponse> => {
    const response = await api.delete(`/tipos-equipo/${id}`)
    return response.data
  },

  // Contar equipos por tipo
  getAllWithCountEquipos: async (): Promise<ApiResponse<TipoEquipo[]>> => {
    const response = await api.get('/tipos-equipo/with-count-equipos')
    return response.data
  }
}

