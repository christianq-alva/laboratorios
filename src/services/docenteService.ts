import { api } from './api'

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
  create: async (data: DocenteData) => {
    const response = await api.post('/docentes', data)
    return response.data
  },

  // Actualizar docente
  update: async (id: number, data: DocenteData) => {
    const response = await api.put(`/docentes/${id}`, data)
    return response.data
  },

  // Eliminar docente
  delete: async (id: number) => {
    const response = await api.delete(`/docentes/${id}`)
    return response.data
  },

} 