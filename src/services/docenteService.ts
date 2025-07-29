import { api } from './api'

export interface Docente {
  id: number
  nombre: string
  correo: string
  escuela_id: number
  escuela?: string
  total_horarios?: number
}

export interface CreateDocenteData {
  nombre: string
  correo: string
  escuela_id: number
}

export interface UpdateDocenteData extends CreateDocenteData {}

export interface Escuela {
  id: number
  nombre: string
}

export interface DocenteHorario {
  id: number
  fecha_inicio: string
  fecha_fin: string
  cantidad_alumnos: number
  laboratorio: string
  laboratorio_id: number
}

export const docenteService = {
  // Obtener todos los docentes
  getAll: async () => {
    const response = await api.get('/docentes')
    return response.data
  },

  // Obtener docente por ID
  getById: async (id: number) => {
    const response = await api.get(`/docentes/${id}`)
    return response.data
  },

  // Crear nuevo docente
  create: async (data: CreateDocenteData) => {
    const response = await api.post('/docentes', data)
    return response.data
  },

  // Actualizar docente
  update: async (id: number, data: UpdateDocenteData) => {
    const response = await api.put(`/docentes/${id}`, data)
    return response.data
  },

  // Eliminar docente
  delete: async (id: number) => {
    const response = await api.delete(`/docentes/${id}`)
    return response.data
  },

  // Obtener horarios de un docente
  getHorarios: async (id: number) => {
    const response = await api.get(`/docentes/${id}/horarios`)
    return response.data
  },

  // Obtener escuelas disponibles
  getEscuelas: async () => {
    const response = await api.get('/docentes/utils/escuelas')
    return response.data
  }
} 