import { api } from './api'

export interface Insumo {
  id: number
  codigo: string
  nombre: string
  descripcion: string
  unidad_medida: string
  categoria: 'Reactivos' | 'Materiales' | 'Material_Biologico'
  stock_disponible?: number
  stock_por_laboratorio?: string
  presentacion?: string
  condicion?: 'Excelente' | 'Bueno' | 'Regular' | 'Malo'
  fecha_vencimiento?: string
  observacion?: string
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
    categoria: 'Reactivos' | 'Materiales' | 'Material_Biologico'
    presentacion?: string
    condicion?: string
    fecha_vencimiento?: string
    observacion?: string
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

  // Actualizar insumo
  async update(id: number, insumoData: {
    nombre: string
    descripcion: string
    unidad_medida: string
    categoria: 'Reactivos' | 'Materiales' | 'Material_Biologico'
    presentacion?: string
    condicion?: string
    fecha_vencimiento?: string
    observacion?: string
  }): Promise<{ success: boolean; message: string; data: any }> {
    try {
      const response = await api.put(`/insumos/${id}`, insumoData)
      return response.data
    } catch (error: any) {
      console.error('Error al actualizar insumo:', error)
      throw new Error(error.response?.data?.message || 'Error al actualizar insumo')
    }
  }

  // Eliminar insumo
  async delete(id: number): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🗑️ Eliminando insumo:', id)
      const response = await api.delete(`/insumos/${id}`)
      console.log('✅ Respuesta del servidor:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ Error al eliminar insumo:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        data: error.response?.data,
        error: error.message
      })
      throw error
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

  // Reabastecimiento de insumos
  async reabastecimiento(data: {
    laboratorio_id: number
    motivo_general: string
    insumos: Array<{
      insumo_id: number
      cantidad: number
      observaciones?: string
    }>
  }): Promise<{ success: boolean; message: string; data: any }> {
    try {
      console.log('📦 Enviando reabastecimiento:', data)
      const response = await api.post('/insumos/reabastecimiento', data)
      return response.data
    } catch (error: any) {
      console.error('Error al procesar reabastecimiento:', error)
      throw new Error(error.response?.data?.message || 'Error al procesar reabastecimiento')
    }
  }

  // Descargar plantilla Excel para carga masiva
  async descargarPlantillaExcel(): Promise<{ data: Blob }> {
    try {
      const response = await api.get('/insumos/plantilla-excel', {
        responseType: 'blob'
      })
      return { data: response.data }
    } catch (error: any) {
      console.error('Error al descargar plantilla Excel:', error)
      throw new Error(error.response?.data?.message || 'Error al descargar plantilla Excel')
    }
  }

  // Procesar archivo Excel
  async procesarArchivoExcel(formData: FormData): Promise<{
    success: boolean
    message: string
    data: {
      archivo: string
      total_filas: number
      registros_validos: number
      registros_con_errores: number
      datos_validados: Array<{
        fila: number
        insumo_id: number
        insumo_codigo: string
        insumo_nombre: string
        insumo_unidad: string
        cantidad: number
        laboratorio_id: number
        laboratorio_codigo: string
        laboratorio_nombre: string
      }>
      errores: string[]
    }
  }> {
    try {
      const response = await api.post('/insumos/procesar-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error: any) {
      console.error('Error al procesar archivo Excel:', error)
      throw new Error(error.response?.data?.message || 'Error al procesar archivo Excel')
    }
  }

  // Ejecutar reabastecimiento masivo
  async ejecutarReabastecimientoMasivo(data: {
    datos_reabastecimiento: Array<{
      insumo_id: number
      insumo_codigo: string
      insumo_nombre: string
      insumo_unidad: string
      cantidad: number
      laboratorio_id: number
      laboratorio_codigo: string
      laboratorio_nombre: string
    }>
    motivo_general: string
  }): Promise<{
    success: boolean
    message: string
    data: {
      total_registros: number
      registros_procesados: number
      registros_fallidos: number
      motivo: string
      resultados: Array<{
        insumo: string
        laboratorio: string
        cantidad: number
        estado: 'exitoso' | 'error'
        error?: string
      }>
    }
  }> {
    try {
      const response = await api.post('/insumos/reabastecimiento-masivo', data)
      return response.data
    } catch (error: any) {
      console.error('Error al ejecutar reabastecimiento masivo:', error)
      throw new Error(error.response?.data?.message || 'Error al ejecutar reabastecimiento masivo')
    }
  }

  // Descargar plantilla Excel para importación masiva
  async descargarPlantillaImportacion(): Promise<void> {
    try {
      const response = await api.get('/insumos/plantilla-importacion', {
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
      let filename = 'plantilla_insumos.xlsx'
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
      console.error('Error al descargar plantilla:', error)
      throw new Error(error.response?.data?.message || 'Error al descargar la plantilla')
    }
  }

  // Previsualizar datos del Excel antes de importar
  async previsualizarImportacion(archivo: File): Promise<{
    success: boolean
    data: Array<{
      fila: number
      nombre: string
      descripcion: string
      unidad_medida: string
      categoria: string
      presentacion: string
      condicion: string
      fecha_vencimiento: string
      observacion: string
      stock_labs: { [key: string]: number }
      errores: string[]
    }>
    total_filas: number
    errores_generales: string[]
  }> {
    try {
      const formData = new FormData()
      formData.append('archivo_excel', archivo)
      
      const response = await api.post('/insumos/previsualizar-importacion', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      return response.data
    } catch (error: any) {
      console.error('Error en previsualización:', error)
      throw new Error(error.response?.data?.message || 'Error al previsualizar el archivo')
    }
  }

  // Importación masiva de insumos desde Excel
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
      categoria: string
      stock: string
    }>
  }> {
    try {
      const formData = new FormData()
      formData.append('archivo_excel', archivo)
      
      const response = await api.post('/insumos/importacion-masiva', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      return response.data
    } catch (error: any) {
      console.error('Error en importación masiva:', error)
      throw new Error(error.response?.data?.message || 'Error en la importación masiva')
    }
  }
}

export const insumoService = new InsumoService() 