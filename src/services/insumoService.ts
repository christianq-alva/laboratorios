import { api } from './api'
import type { ApiMessageResponse, ApiCreateUpdateResponse, ApiDataResponse } from './types'

export interface Insumo {
  id: number
  codigo: string
  nombre: string
  descripcion: string
  unidad_id: number
  unidad_simbolo?: string
  unidad_nombre?: string
  categoria: 'Reactivos' | 'Materiales' | 'Material_Biologico' | 'Farmacos'
  presentacion: string
}

export const insumoService = {
  //Crear nuevo insumo
  create: async (insumoData: {
    nombre: string
    descripcion: string
    unidad_id: number
    categoria: 'Reactivos' | 'Materiales' | 'Material_Biologico' | 'Farmacos'
    presentacion?: string
  }): Promise<ApiCreateUpdateResponse<{ id: number }>> => {
    const response = await api.post('/insumos', insumoData)
    return response.data
  },

  //Actualizar insumo
  update: async (id: number, insumoData: {
    nombre: string
    descripcion: string
    unidad_id: number
    categoria: 'Reactivos' | 'Materiales' | 'Material_Biologico' | 'Farmacos'
    presentacion?: string
  }): Promise<ApiCreateUpdateResponse<Insumo>> => {
    const response = await api.put(`/insumos/${id}`, insumoData)
    return response.data
  },

  //Eliminar insumo
  delete: async (id: number): Promise<ApiMessageResponse> => {
    const response = await api.delete(`/insumos/${id}`)
    return response.data
  },

  //Obtener listado de insumos 
  getAllInsumos: async (): Promise<ApiDataResponse<Insumo[]>> => {
    const response = await api.get('/insumos/list')
    return response.data
  },

  //Generar plantilla Excel para importación masiva de insumos
  descargarPlantillaImportacion: async (): Promise<void> => {
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
      throw new Error(error.response?.data?.message || 'Error al descargar la plantilla')
    }
  },

  //Procesar archivo Excel para importación masiva de insumos
  previsualizarImportacion: async (archivo: File): Promise<{
    success: boolean
    data: Array<{
      fila: number
      nombre: string
      descripcion: string
      unidad_simbolo: string
      unidad_nombre: string
      categoria: string
      presentacion: string
      errores: string[]
    }>
    total_filas: number
    errores_generales: string[]
  }> => {
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
      throw new Error(error.response?.data?.message || 'Error al previsualizar el archivo')
    }
  },

  //Ejecutar importación masiva de insumos
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
      categoria: string
      stock: string
    }>
  }> => {
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
      throw new Error(error.response?.data?.message || 'Error en la importación masiva')
    }
  },
} 