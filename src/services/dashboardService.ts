import { api } from './api'

export interface DashboardStats {
  laboratorios: {
    total: number
    activos: number
  }
  docentes: {
    total: number
    porEscuela: Array<{
      escuela: string
      cantidad: number
    }>
  }
  horarios: {
    total: number
    hoy: number
    estaSemana: number
    porLaboratorio: Array<{
      laboratorio: string
      cantidad: number
    }>
  }
  insumos: {
    total: number
    conStock: number
    sinStock: number
    porLaboratorio: Array<{
      laboratorio: string
      cantidad: number
    }>
  }
}

export const dashboardService = {
  // Obtener estadísticas generales del dashboard
  getStats: async (): Promise<{ success: boolean; data?: DashboardStats; message?: string }> => {
    try {
      console.log('🔍 Cargando estadísticas del dashboard desde endpoint optimizado...')

      const response = await api.get('/dashboard/stats')
      
      if (response.data.success) {
        console.log('✅ Estadísticas cargadas exitosamente:', response.data.data)
        return {
          success: true,
          data: response.data.data
        }
      } else {
        console.error('❌ Error en la respuesta del servidor:', response.data.message)
        return {
          success: false,
          message: response.data.message || 'Error al cargar estadísticas'
        }
      }

    } catch (error: any) {
      console.error('❌ Error de conexión al obtener estadísticas del dashboard:', error)
      
      // Mensaje más específico según el tipo de error
      let message = 'Error al cargar estadísticas del dashboard'
      if (error.response?.status === 401) {
        message = 'Sesión expirada. Por favor, inicia sesión nuevamente.'
      } else if (error.response?.status === 403) {
        message = 'No tienes permisos para ver estas estadísticas.'
      } else if (error.response?.status >= 500) {
        message = 'Error interno del servidor. Intenta nuevamente.'
      } else if (error.code === 'NETWORK_ERROR') {
        message = 'Error de conexión. Verifica tu internet.'
      }

      return {
        success: false,
        message: message
      }
    }
  }
} 