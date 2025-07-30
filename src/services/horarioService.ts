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
  laboratorio?: string
  docente?: string
  escuela?: string
  ciclo?: string
  grupo?: string
  insumos?: InsumoHorario[]
}

export interface InsumoHorario {
  id: number
  nombre: string
  cantidad_usada: number
  stock_disponible?: number
}

export interface CreateHorarioData {
  laboratorio_id: number
  docente_id: number
  grupo_id: number
  descripcion: string
  fecha_inicio: string
  fecha_fin: string
  cantidad_alumnos?: number
  insumos: Array<{
    insumo_id: number
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
}

export interface ConflictoHorario {
  tipo: 'laboratorio' | 'docente'
  mensaje: string
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
    const response = await api.get(`/horarios/${id}`)
    return response.data
  },

  create: async (data: CreateHorarioData) => {
    const response = await api.post('/horarios', data)
    return response.data
  },

  update: async (id: number, data: UpdateHorarioData) => {
    const response = await api.put(`/horarios/${id}`, data)
    return response.data
  },

  delete: async (id: number) => {
    const response = await api.delete(`/horarios/${id}`)
    return response.data
  },

  // Verificación de disponibilidad
  verificarDisponibilidad: async (data: VerificarDisponibilidadData): Promise<{ success: boolean; conflictos?: ConflictoHorario[]; message?: string }> => {
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