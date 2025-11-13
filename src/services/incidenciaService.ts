import { api } from './api'

// Interfaces para incidencias
export interface Incidencia {
  id: number
  titulo: string
  descripcion: string
  fecha_reporte: string
  reserva_id: number
  fecha_clase: string
  fecha_fin: string
  laboratorio: string
  docente: string
  reportado_por: string
}

export interface IncidenciaDetalle extends Incidencia {
  cantidad_alumnos: number
  laboratorio_id: number
}

export interface HorarioParaIncidencia {
  id: number
  fecha_clase: string
  hora_fin: string
  laboratorio: string
  docente: string
  cantidad_alumnos: number
}

export interface IncidenciaResponse {
  success: boolean
  data: Incidencia[]
  user_role: string
  total: number
  message?: string
}

export interface IncidenciaDetalleResponse {
  success: boolean
  data: IncidenciaDetalle
  message?: string
}

export interface HorariosParaIncidenciasResponse {
  success: boolean
  data: HorarioParaIncidencia[]
  message?: string
}

export interface CreateIncidenciaData {
  reserva_id: number
  titulo: string
  descripcion: string
}

export interface CreateIncidenciaResponse {
  success: boolean
  message: string
  incidencia_id: number
}

export const incidenciaService = {
  // Obtener todas las incidencias del usuario
  getAll: async (): Promise<IncidenciaResponse> => {
    const response = await api.get('/incidencias')
    return response.data
  },

  // Obtener una incidencia específica por ID
  getById: async (id: number): Promise<IncidenciaDetalleResponse> => {
    const response = await api.get(`/incidencias/${id}`)
    return response.data
  },

  // Crear una nueva incidencia
  create: async (incidenciaData: CreateIncidenciaData): Promise<CreateIncidenciaResponse> => {
    const response = await api.post('/incidencias', incidenciaData)
    return response.data
  },

  // Obtener horarios disponibles para reportar incidencias
  getHorariosDisponibles: async (): Promise<HorariosParaIncidenciasResponse> => {
    const response = await api.get('/incidencias/horarios/disponibles')
    return response.data
  },

  // Eliminar una incidencia
  delete: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/incidencias/${id}`)
    return response.data
  }
} 