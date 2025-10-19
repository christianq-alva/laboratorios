import { api } from './api'

export interface LoteInsumo {
  detalle_id: number
  lote: string | null
  cantidad: number
  fecha_vencimiento: string | null
  fecha_ingreso: string | null
  fecha_movimiento: string | null
  laboratorio_nombre?: string
  laboratorio_id?: number
}

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
  lotes?: LoteInsumo[]
  total_lotes?: number
  stock_total_lotes?: number
  lotes_proximos_vencer?: number
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
      
      // Manejar errores específicos
      if (error.response?.data?.message) {
        if (error.response.data.message.includes('Duplicate entry')) {
          throw new Error('Error: Ya existe un insumo con ese código. El sistema generará automáticamente un código único.')
        }
        throw new Error(error.response.data.message)
      }
      
      throw new Error('Error al crear insumo')
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

  // ================================================================
  // NUEVOS MÉTODOS - SISTEMA DE STOCK MÍNIMO
  // ================================================================

  // Obtener stock actual de un insumo en un laboratorio
  async getStockActual(insumoId: number, laboratorioId: number): Promise<{
    success: boolean
    data: {
      insumo_id: number
      codigo: string
      nombre: string
      categoria: string
      unidad_medida: string
      laboratorio_id: number
      laboratorio_nombre: string
      stock_actual: number
      total_lotes: number
      proximo_vencimiento: string | null
    }
  }> {
    try {
      const response = await api.get(`/insumos/stock-actual/${insumoId}/${laboratorioId}`)
      return response.data
    } catch (error: any) {
      console.error('Error al obtener stock actual:', error)
      throw new Error(error.response?.data?.message || 'Error al obtener stock actual')
    }
  }

  // Configurar stock mínimo
  async configurarStockMinimo(data: {
    insumo_id: number
    laboratorio_id: number
    stock_minimo: number
    stock_maximo?: number
    punto_reorden?: number
    observaciones?: string
  }): Promise<{
    success: boolean
    message: string
    data: any
  }> {
    try {
      const response = await api.post('/insumos/config-stock', data)
      return response.data
    } catch (error: any) {
      console.error('Error al configurar stock mínimo:', error)
      throw new Error(error.response?.data?.message || 'Error al configurar stock mínimo')
    }
  }

  // Obtener configuración de stock de un insumo
  async getConfiguracionStock(insumoId: number): Promise<{
    success: boolean
    data: Array<{
      id: number
      insumo_id: number
      insumo_codigo: string
      insumo_nombre: string
      laboratorio_id: number
      laboratorio_nombre: string
      laboratorio_codigo: string
      stock_minimo: number
      stock_maximo: number | null
      punto_reorden: number | null
      observaciones: string | null
      fecha_configuracion: string
      fecha_actualizacion: string
      stock_actual: number
    }>
    total: number
  }> {
    try {
      const response = await api.get(`/insumos/config-stock/${insumoId}`)
      return response.data
    } catch (error: any) {
      console.error('Error al obtener configuración de stock:', error)
      throw new Error(error.response?.data?.message || 'Error al obtener configuración de stock')
    }
  }

  // Reporte: Insumos con stock bajo
  async getInsumosStockBajo(laboratorioId?: number): Promise<{
    success: boolean
    data: Array<{
      insumo_id: number
      insumo_codigo: string
      insumo_nombre: string
      categoria: string
      unidad_medida: string
      laboratorio_id: number
      laboratorio_nombre: string
      stock_actual: number
      stock_minimo: number
      punto_reorden: number | null
      diferencia_minimo: number
      porcentaje_stock_minimo: number | null
      estado_stock: 'AGOTADO' | 'BAJO' | 'REORDENAR'
      observaciones: string | null
      ultima_actualizacion: string | null
    }>
    estadisticas: {
      total_alertas: number
      agotados: number
      bajo_stock: number
      reordenar: number
      laboratorios_afectados: number
    }
    mensaje: string
  }> {
    try {
      const params = laboratorioId ? `?laboratorio_id=${laboratorioId}` : ''
      const response = await api.get(`/insumos/stock-bajo${params}`)
      return response.data
    } catch (error: any) {
      console.error('Error al obtener insumos con stock bajo:', error)
      throw new Error(error.response?.data?.message || 'Error al obtener insumos con stock bajo')
    }
  }

  // Reporte: Insumos próximos a vencer
  async getInsumosProximosVencer(laboratorioId?: number, dias?: number): Promise<{
    success: boolean
    data: Array<{
      insumo_id: number
      insumo_codigo: string
      insumo_nombre: string
      categoria: string
      unidad_medida: string
      laboratorio_id: number
      laboratorio_nombre: string
      detalle_id: number
      lote: string
      cantidad: number
      fecha_vencimiento: string
      fecha_ingreso: string
      fecha_movimiento: string
      dias_restantes: number
      meses_almacenado: number
      estado_vencimiento: 'VENCIDO' | 'VENCE_HOY' | 'URGENTE' | 'PROXIMO' | 'ADVERTENCIA'
      prioridad: number
    }>
    estadisticas: {
      total_lotes: number
      vencidos: number
      vence_hoy: number
      urgente: number
      proximo: number
      advertencia: number
      laboratorios_afectados: number
      insumos_unicos: number
    }
    mensaje: string
  }> {
    try {
      const params = new URLSearchParams()
      if (laboratorioId) params.append('laboratorio_id', laboratorioId.toString())
      if (dias) params.append('dias', dias.toString())
      
      const response = await api.get(`/insumos/proximos-vencer?${params.toString()}`)
      return response.data
    } catch (error: any) {
      console.error('Error al obtener insumos próximos a vencer:', error)
      throw new Error(error.response?.data?.message || 'Error al obtener insumos próximos a vencer')
    }
  }

  // Obtener resumen de alertas
  async getResumenAlertas(laboratorioId?: number): Promise<{
    success: boolean
    data: Array<{
      laboratorio_id: number
      laboratorio_nombre: string
      laboratorio_codigo: string
      insumos_agotados: number
      insumos_bajo_stock: number
      insumos_reordenar: number
      insumos_exceso: number
      insumos_sin_configurar: number
      lotes_vencidos: number
      vence_esta_semana: number
      vence_este_mes: number
      vence_trimestre: number
      total_alertas_criticas: number
      total_insumos: number
    }>
    totales: {
      total_insumos_agotados: number
      total_bajo_stock: number
      total_lotes_vencidos: number
      total_vence_semana: number
      total_vence_mes: number
      total_alertas_criticas: number
      laboratorios_monitoreados: number
    }
  }> {
    try {
      const params = laboratorioId ? `?laboratorio_id=${laboratorioId}` : ''
      const response = await api.get(`/insumos/resumen-alertas${params}`)
      return response.data
    } catch (error: any) {
      console.error('Error al obtener resumen de alertas:', error)
      throw new Error(error.response?.data?.message || 'Error al obtener resumen de alertas')
    }
  }
}

export const insumoService = new InsumoService() 