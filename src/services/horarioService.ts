import { api } from './api'
import type { ApiDataResponse, ApiMessageResponse } from './types'
import { toStrictNumber } from '../utils/numeric'

// Interfaces para horarios
export interface Horario {
  id: number
  laboratorio_id: number
  docente_id: number
  escuela_id: number
  ciclo_id: number
  descripcion: string
  fecha_inicio: string
  fecha_fin: string
  cantidad_alumnos?: number
  color?: string
  laboratorio?: string
  docente?: string
  escuela?: string
  ciclo?: string
  insumos?: InsumoHorario[]
  equipos?: EquipoHorario[]
  estado?: string
}

export interface HorarioSimple {
  id: number
  laboratorio_id: number
  docente_id: number
  escuela_id: number
  ciclo_id: number
  descripcion: string
  fecha_inicio: string
  fecha_fin: string
  cantidad_alumnos?: number
  num_grupos: number
  color?: string
  laboratorio?: string
  docente?: string
  escuela?: string
  ciclo?: string
  estado: string
  fecha_creacion: string
  fecha_actualizacion: string
  insumos_requeridos?: number
}

export interface HorarioFull extends HorarioSimple {
  insumos?: InsumoHorario[]
  insumos_consumidos?: InsumoConsumido[]
  equipos?: EquipoHorario[]
  tiene_consumo_insumos?: number // TINYINT(1): 0 o 1
}

export interface InsumoHorario {
  id: number
  codigo: string
  nombre: string
  categoria: string
  unidad_nombre: string
  cantidad_usada: number
  presentacion?: string | null
  cantidad_por_presentacion?: number
  precio_presentacion?: number
  precio_unitario?: number
}

export interface InsumoConsumido {
  id: number
  codigo: string
  nombre: string
  categoria: string
  unidad_nombre: string
  unidad_simbolo: string
  cantidad_consumida: number
}

export interface EquipoHorario {
  id: number
  nombre: string
  marca?: string
  modelo?: string
  codigo?: string
  estado?: string
}

export interface ActividadHorario {
  actividad_id: number
  accion: 'crear' | 'editar' | 'eliminar' | 'cerrar' | 'reabrir'
  descripcion: string
  fecha_actividad: string
  usuario_id: number
  usuario_nombre_completo: string
  usuario_rol: string
  fecha_inicio: string
  fecha_fin: string
  cantidad_alumnos: number
  laboratorio_nombre: string
  laboratorio_ubicacion: string
  docente_nombre: string
  escuela_nombre: string
  ciclo_nombre: string
}

export interface CreateHorarioData {
  laboratorio_id: number
  docente_id: number
  escuela_id: number
  ciclo_id: number
  descripcion: string
  fecha_inicio: string
  fecha_fin: string
  cantidad_alumnos?: number
  num_grupos?: number
  color?: string
  insumos?: Array<{
    insumo_id: number
    cantidad: number
  }>
  equipos?: Array<{
    equipo_id: number
  }>
}

export interface UpdateHorarioData extends CreateHorarioData { }

// Interfaces para formularios
export interface Ciclo {
  id: number
  nombre: string
}

export interface ConflictoHorario {
  tipo: 'laboratorio' | 'docente'
  mensaje: string
  detalles?: {
    laboratorio: string
    ubicacion: string
    docente: string
    grupo?: string
    escuela?: string
    ciclo?: string
    descripcion?: string
    fecha_inicio: string
    fecha_fin: string
    horario_id: number
  }
  horario_conflicto?: {
    id: number
    fecha_inicio: string
    fecha_fin: string
    laboratorio?: string
    docente?: string
  }
}

export interface VerificarDisponibilidadData {
  laboratorio_id: number
  docente_id: number
  fecha_inicio: string
  fecha_fin: string
  horario_id?: number // Para edición
}

