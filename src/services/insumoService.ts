import type { DatoValidado } from '../components/Insumos/CargaMasivaModal'
import { api } from './api'

export interface LoteInsumo {
  detalle_id: number
  lote: string | null
  cantidad: number
  saldo?: number | null
  fecha_vencimiento: string | null
  fecha_ingreso: string | null
  fecha_movimiento: string | null
  laboratorio_nombre?: string
  laboratorio_id?: number
}

export interface InsumoSaldo {
  id: number
  codigo: string
  nombre: string
  description: string
  unidad_medida: string
  categoria: 'Reactivos' | 'Materiales' | 'Material_Biologico'
  presentacion: string
  total_lotes: number
  stock_disponible: number
}

export interface AllInsumoResponse {
  data: Insumo2[]
}

export interface Insumo2 {
  id: number
  codigo: string
  nombre: string
  descripcion: string
  unidad_medida: string
  categoria: 'Reactivos' | 'Materiales' | 'Material_Biologico'
  presentacion: string
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

export interface InsumoSaldoResponse {
  data: InsumoSaldo[]
}

export interface ActividadInsumo {
  id: number
  fecha_movimiento: string
  fecha_ingreso: string
  tipo_movimiento: 'entrada' | 'salida'
  observaciones: string
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

  //Crear nuevo insumo
  async create(insumoData: {
    nombre: string
    descripcion: string
    unidad_medida: string
    categoria: 'Reactivos' | 'Materiales' | 'Material_Biologico'
    presentacion?: string
  }): Promise<{
    success: boolean;
    message: string;
    insumo_id: number;
  }> {
    try {
      const response = await api.post('/insumos', insumoData)
      console.log(response)
      return response.data
    } catch (error: any) {
      console.error('Error al crear insumo:', error)
      throw new Error('Error al crear insumo')
    }
  }

  //Actualizar insumo
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

  //Eliminar insumo
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
  //Obtener listado de insumos 
  async getAllInsumos(): Promise<AllInsumoResponse> {
    try {
      const response = await api.get('/insumos/list')
      return response.data
    } catch (error: any) {
      console.error('Error al obtener listado de insumos:', error)
      throw new Error(error.response?.data?.message || 'Error al obtener listado de insumos')
    }
  }

  //Generar plantilla Excel para importación masiva de insumos
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

  //Procesar archivo Excel para importación masiva de insumos
  async previsualizarImportacion(archivo: File): Promise<{
    success: boolean
    data: Array<{
      fila: number
      nombre: string
      descripcion: string
      unidad_medida: string
      categoria: string
      presentacion: string
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

  //Ejecutar importación masiva de insumos
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

  //Obtener los insumos y su stock de todos los laboratorios
  async getAllWithStock(): Promise<InsumoSaldoResponse> {
    try {
      const response = await api.get('/inventario/all-con-saldo')
      return response.data
    } catch (error: any) {
      console.error('Error al obtener insumos con saldo:', error)
      throw new Error(error.response?.data?.message || 'Error al obtener insumos con saldo')
    }
  }

  //Obtener los insumos y su stock de un laboratorio
  async getWithStock(laboratorio_id: number): Promise<InsumoSaldoResponse> {
    try {
      const params = new URLSearchParams()
      params.append('laboratorio_id', laboratorio_id.toString());
      const response = await api.get(`/inventario/insumos-con-saldo?${params.toString()}`)
      return response.data
    } catch (error: any) {
      console.error('Error al obtener insumos con saldo por laboratorio:', error)
      throw new Error(error.response?.data?.message || 'Error al obtener insumos con saldo por laboratorio')
    }
  }

  //Obtener solo los insumos con stock de un laboratorio
  async getWithPositiveStock(laboratorio_id: number): Promise<InsumoSaldoResponse> {
    try {
      const params = new URLSearchParams()
      params.append('laboratorio_id', laboratorio_id.toString());
      const response = await api.get(`/inventario/insumos-con-saldo-positivo?${params.toString()}`)
      return response.data
    } catch (error: any) {
      console.error('Error al obtener insumos con saldo:', error)
      throw new Error(error.response?.data?.message || 'Error al obtener insumos con saldo')
    }
  }

  //Obtener listado de movimiento con filtro de laboratorio, rango de fechas y tipo de movimiento
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

      const response = await api.get(`/inventario/actividad?${params.toString()}`)
      console.log(response.data)
      return response.data
    } catch (error: any) {
      console.error('Error al obtener actividad de insumos:', error)
      throw new Error(error.response?.data?.message || 'Error al obtener actividad de insumos')
    }
  }

