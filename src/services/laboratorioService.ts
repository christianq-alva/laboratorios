import { api } from './api'
import type {   ApiMessageResponse, ApiCreateUpdateResponse, ApiDataResponse } from './types'

export interface Laboratorio {
  id: number
  codigo: string
  nombre: string
  ubicacion: string
  escuela_id: number
  piso: string
  estado: 'Activo' | 'En Mantenimiento' | 'Inhabilitado' | 'Baja'
  escuela?: string // Para mostrar el nombre de la escuela
}

export interface CreateLaboratorioData {
  codigo: string
  nombre: string
  ubicacion: string
  escuela_id: number
  piso: string
  estado: 'Activo' | 'En Mantenimiento' | 'Inhabilitado' | 'Baja'
}

export interface UpdateLaboratorioData extends CreateLaboratorioData {}

export interface Escuela {
  id: number
  nombre: string
}

export const laboratorioService = {
  // Obtener todos los laboratorios
  getAll: async (): Promise<ApiDataResponse<Laboratorio[]>> => {
    const response = await api.get('/laboratorios')
    return response.data
  },

  // Crear nuevo laboratorio
  create: async (data: CreateLaboratorioData): Promise<ApiCreateUpdateResponse<Laboratorio>> => {
    const response = await api.post('/laboratorios', data)
    return response.data
  },

  // Actualizar laboratorio
  update: async (id: number, data: UpdateLaboratorioData): Promise<ApiCreateUpdateResponse<Laboratorio>> => {
    const response = await api.put(`/laboratorios/${id}`, data)
    return response.data
  },

  // Eliminar laboratorio
  delete: async (id: number): Promise<ApiMessageResponse> => {
    const response = await api.delete(`/laboratorios/${id}`)
    return response.data
  },

  // Cambiar estado de un laboratorio
  changeStatus: async (id: number, estado: 'Activo' | 'En Mantenimiento' | 'Inhabilitado' | 'Baja'): Promise<ApiMessageResponse> => {
    const response = await api.patch(`/laboratorios/${id}/estado`, { estado })
    return response.data
  }
} 