import { api } from './api'

// Interfaces para los datos de reportes
export interface ConsumoResumen {
  periodo: string
  laboratorio_id: number
  laboratorio_nombre: string
  escuela_id: number
  categoria: string
  insumo_nombre: string
  unidad_medida: string
  total_consumido: number
  total_ingresado: number
  num_movimientos_salida: number
  num_movimientos_entrada: number
}

export interface MetricasGenerales {
  total_laboratorios_activos: number
  total_categorias: number
  total_insumos_utilizados: number
  total_consumo: number
  total_ingresos: number
  dias_actividad: number
}

export interface ConsumoPorLaboratorio {
  laboratorio_id: number
  laboratorio_nombre: string
  escuela_id: number
  total_consumido: number
  insumos_diferentes: number
  dias_activo: number
}

export interface ConsumoPorCategoria {
  categoria: string
  total_consumido: number
  insumos_diferentes: number
  laboratorios_usuarios: number
}

export interface TendenciaMensual {
  periodo: string
  consumo_mes: number
  ingreso_mes: number
  laboratorios_activos: number
}

export interface DashboardEjecutivo {
  metricas_generales: MetricasGenerales
  consumo_por_laboratorio: ConsumoPorLaboratorio[]
  consumo_por_categoria: ConsumoPorCategoria[]
  tendencia_mensual: TendenciaMensual[]
}

export interface TopInsumo {
  insumo_id: number
  insumo_codigo: string
  insumo_nombre: string
  categoria: string
  unidad_medida: string
  total_consumido: number
  laboratorios_usuarios: number
  dias_consumo: number
  promedio_por_movimiento: number
  ultimo_consumo: string
}

export interface AnalisisEficiencia {
  laboratorio_id: number
  laboratorio_nombre: string
  escuela_id: number
  variedad_insumos: number
  total_consumo: number
  total_reabastecimiento: number
  dias_actividad: number
  dias_consumo: number
  consumo_promedio_diario: number
  porcentaje_utilizacion: number
}

export interface FiltrosReporte {
  tipo_periodo?: 'mensual' | 'anual'
  fecha_inicio?: string
  fecha_fin?: string
  laboratorio_id?: number
  escuela_id?: string
  categoria_insumo?: string
  limite?: number
}

export interface ReporteResponse<T> {
  data: T
  filtros?: any
  total_registros?: number
  message?: string
}

