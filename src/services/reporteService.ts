import { api } from './api'

export interface RequeridoVsConsumido {
  laboratorio_id: number
  laboratorio_nombre: string
  escuela_id: number
  escuela_nombre: string
  insumo_id: number
  insumo_nombre: string
  unidad_simbolo: string
  unidad_nombre: string
  cantidad_requerida: number
  cantidad_consumida: number
}

export interface StockVsRequerido {
  laboratorio_id: number
  laboratorio_nombre: string
  insumo_id: number
  insumo_nombre: string
  unidad_simbolo: string
  unidad_nombre: string
  stock_actual: number
  cantidad_requerida: number
}

export interface FiltrosComparacion {
  laboratorio_id?: number
  escuela_id?: number
  fecha_inicio?: string
  fecha_fin?: string
}

export interface ReporteResponse<T> {
  data: T,
  success: boolean,
  filtros?: any
  total_registros?: number
  message?: string
}

// Servicio de Reportes
export const reporteService = {
  
  // Obtener comparación de requerido vs consumido
  getRequeridoVsConsumido: async (filtros: FiltrosComparacion): Promise<ReporteResponse<RequeridoVsConsumido[]>> => {
    const params = new URLSearchParams()
    
    if (filtros.laboratorio_id) params.append('laboratorio_id', filtros.laboratorio_id.toString())
    if (filtros.escuela_id) params.append('escuela_id', filtros.escuela_id.toString())
    if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio)
    if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin)

    const response = await api.get(`/reportes/requerido-vs-consumido?${params.toString()}`)
    return response.data
  },

  // Obtener comparación de stock vs requerido
  getStockVsRequerido: async (filtros: FiltrosComparacion): Promise<ReporteResponse<StockVsRequerido[]>> => {
    const params = new URLSearchParams()
    
    if (filtros.laboratorio_id) params.append('laboratorio_id', filtros.laboratorio_id.toString())
    if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio)
    if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin)

    const response = await api.get(`/reportes/stock-vs-requerido?${params.toString()}`)
    return response.data
  }
}