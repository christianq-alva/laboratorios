import { api } from './api'
import type { ApiDataResponse, ApiMessageResponse, ApiCreateUpdateResponse } from './types'

/**
 * Material reutilizable: bienes que se usan en varias prácticas sin consumirse
 * (cristalería y afines). No se inventarían uno por uno como los equipos:
 * llevan una cantidad total por laboratorio y un valor unitario para depreciar.
 */
export interface MaterialReutilizable {
  id: number
  codigo: string
  nombre: string
  descripcion?: string | null
  laboratorio_id: number
  laboratorio_nombre?: string | null
  cantidad_total: number
  valor_unitario?: number | string | null
  depreciacion_categoria_id?: number | null
  depreciacion_categoria_nombre?: string | null
  depreciacion_porcentaje?: number | string | null
  activo: number | boolean
  created_at?: string
  updated_at?: string
}

export interface MaterialReutilizableInput {
  codigo: string
  nombre: string
  descripcion?: string | null
  laboratorio_id: number
  cantidad_total: number
  valor_unitario?: number | null
  depreciacion_categoria_id?: number | null
  activo: boolean
}

export interface MaterialesFilters {
  laboratorio_id?: number
  depreciacion_categoria_id?: number
  activo?: boolean
}

export const materialReutilizableService = {
  // Listar materiales (filtrado por rol en el backend)
  getAll: async (filters: MaterialesFilters = {}): Promise<ApiDataResponse<MaterialReutilizable[]>> => {
    const params = new URLSearchParams()
    if (filters.laboratorio_id) params.append('laboratorio_id', String(filters.laboratorio_id))
    if (filters.depreciacion_categoria_id) params.append('depreciacion_categoria_id', String(filters.depreciacion_categoria_id))
    if (filters.activo !== undefined) params.append('activo', String(filters.activo))
    const query = params.toString()
    const response = await api.get(`/materiales-reutilizables${query ? `?${query}` : ''}`)
    return response.data
  },

  // Materiales activos de un laboratorio (para armar un horario)
  getByLaboratorio: async (
    laboratorio_id: number,
    incluirInactivos = false
  ): Promise<ApiDataResponse<MaterialReutilizable[]>> => {
    const query = incluirInactivos ? '?incluir_inactivos=true' : ''
    const response = await api.get(`/materiales-reutilizables/laboratorio/${laboratorio_id}${query}`)
    return response.data
  },

  getById: async (id: number): Promise<ApiDataResponse<MaterialReutilizable>> => {
    const response = await api.get(`/materiales-reutilizables/${id}`)
    return response.data
  },

  create: async (data: MaterialReutilizableInput): Promise<ApiCreateUpdateResponse<MaterialReutilizable>> => {
    const response = await api.post('/materiales-reutilizables', data)
    return response.data
  },

  update: async (id: number, data: MaterialReutilizableInput): Promise<ApiCreateUpdateResponse<MaterialReutilizable>> => {
    const response = await api.put(`/materiales-reutilizables/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<ApiMessageResponse> => {
    const response = await api.delete(`/materiales-reutilizables/${id}`)
    return response.data
  }
}
