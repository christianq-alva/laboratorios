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

class IncidenciaService {
  // Obtener todas las incidencias del usuario
  async getAll(): Promise<IncidenciaResponse> {
    try {
      const response = await api.get('/incidencias')
      return response.data
    } catch (error: any) {
      console.error('Error al obtener incidencias:', error)
      throw new Error(error.response?.data?.message || 'Error al obtener incidencias')
    }
  }

  // Obtener una incidencia específica por ID
  async getById(id: number): Promise<IncidenciaDetalleResponse> {
    try {
      const response = await api.get(`/incidencias/${id}`)
      return response.data
    } catch (error: any) {
      console.error('Error al obtener incidencia:', error)
      throw new Error(error.response?.data?.message || 'Error al obtener incidencia')
    }
  }

  // Crear una nueva incidencia
  async create(incidenciaData: CreateIncidenciaData): Promise<CreateIncidenciaResponse> {
    try {
      const response = await api.post('/incidencias', incidenciaData)
      return response.data
    } catch (error: any) {
      console.error('Error al crear incidencia:', error)
      throw new Error(error.response?.data?.message || 'Error al crear incidencia')
    }
  }

  // Obtener horarios disponibles para reportar incidencias
  async getHorariosDisponibles(): Promise<HorariosParaIncidenciasResponse> {
    try {
      const response = await api.get('/incidencias/horarios/disponibles')
      return response.data
    } catch (error: any) {
      console.error('Error al obtener horarios para incidencias:', error)
      throw new Error(error.response?.data?.message || 'Error al obtener horarios disponibles')
    }
  }
}

export const incidenciaService = new IncidenciaService() 