// Servicio de Reportes
export const reporteService = {
  // Obtener resumen de consumo mensual/anual
  getConsumoResumen: async (filtros: FiltrosReporte): Promise<ReporteResponse<ConsumoResumen[]>> => {
    const params = new URLSearchParams()
    
    if (filtros.tipo_periodo) params.append('tipo_periodo', filtros.tipo_periodo)
    if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio)
    if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin)
    if (filtros.laboratorio_id) params.append('laboratorio_id', filtros.laboratorio_id.toString())
    if (filtros.escuela_id) params.append('escuela_id', filtros.escuela_id)
    if (filtros.categoria_insumo) params.append('categoria_insumo', filtros.categoria_insumo)

    const response = await api.get(`/reportes/consumo-resumen?${params.toString()}`)
    return response.data
  },

  // Obtener dashboard ejecutivo
  getDashboardEjecutivo: async (filtros: FiltrosReporte): Promise<ReporteResponse<DashboardEjecutivo>> => {
    const params = new URLSearchParams()
    
    if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio)
    if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin)
    if (filtros.laboratorio_id) params.append('laboratorio_id', filtros.laboratorio_id.toString())
    if (filtros.escuela_id) params.append('escuela_id', filtros.escuela_id)

    const response = await api.get(`/reportes/dashboard-ejecutivo?${params.toString()}`)
    return response.data
  },

  // Obtener top insumos más consumidos
  getTopInsumos: async (filtros: FiltrosReporte): Promise<ReporteResponse<TopInsumo[]>> => {
    const params = new URLSearchParams()
    
    if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio)
    if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin)
    if (filtros.laboratorio_id) params.append('laboratorio_id', filtros.laboratorio_id.toString())
    if (filtros.escuela_id) params.append('escuela_id', filtros.escuela_id)
    if (filtros.limite) params.append('limite', filtros.limite.toString())

    const response = await api.get(`/reportes/top-insumos?${params.toString()}`)
    return response.data
  },

  // Obtener análisis de eficiencia
  getAnalisisEficiencia: async (filtros: FiltrosReporte): Promise<ReporteResponse<AnalisisEficiencia[]>> => {
    const params = new URLSearchParams()
    
    if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio)
    if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin)
    if (filtros.escuela_id) params.append('escuela_id', filtros.escuela_id)

    const response = await api.get(`/reportes/analisis-eficiencia?${params.toString()}`)
    return response.data
  },

  // Exportar reportes
  exportarReporte: async (
    tipoReporte: 'consumo_detallado' | 'dashboard_ejecutivo' | 'top_insumos' | 'eficiencia',
    formato: 'json' | 'csv',
    filtros: FiltrosReporte
  ): Promise<any> => {
    const params = new URLSearchParams()
    
    params.append('tipo_reporte', tipoReporte)
    params.append('formato', formato)
    
    if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio)
    if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin)
    if (filtros.laboratorio_id) params.append('laboratorio_id', filtros.laboratorio_id.toString())
    if (filtros.escuela_id) params.append('escuela_id', filtros.escuela_id)
    if (filtros.categoria_insumo) params.append('categoria_insumo', filtros.categoria_insumo)

    if (formato === 'csv') {
      // Para CSV, necesitamos manejar la descarga como blob
      const response = await api.get(`/reportes/exportar?${params.toString()}`, {
        responseType: 'blob'
      })
      
      // Crear URL del blob y descargar
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `reporte_${tipoReporte}_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      return { success: true, message: 'Archivo descargado exitosamente' }
    } else {
      const response = await api.get(`/reportes/exportar?${params.toString()}`)
      return response.data
    }
  }
}

// Funciones auxiliares para formateo de datos
export const formatearFecha = (fecha: string): string => {
  const date = new Date(fecha)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export const formatearNumero = (numero: number): string => {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(numero)
}

export const formatearMoneda = (cantidad: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'PEN'
  }).format(cantidad)
}

export const formatearPorcentaje = (porcentaje: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(porcentaje / 100)
}

// Función para obtener colores para gráficos
export const obtenerColoresGrafico = (cantidad: number): string[] => {
  const colores = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
    '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
    '#c49c94', '#f7b6d3', '#c7c7c7', '#dbdb8d', '#9edae5'
  ]
  
  return colores.slice(0, cantidad)
}

// Función para generar datos de ejemplo (para testing)
export const generarDatosEjemplo = () => {
  const laboratorios = ['Lab. Química', 'Lab. Física', 'Lab. Biología', 'Lab. Informática']
  const categorias = ['Reactivos', 'Materiales', 'Equipos', 'Consumibles']
  const meses = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06']
  
  return {
    consumoResumen: meses.flatMap((mes) =>
      laboratorios.flatMap((lab, labIndex) =>
        categorias.map((cat) => ({
          periodo: mes,
          laboratorio_id: labIndex + 1,
          laboratorio_nombre: lab,
          escuela_id: 1,
          categoria: cat,
          insumo_nombre: `Insumo ${cat} ${labIndex + 1}`,
          unidad_medida: 'unidad',
          total_consumido: Math.floor(Math.random() * 100) + 10,
          total_ingresado: Math.floor(Math.random() * 200) + 50,
          num_movimientos_salida: Math.floor(Math.random() * 20) + 1,
          num_movimientos_entrada: Math.floor(Math.random() * 10) + 1
        }))
      )
    ),
    dashboardEjecutivo: {
      metricas_generales: {
        total_laboratorios_activos: 4,
        total_categorias: 4,
        total_insumos_utilizados: 85,
        total_consumo: 2450,
        total_ingresos: 3200,
        dias_actividad: 180
      },
      consumo_por_laboratorio: laboratorios.map((lab, index) => ({
        laboratorio_id: index + 1,
        laboratorio_nombre: lab,
        escuela_id: 1,
        total_consumido: Math.floor(Math.random() * 500) + 200,
        insumos_diferentes: Math.floor(Math.random() * 20) + 10,
        dias_activo: Math.floor(Math.random() * 30) + 150
      })),
      consumo_por_categoria: categorias.map(cat => ({
        categoria: cat,
        total_consumido: Math.floor(Math.random() * 600) + 100,
        insumos_diferentes: Math.floor(Math.random() * 15) + 5,
        laboratorios_usuarios: Math.floor(Math.random() * 4) + 1
      })),
      tendencia_mensual: meses.map(mes => ({
        periodo: mes,
        consumo_mes: Math.floor(Math.random() * 400) + 200,
        ingreso_mes: Math.floor(Math.random() * 500) + 250,
        laboratorios_activos: Math.floor(Math.random() * 4) + 1
      }))
    }
  }
}
