import { api } from './api'

export interface Insumo {
  id: number
  nombre: string
  descripcion: string
  unidad_medida: string
  stock_disponible?: number
  stock_por_laboratorio?: string
}

export interface InsumoResponse {
  success: boolean
  data: Insumo[]
  laboratorio_filtrado?: number | null
  total_insumos: number
  message?: string
}

export interface ActividadInsumo {
  id: number
  fecha_movimiento: string
  tipo_movimiento: 'entrada' | 'salida'
  cantidad: number
  observaciones: string
  insumo_nombre: string
  unidad_medida: string
  laboratorio_nombre: string
  usuario_nombre: string
  usuario_rol: string
  reserva_descripcion?: string
  reserva_fecha_inicio?: string
  reserva_fecha_fin?: string
}

export interface ActividadResponse {
  success: boolean
  data: ActividadInsumo[]
  total_movimientos: number
  filtros_aplicados: {
    laboratorio_id: number | null
    fecha_inicio: string | null
    fecha_fin: string | null
    tipo_movimiento: string | null
  }
  message?: string
}

class InsumoService {
  // Obtener todos los insumos (según permisos del usuario)
  async getAll(): Promise<InsumoResponse> {
    try {
      const response = await api.get('/insumos')
      return response.data
    } catch (error: any) {
      console.error('Error al obtener insumos:', error)
      throw new Error(error.response?.data?.message || 'Error al obtener insumos')
    }
  }

  // Obtener insumos de un laboratorio específico
  async getByLaboratorio(laboratorioId: number): Promise<InsumoResponse> {
    try {
      const response = await api.get(`/insumos?laboratorio_id=${laboratorioId}`)
      return response.data
    } catch (error: any) {
      console.error('Error al obtener insumos del laboratorio:', error)
      throw new Error(error.response?.data?.message || 'Error al obtener insumos del laboratorio')
    }
  }

  // Crear nuevo insumo
  async create(insumoData: {
    nombre: string
    descripcion: string
    unidad_medida: string
    stock_inicial?: Array<{
      laboratorio_id: number
      cantidad: number
      observaciones?: string
    }>
  }): Promise<{ success: boolean; message: string; insumo_id: number }> {
    try {
      const response = await api.post('/insumos', insumoData)
      return response.data
    } catch (error: any) {
      console.error('Error al crear insumo:', error)
      throw new Error(error.response?.data?.message || 'Error al crear insumo')
    }
  }

  // Obtener actividad de insumos
  async getActividad(filters?: {
    laboratorio_id?: number
    fecha_inicio?: string
    fecha_fin?: string
    tipo_movimiento?: string
  }): Promise<ActividadResponse> {
    try {
      const params = new URLSearchParams()
      if (filters?.laboratorio_id) params.append('laboratorio_id', filters.laboratorio_id.toString())
      if (filters?.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio)
      if (filters?.fecha_fin) params.append('fecha_fin', filters.fecha_fin)
      if (filters?.tipo_movimiento) params.append('tipo_movimiento', filters.tipo_movimiento)
      
      const response = await api.get(`/insumos/actividad?${params.toString()}`)
      return response.data
    } catch (error: any) {
      console.error('Error al obtener actividad de insumos:', error)
      throw new Error(error.response?.data?.message || 'Error al obtener actividad de insumos')
    }
  }
}

export const insumoService = new InsumoService() 