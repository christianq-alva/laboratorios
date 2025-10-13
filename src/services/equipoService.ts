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
  comentarios?: string
  condicion?: 'Excelente' | 'Bueno' | 'Regular' | 'Malo'
  fecha_adquisicion?: string
  // Campos adicionales para vista simple
  total_movimientos?: number
  laboratorios_asignados?: number
  laboratorios_nombres?: string
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
  success: boolean
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

export interface EquipoResponse {
  success: boolean
  data: Equipo[]
  laboratorio_filtrado?: number | null
  total_equipos: number
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

  // Obtener equipos en vista simple (sin agrupar)
  async getAllSimple(): Promise<EquipoResponse> {
    try {
      const response = await api.get('/equipos/simple')
      return response.data
    } catch (error: any) {
      console.error('Error al obtener equipos simples:', error)
      throw new Error(error.response?.data?.message || 'Error al obtener equipos simples')
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
    comentarios?: string
    condicion?: string
    fecha_adquisicion?: string | null
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
      
      // Manejar errores específicos
      if (error.response?.data?.message) {
        if (error.response.data.message.includes('Duplicate entry')) {
          throw new Error('Error: Ya existe un equipo con ese código. El sistema generará automáticamente un código único.')
        }
        throw new Error(error.response.data.message)
      }
      
      throw new Error('Error al crear equipo')
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
    comentarios?: string
    condicion?: string
    fecha_adquisicion?: string | null
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

  // Descargar plantilla Excel para importación masiva de equipos
  async descargarPlantillaImportacion(): Promise<void> {
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
  }

  // Previsualizar datos del Excel antes de importar equipos
  async previsualizarImportacion(archivo: File): Promise<{
    success: boolean
    data: Array<{
      fila: number
      nombre: string
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
      inventario_labs: { [key: string]: number }
      errores: string[]
    }>
    total_filas: number
    errores_generales: string[]
  }> {
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
  }

  // Importación masiva de equipos desde Excel
  async importacionMasiva(archivo: File): Promise<{
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
      inventario: string
    }>
  }> {
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

export const equipoService = new EquipoService()
