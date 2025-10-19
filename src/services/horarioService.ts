import { api } from './api'

// Interfaces para horarios
export interface Horario {
  id: number
  laboratorio_id: number
  docente_id: number
  grupo_id: number
  descripcion: string
  fecha_inicio: string
  fecha_fin: string
  cantidad_alumnos?: number
  color?: string
  laboratorio?: string
  docente?: string
  escuela?: string
  ciclo?: string
  grupo?: string
  insumos?: InsumoHorario[]
  equipos?: EquipoHorario[]
}

export interface InsumoHorario {
  id: number
  nombre: string
  cantidad_usada: number
  stock_disponible?: number
  descripcion?: string
  unidad_medida?: string
}

export interface EquipoHorario {
  id: number
  nombre: string
  cantidad_usada: number
  marca?: string
  modelo?: string
  codigo?: string
  estado?: string
}

export interface ActividadHorario {
  actividad_id: number
  accion: 'crear' | 'editar' | 'eliminar' | 'ver'
  reserva_id: number
  descripcion: string
  fecha_actividad: string
  ip_address: string
  usuario_id: number
  usuario_nombre: string
  usuario_nombre_completo: string
  usuario_rol: string
  horario_descripcion: string
  fecha_inicio: string
  fecha_fin: string
  cantidad_alumnos: number
  color: string
  horario_creado_en: string
  horario_actualizado_en: string
  laboratorio_nombre: string
  laboratorio_ubicacion: string
  docente_nombre: string
  docente_correo: string
  grupo_nombre: string
  escuela_nombre: string
  ciclo_nombre: string
}

export interface CreateHorarioData {
  laboratorio_id: number
  docente_id: number
  grupo_id: number
  descripcion: string
  fecha_inicio: string
  fecha_fin: string
  cantidad_alumnos?: number
  color?: string
  insumos: Array<{
    insumo_id: number
    cantidad: number
  }>
  equipos?: Array<{
    equipo_id: number
    cantidad: number
  }>
}

export interface UpdateHorarioData extends CreateHorarioData {}

// Interfaces para formularios
export interface Docente {
  id: number
  nombre: string
  correo: string
  escuela_id: number
  escuela?: string
}

export interface Escuela {
  id: number
  nombre: string
}

export interface Ciclo {
  id: number
  nombre: string
}

export interface Grupo {
  id: number
  nombre: string
  escuela_id: number
  ciclo_id: number
  escuela?: string
  ciclo?: string
}

export interface Insumo {
  id: number
  nombre: string
  descripcion?: string
  stock_disponible?: number
  stock_total_lotes?: number
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
  // CRUD básico
  getAll: async () => {
    const response = await api.get('/horarios')
    return response.data
  },

  getById: async (id: number) => {
    try {
      const response = await api.get(`/horarios/${id}`)
      return response.data
    } catch (error: any) {
      console.error('Error al obtener horario:', error)
      throw new Error(error.response?.data?.message || 'Error al obtener horario')
    }
  },

  create: async (data: CreateHorarioData) => {
    try {
      console.log('📤 Enviando datos a /horarios:', data)
      const response = await api.post('/horarios', data)
      console.log('✅ Respuesta exitosa:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ Error en create horario:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        data: error.response?.data,
        sentData: data
      })
      throw error
    }
  },

  update: async (id: number, data: UpdateHorarioData) => {
    const response = await api.put(`/horarios/${id}`, data)
    return response.data
  },

  delete: async (id: number) => {
    try {
      console.log('🗑️ Eliminando horario:', id)
      const response = await api.delete(`/horarios/${id}`)
      console.log('✅ Respuesta del servidor:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ Error al eliminar horario:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        data: error.response?.data,
        error: error.message
      })
      throw error
    }
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

  // Utilidades para formularios
  getEscuelas: async () => {
    const response = await api.get('/horarios/utils/escuelas')
    return response.data
  },

  getCiclos: async () => {
    const response = await api.get('/horarios/utils/ciclos')
    return response.data
  },

  getGrupos: async (escuela_id?: number, ciclo_id?: number) => {
    let url = '/horarios/utils/grupos'
    const params = new URLSearchParams()
    
    if (escuela_id) params.append('escuela_id', escuela_id.toString())
    if (ciclo_id) params.append('ciclo_id', ciclo_id.toString())
    
    if (params.toString()) {
      url += '?' + params.toString()
    }
    
    const response = await api.get(url)
    return response.data
  },

  // Obtener docentes
  getDocentes: async () => {
    const response = await api.get('/docentes')
    return response.data
  },

  // Obtener insumos por laboratorio
  getInsumosByLaboratorio: async (laboratorio_id: number) => {
    try {
      console.log('🔍 Cargando insumos para laboratorio:', laboratorio_id)
      const response = await api.get(`/insumos?laboratorio_id=${laboratorio_id}`)
      console.log('📦 Insumos recibidos:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Error al cargar insumos:', error)
      return { success: false, data: [], message: 'Error al cargar insumos' }
    }
  },

  // Obtener equipos por laboratorio
  getEquiposByLaboratorio: async (laboratorio_id: number) => {
    try {
      console.log('🔍 Cargando equipos para laboratorio:', laboratorio_id)
      const response = await api.get(`/equipos?laboratorio_id=${laboratorio_id}`)
      console.log('🔧 Equipos recibidos:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Error al cargar equipos:', error)
      return { success: false, data: [], message: 'Error al cargar equipos' }
    }
  },

  // 📊 Obtener actividad de horarios
  getActividad: async (filters?: {
    laboratorio_id?: number
    fecha_inicio?: string
    fecha_fin?: string
    accion?: string
    usuario_id?: number
  }) => {
    try {
      const params = new URLSearchParams()
      
      if (filters?.laboratorio_id) params.append('laboratorio_id', filters.laboratorio_id.toString())
      if (filters?.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio)
      if (filters?.fecha_fin) params.append('fecha_fin', filters.fecha_fin)
      if (filters?.accion) params.append('accion', filters.accion)
      if (filters?.usuario_id) params.append('usuario_id', filters.usuario_id.toString())

      const response = await api.get(`/horarios/actividad?${params.toString()}`)
      return response.data
    } catch (error) {
      console.error('❌ Error al obtener actividad de horarios:', error)
      return { success: false, data: [], message: 'Error al obtener actividad' }
    }
  },

  // 🔍 DEBUG: Verificar todos los registros
  debug: async () => {
    try {
      const response = await api.get('/horarios/debug')
      return response.data
    } catch (error) {
      console.error('❌ Error en debug:', error)
      return { success: false, message: 'Error en debug' }
    }
  }
} 