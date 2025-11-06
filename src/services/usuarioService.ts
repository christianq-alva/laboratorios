import { api } from './api'
import type { ApiMessageResponse, ApiCreateUpdateResponse, ApiDataResponse } from './types'

export interface Usuario {
  id: number
  nombre_completo: string
  usuario: string
  rol_id: number
  rol_nombre: string
  estado: 'A' | 'I' | 'activo' | 'inactivo' // 'A'/'I' desde BD, mapeado a 'activo'/'inactivo' para UI
  laboratorio_ids?: number[]
  laboratorios_nombres?: Array<{ id: number; codigo: string; nombre: string }>
  created_at?: string
  updated_at?: string
}

export interface UsuarioInput {
  nombre_completo: string
  usuario: string
  contrasena?: string
  rol_id: number
  laboratorio_ids?: number[]
}

export interface UsuarioUpdateInput {
  nombre_completo?: string
  usuario?: string
  contrasena?: string
  rol_id?: number
  laboratorio_ids?: number[]
}

export const usuarioService = {
  // Obtener todos los usuarios
  getAll: async (): Promise<ApiDataResponse<Usuario[]>> => {
    const response = await api.get('/usuarios')
    // Mapear estado 'A'/'I' a 'activo'/'inactivo' para la UI
    if (response.data?.data) {
      response.data.data = response.data.data.map((user: Usuario) => ({
        ...user,
        estado: user.estado === 'A' ? 'activo' : user.estado === 'I' ? 'inactivo' : user.estado
      }))
    }
    return response.data
  },

  // Obtener un usuario por ID
  getById: async (id: number): Promise<ApiDataResponse<Usuario>> => {
    const response = await api.get(`/usuarios/${id}`)
    // Mapear estado 'A'/'I' a 'activo'/'inactivo' para la UI
    if (response.data?.data) {
      response.data.data = {
        ...response.data.data,
        estado: response.data.data.estado === 'A' ? 'activo' : response.data.data.estado === 'I' ? 'inactivo' : response.data.data.estado
      }
    }
    return response.data
  },

  // Crear un nuevo usuario
  create: async (data: UsuarioInput): Promise<ApiCreateUpdateResponse<Usuario>> => {
    const response = await api.post('/usuarios', data)
    // Mapear estado 'A'/'I' a 'activo'/'inactivo' para la UI
    if (response.data?.data) {
      response.data.data = {
        ...response.data.data,
        estado: response.data.data.estado === 'A' ? 'activo' : response.data.data.estado === 'I' ? 'inactivo' : response.data.data.estado
      }
    }
    return response.data
  },

  // Actualizar un usuario
  update: async (id: number, data: UsuarioUpdateInput): Promise<ApiCreateUpdateResponse<Usuario>> => {
    const response = await api.put(`/usuarios/${id}`, data)
    // Mapear estado 'A'/'I' a 'activo'/'inactivo' para la UI
    if (response.data?.data) {
      response.data.data = {
        ...response.data.data,
        estado: response.data.data.estado === 'A' ? 'activo' : response.data.data.estado === 'I' ? 'inactivo' : response.data.data.estado
      }
    }
    return response.data
  },

  // Eliminar un usuario
  delete: async (id: number): Promise<ApiMessageResponse> => {
    const response = await api.delete(`/usuarios/${id}`)
    return response.data
  },

  // Cambiar el estado de un usuario
  updateEstado: async (id: number, estado: 'activo' | 'inactivo'): Promise<ApiMessageResponse> => {
    const response = await api.patch(`/usuarios/${id}/estado`, { estado })
    return response.data
  }
}

