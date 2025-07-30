import { api } from './api'

export interface Laboratorio {
  id: number
  nombre: string
  ubicacion: string
  escuela_id: number
  piso: string
  escuela?: string // Para mostrar el nombre de la escuela
}

export interface CreateLaboratorioData {
  nombre: string
  ubicacion: string
  escuela_id: number
  piso: string
}

export interface UpdateLaboratorioData extends CreateLaboratorioData {}

export interface Escuela {
  id: number
  nombre: string
}

export const laboratorioService = {
  // Obtener todos los laboratorios
  getAll: async () => {
    const response = await api.get('/laboratorios')
    return response.data
  },

  // Obtener laboratorio por ID
  getById: async (id: number) => {
    const response = await api.get(`/laboratorios/${id}`)
    return response.data
  },

  // Crear nuevo laboratorio
  create: async (data: CreateLaboratorioData) => {
    const response = await api.post('/laboratorios', data)
    return response.data
  },

  // Actualizar laboratorio
  update: async (id: number, data: UpdateLaboratorioData) => {
    const response = await api.put(`/laboratorios/${id}`, data)
    return response.data
  },

  // Eliminar laboratorio
  delete: async (id: number) => {
    const response = await api.delete(`/laboratorios/${id}`)
    return response.data
  },

  // Obtener escuelas disponibles para el selector
  getEscuelas: async () => {
    const response = await api.get('/docentes/utils/escuelas')
    return response.data
  }
} 