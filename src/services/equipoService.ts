import { api } from './api'

export interface Equipo {
  id: number
  codigo: string
  nombre: string
  descripcion: string
  marca: string
  modelo: string
  numero_serie: string
  estado: 'Operativo' | 'En Mantenimiento' | 'Fuera de Servicio'
  fecha_ultimo_mantenimiento?: string
  fecha_proximo_mantenimiento?: string
  cantidad_disponible?: number
  cantidad_total?: number
  cantidad_en_uso?: number
  inventario_por_laboratorio?: string
}

export interface EquipoResponse {
  success: boolean
  data: Equipo[]
  laboratorio_filtrado?: number | null
  total_equipos: number
  message?: string
}

export interface ActividadEquipo {
  id: number
  fecha_movimiento: string
  tipo_movimiento: 'entrada' | 'reserva' | 'devolucion'
  cantidad: number
  observaciones: string
  equipo_nombre: string
  equipo_codigo: string
  equipo_marca: string
  equipo_modelo: string
  laboratorio_nombre: string
  usuario_nombre: string
  usuario_rol: string
  reserva_descripcion?: string
  reserva_fecha_inicio?: string
  reserva_fecha_fin?: string
}

export interface ActividadEquipoResponse {
  success: boolean
  data: ActividadEquipo[]
  total_movimientos: number
  filtros_aplicados: {
    laboratorio_id: number | null
    fecha_inicio: string | null
    fecha_fin: string | null
    tipo_movimiento: string | null
  }
  message?: string
}

class EquipoService {
  // Obtener todos los equipos (según permisos del usuario)
  async getAll(): Promise<EquipoResponse> {
    try {
      const response = await api.get('/equipos')
      return response.data
    } catch (error: any) {
      console.error('Error al obtener equipos:', error)
      throw new Error(error.response?.data?.message || 'Error al obtener equipos')
    }
  }

  // Obtener equipos de un laboratorio específico
  async getByLaboratorio(laboratorioId: number): Promise<EquipoResponse> {
    try {
      const response = await api.get(`/equipos?laboratorio_id=${laboratorioId}`)
      return response.data
    } catch (error: any) {
      console.error('Error al obtener equipos del laboratorio:', error)
      throw new Error(error.response?.data?.message || 'Error al obtener equipos del laboratorio')
    }
  }

  // Crear nuevo equipo
  async create(equipoData: {
    nombre: string
    descripcion: string
    marca: string
    modelo: string
    numero_serie: string
    estado: string
    fecha_ultimo_mantenimiento?: string
    fecha_proximo_mantenimiento?: string
    inventario_inicial?: Array<{
      laboratorio_id: number
      cantidad_total: number
      observaciones?: string
    }>
  }): Promise<{ success: boolean; message: string; equipo_id: number }> {
    try {
      const response = await api.post('/equipos', equipoData)
      return response.data
    } catch (error: any) {
      console.error('Error al crear equipo:', error)
      throw new Error(error.response?.data?.message || 'Error al crear equipo')
    }
  }

  // Actualizar equipo
  async update(id: number, equipoData: {
    nombre: string
    descripcion: string
    marca: string
    modelo: string
    numero_serie: string
    estado: string
    fecha_ultimo_mantenimiento?: string
    fecha_proximo_mantenimiento?: string
  }): Promise<{ success: boolean; message: string; data: any }> {
    try {
      const response = await api.put(`/equipos/${id}`, equipoData)
      return response.data
    } catch (error: any) {
      console.error('Error al actualizar equipo:', error)
      throw new Error(error.response?.data?.message || 'Error al actualizar equipo')
    }
  }

  // Eliminar equipo
  async delete(id: number): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🗑️ Eliminando equipo:', id)
      const response = await api.delete(`/equipos/${id}`)
      console.log('✅ Respuesta del servidor:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ Error al eliminar equipo:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        data: error.response?.data,
        error: error.message
      })
      throw error
    }
  }

  // Obtener actividad de equipos
  async getActividad(filters?: {
    laboratorio_id?: number
    fecha_inicio?: string
    fecha_fin?: string
    tipo_movimiento?: string
  }): Promise<ActividadEquipoResponse> {
    try {
      const params = new URLSearchParams()
      if (filters?.laboratorio_id) params.append('laboratorio_id', filters.laboratorio_id.toString())
      if (filters?.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio)
      if (filters?.fecha_fin) params.append('fecha_fin', filters.fecha_fin)
      if (filters?.tipo_movimiento) params.append('tipo_movimiento', filters.tipo_movimiento)
      
      const response = await api.get(`/equipos/actividad?${params.toString()}`)
      return response.data
    } catch (error: any) {
      console.error('Error al obtener actividad de equipos:', error)
      throw new Error(error.response?.data?.message || 'Error al obtener actividad de equipos')
    }
  }
}

export const equipoService = new EquipoService()
