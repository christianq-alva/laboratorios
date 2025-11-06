import { api } from './api'
import type { ApiDataResponse, ApiMessageResponse } from './types'

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
  comentarios?: string
  condicion?: 'Excelente' | 'Bueno' | 'Regular' | 'Malo'
  fecha_adquisicion?: string
  tipo_equipo_id?: number
  tipo_equipo_nombre?: string
  laboratorio_id?: number
  laboratorio_nombre?: string
}

export interface ActividadEquipo {
  id: number
  tipo_registro: 'crud' | 'movimiento'
  tipo_movimiento: 'entrada' | 'reserva' | 'devolucion' | 'crear' | 'actualizar' | 'eliminar'
  fecha_movimiento: string
  observaciones: string
  equipo_codigo: string
  equipo_nombre: string
  equipo_marca: string
  equipo_modelo: string
  usuario_nombre: string
  usuario_rol: string
  laboratorio_nombre: string
  cantidad: number
  reserva_descripcion?: string
  reserva_fecha_inicio?: string
  reserva_fecha_fin?: string
}

export interface ActividadEquipoResponse {
  error: string | null
  data: ActividadEquipo[]
  total_registros: number
  total_movimientos: number
  desglose: {
    actividad_crud: number
    movimientos: number
  }
  filtros_aplicados: {
    laboratorio_id: number | null
    fecha_inicio: string | null
    fecha_fin: string | null
    tipo_actividad: string | null
    tipo_movimiento: string | null
  }
  message?: string
}

export const equipoService = {
  // Obtener todos los equipos (según permisos del usuario)
  getAll: async (): Promise<ApiDataResponse<Equipo[]>> => {
    const response = await api.get('/equipos')
    return response.data
  },

  // Obtener equipos de un laboratorio específico
  getByLaboratorio: async (laboratorioId: number): Promise<ApiDataResponse<Equipo[]>> => {
    const response = await api.get(`/equipos/${laboratorioId}`)
    return response.data
  },

  // Crear nuevo equipo
  create: async (equipoData: {
    codigo: string
    nombre: string
    descripcion: string
    marca: string
    modelo: string
    numero_serie: string
    estado: string
    fecha_ultimo_mantenimiento?: string
    fecha_proximo_mantenimiento?: string
    comentarios?: string
    condicion?: string
    fecha_adquisicion?: string | null
    tipo_equipo_id?: number
    laboratorio_id?: number
  }): Promise<{ message: string; equipo_id: number }> => {
    
    const response = await api.post('/equipos', equipoData)
    return response.data
  },

  // Actualizar equipo
  update: async (id: number, equipoData: {
    codigo: string | null
    nombre: string
    descripcion: string
    marca: string
    modelo: string
    numero_serie: string
    estado: string
    fecha_ultimo_mantenimiento?: string
    fecha_proximo_mantenimiento?: string
    comentarios?: string
    condicion?: string
    fecha_adquisicion?: string | null
    tipo_equipo_id?: number
    laboratorio_id?: number
  }): Promise<{ message: string; data: any }> => {
    const response = await api.put(`/equipos/${id}`, equipoData)
    return response.data
  },

  // Eliminar equipo
  delete: async (id: number): Promise<ApiMessageResponse> => {
    const response = await api.delete(`/equipos/${id}`)
    return response.data
  },

  // Obtener actividad de equipos
  getActividad: async (filters?: {
    laboratorio_id?: number
    fecha_inicio?: string
    fecha_fin?: string
    tipo_movimiento?: string
  }): Promise<ActividadEquipoResponse> => {
    const params = new URLSearchParams()
    if (filters?.laboratorio_id) params.append('laboratorio_id', filters.laboratorio_id.toString())
    if (filters?.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio)
    if (filters?.fecha_fin) params.append('fecha_fin', filters.fecha_fin)
    if (filters?.tipo_movimiento) params.append('tipo_movimiento', filters.tipo_movimiento)

    const response = await api.get(`/equipos/actividad?${params.toString()}`)
    return response.data
  },

  // Descargar plantilla Excel para importación masiva de equipos
  descargarPlantillaImportacion: async (): Promise<void> => {
    try {
      const response = await api.get('/equipos/plantilla-importacion', {
        responseType: 'blob'
      })

      // Crear enlace de descarga
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      // Obtener nombre del archivo desde header o usar uno por defecto
      const contentDisposition = response.headers['content-disposition']
      let filename = 'plantilla_equipos.xlsx'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

    } catch (error: any) {
      console.error('Error al descargar plantilla de equipos:', error)
      throw new Error(error.response?.data?.message || 'Error al descargar la plantilla de equipos')
    }
  },

  // Previsualizar datos del Excel antes de importar equipos
  previsualizarImportacion: async (archivo: File): Promise<{
    success: boolean
    data: Array<{
      fila: number
      codigo: string
      nombre: string
      tipo_equipo_id: number
      descripcion: string
      marca: string
      modelo: string
      numero_serie: string
      estado: string
      fecha_ultimo_mantenimiento: string
      fecha_proximo_mantenimiento: string
      comentarios: string
      condicion: string
      fecha_adquisicion: string
      laboratorio_id: number
      errores: string[]
    }>
    total_filas: number
    errores_generales: string[]
  }> => {
    try {
      const formData = new FormData()
      formData.append('archivo_excel', archivo)

      const response = await api.post('/equipos/previsualizar-importacion', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      return response.data
    } catch (error: any) {
      console.error('Error en previsualización de equipos:', error)
      throw new Error(error.response?.data?.message || 'Error al previsualizar el archivo de equipos')
    }
  },

  // Importación masiva de equipos desde Excel
  importacionMasiva: async (archivo: File): Promise<{
    success: boolean
    message: string
    procesados: number
    errores: number
    detalles_errores: string[]
    resultados: Array<{
      fila: number
      codigo: string
      nombre: string
      marca: string
      modelo: string
      estado: string
      laboratorio_id: number
    }>
  }> => {
    try {
      const formData = new FormData()
      formData.append('archivo_excel', archivo)

      const response = await api.post('/equipos/importacion-masiva', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      return response.data
    } catch (error: any) {
      console.error('Error en importación masiva de equipos:', error)
      throw new Error(error.response?.data?.message || 'Error en la importación masiva de equipos')
    }
  }
}
