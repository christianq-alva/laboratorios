import { api } from './api'

export interface TipoEquipo {
  id: number
  nombre: string
  descripcion?: string
  created_at?: string
  count_equipos?: number
}

export interface TipoEquipoCreate {
  nombre: string
  descripcion?: string
}

export interface TipoEquipoUpdate {
  nombre: string
  descripcion?: string
}

export const tipoEquipoService = {
  // Obtener todos los tipos de equipo
  async getAll(): Promise<{ success: boolean; data: TipoEquipo[] }> {
    const response = await api.get('/tipos-equipo')
    return response.data
  },

  // Obtener solo tipos activos
  async getActivos(): Promise<{ success: boolean; data: TipoEquipo[] }> {
    const response = await api.get('/tipos-equipo/activos')
    return response.data
  },

  // Obtener un tipo por ID
  async getById(id: number): Promise<{ success: boolean; data: TipoEquipo }> {
    const response = await api.get(`/tipos-equipo/${id}`)
    return response.data
  },

  // Crear un nuevo tipo
  async create(data: TipoEquipoCreate): Promise<{ success: boolean; data: TipoEquipo; message: string }> {
    const response = await api.post('/tipos-equipo', data)
    return response.data
  },

  // Actualizar un tipo
  async update(id: number, data: TipoEquipoUpdate): Promise<{ success: boolean; data: TipoEquipo; message: string }> {
    const response = await api.put(`/tipos-equipo/${id}`, data)
    return response.data
  },

  // Eliminar un tipo
  async delete(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/tipos-equipo/${id}`)
    return response.data
  },

  // Contar equipos por tipo
  async countEquipos(id: number): Promise<{ success: boolean; data: { count: number } }> {
    const response = await api.get(`/tipos-equipo/${id}/count-equipos`)
    return response.data
  }
}