export const horarioService = {
  // Obtener todos los horarios con filtros opcionales
  getAll: async (filters?: {
    laboratorio_id?: number
    escuela_id?: number
    docente_id?: number
    ciclo_id?: number
    fecha_inicio?: string
    fecha_fin?: string
    estado?: string
  }) => {
    const params = new URLSearchParams()

    if (filters?.laboratorio_id) params.append('laboratorio_id', filters.laboratorio_id.toString())
    if (filters?.escuela_id) params.append('escuela_id', filters.escuela_id.toString())
    if (filters?.docente_id) params.append('docente_id', filters.docente_id.toString())
    if (filters?.ciclo_id) params.append('ciclo_id', filters.ciclo_id.toString())
    if (filters?.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio)
    if (filters?.fecha_fin) params.append('fecha_fin', filters.fecha_fin)
    if (filters?.estado) params.append('estado', filters.estado)

    const response = await api.get(`/horarios?${params.toString()}`)
    return response.data
  },

  getById: async (id: number): Promise<ApiDataResponse<HorarioFull>> => {
    const response = await api.get(`/horarios/${id}`)
    return response.data
  },

  getInsumosRequeridosById: async (id: number): Promise<ApiDataResponse<InsumoHorario[]>> => {
    const response = await api.get(`/horarios/${id}/insumos-requeridos`)
    const raw: ApiDataResponse<InsumoHorario[]> = response.data
    return {
      ...raw,
      data: raw.data.map(insumo => ({
        ...insumo,
        cantidad_usada: toStrictNumber(insumo.cantidad_usada, 'cantidad_usada'),
      })),
    }
  },

  create: async (data: CreateHorarioData) => {
    const response = await api.post('/horarios', data)
    return response.data
  },

  update: async (id: number, data: UpdateHorarioData) => {
    const response = await api.put(`/horarios/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<ApiMessageResponse> => {
    const response = await api.delete(`/horarios/${id}`)
    return response.data
  },

  // Verificación de disponibilidad
  verificarDisponibilidad: async (data: VerificarDisponibilidadData): Promise<{
    disponible: boolean
    motivo?: string
    tipo_conflicto?: 'laboratorio' | 'docente'
    conflicto_detalle?: any
    mensaje?: string
  }> => {
    const response = await api.post('/horarios/verificar-disponibilidad', data)
    return response.data
  },

  getCiclos: async () => {
    const response = await api.get('/ciclos')
    return response.data
  },

  // Obtener actividad de horarios
  getActividad: async (filters?: {
    laboratorio_id?: number
    fecha_inicio?: string
    fecha_fin?: string
    accion?: string
    usuario_id?: number
  }) => {
    const params = new URLSearchParams()

    if (filters?.laboratorio_id) params.append('laboratorio_id', filters.laboratorio_id.toString())
    if (filters?.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio)
    if (filters?.fecha_fin) params.append('fecha_fin', filters.fecha_fin)
    if (filters?.accion) params.append('accion', filters.accion)
    if (filters?.usuario_id) params.append('usuario_id', filters.usuario_id.toString())

    const response = await api.get(`/horarios/actividad?${params.toString()}`)
    return response.data
  },

  // Cerrar horario y registrar consumo de insumos
  cerrarHorarioConInsumos: async (data: {
    laboratorio_id: number
    tipo_movimiento: 'entrada' | 'salida'
    observaciones?: string | null
    reserva_id?: number | null
    fecha_movimiento?: string | null
    detalles: Array<{
      insumo_id: number
      cantidad: number
      lote?: string | null
      fecha_vencimiento?: string | null
      entrada_detalle_id?: number | null
    }>
  }) => {
    const response = await api.post(`/horarios/cerrar-con-insumos`, data)
    return response.data
  },

  // Cerrar horario sin registrar insumos
  cerrarHorario: async (id: number) => {
    const response = await api.post(`/horarios/${id}/cerrar`)
    return response.data
  },

  // Reabrir horario
  reabrirHorario: async (id: number): Promise<ApiMessageResponse & { data?: { tiene_movimiento: boolean; movimiento_id?: number } }> => {
    const response = await api.patch(`/horarios/${id}/reabrir`)
    return response.data
  }
} 