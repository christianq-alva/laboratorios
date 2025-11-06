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
  getStats: async (): Promise<{ success: boolean; data: DashboardStats; message?: string }> => {
    const response = await api.get('/dashboard/stats')
    return response.data
  }
} 