  //Generar plantilla excel para reabastecimiento masivo
  async descargarPlantillaExcel(): Promise<{ data: Blob }> {
    try {
      const response = await api.get('/inventario/plantilla-excel', {
        responseType: 'blob'
      })
      return { data: response.data }
    } catch (error: any) {
      console.error('Error al descargar plantilla Excel:', error)
      throw new Error(error.response?.data?.message || 'Error al descargar plantilla Excel')
    }
  }

  //Procesar archivo excel para reabastecimiento masivo
  async procesarArchivoExcel(formData: FormData, laboratorio_id: number
  ): Promise<{
    success: boolean
    message: string
    data: {
      archivo: string
      total_filas: number
      registros_validos: number
      registros_con_errores: number
      datos_validados: DatoValidado[]
      errores: string[]
    }
  }> {
    try {
      const response = await api.post('/inventario/procesar-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        params: {
          laboratorio_id
        }
      })
      return response.data
    } catch (error: any) {
      console.error('Error al procesar archivo Excel:', error)
      throw new Error(error.response?.data?.message || 'Error al procesar archivo Excel')
    }
  }

  //Ejecutar reabastecimiento masivo 
  async ejecutarReabastecimientoMasivo(data: {
    datos_reabastecimiento: Array<{
      insumo_id: number
      cantidad: number
      lote: string | null
      fecha_vencimiento?: string | null
      entrada_detalle_id?: number | null
    }>
    fecha_movimiento: string | null
    motivo_general: string
    laboratorio_id: number
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
      const response = await api.post('/inventario/reabastecimiento-masivo', data)
      return response.data
    } catch (error: any) {
      console.error('Error al ejecutar reabastecimiento masivo:', error)
      throw new Error(error.response?.data?.message || 'Error al ejecutar reabastecimiento masivo')
    }
  }

  //Obtener lotes con saldo disponible por laboratorio e insumo
  async getLotesConSaldo(laboratorioId: number, insumoId?: number): Promise<{
    success: boolean
    data: Array<{
      detalle_id: number
      insumo_id: number
      insumo_nombre: string
      insumo_codigo: string
      unidad_medida: string
      lote: string
      cantidad_original: number
      saldo: number
      fecha_vencimiento: string | null
      fecha_ingreso: string
      dias_para_vencer: number | null
    }>
  }> {
    try {
      const params = new URLSearchParams()
      params.append('laboratorio_id', laboratorioId.toString())
      if (insumoId) params.append('insumo_id', insumoId.toString())

      const response = await api.get(`/inventario/lotes-con-saldo?${params.toString()}`)
      return response.data
    } catch (error: any) {
      console.error('Error al obtener lotes con saldo:', error)
      throw new Error(error.response?.data?.message || 'Error al obtener lotes con saldo')
    }
  }

  // Registrar movimiento manual (entrada o salida)
  async registrarMovimiento(data: {
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
      entrada_detalle_id?: number | null  // Para salidas: ID del lote de entrada a reducir
    }>
  }): Promise<{ success: boolean; message: string; movimiento_id: number }> {
    try {
      console.log('📝 Registrando movimiento manual:', data)
      const response = await api.post('/inventario/movimiento-manual', data)
      return response.data
    } catch (error: any) {
      console.error('Error al registrar movimiento:', error)
      throw new Error(error.response?.data?.message || 'Error al registrar movimiento')
    }
  }
}

export const insumoService = new InsumoService() 