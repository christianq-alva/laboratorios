import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Button,
  Paper
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  Science as ScienceIcon,
  Category as CategoryIcon,
  Business as BusinessIcon,
  GetApp as ExportIcon
} from '@mui/icons-material'
import { BarChart, PieChart, AreaChart, MetricCard } from './Charts'
import FiltrosReporte from './FiltrosReporte'
import {
  reporteService,
  type DashboardEjecutivo as DashboardData,
  type FiltrosReporte as FiltrosType
} from '../../services/reporteService'

const DashboardEjecutivo: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [filtros, setFiltros] = useState<FiltrosType>({})

  useEffect(() => {
    cargarDashboard()
  }, [])

  const cargarDashboard = async (nuevosFiltros?: FiltrosType) => {
    setLoading(true)
    setError(null)
    
    try {
      const filtrosAplicar = nuevosFiltros || filtros
      const response = await reporteService.getDashboardEjecutivo(filtrosAplicar)
      
      if (response.success) {
        setDashboardData(response.data)
      } else {
        setError(response.message || 'Error al cargar el dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos del dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleFiltrosChange = (nuevosFiltros: FiltrosType) => {
    setFiltros(nuevosFiltros)
    cargarDashboard(nuevosFiltros)
  }

  const exportarDashboard = async (formato: 'json' | 'csv') => {
    try {
      await reporteService.exportarReporte('dashboard_ejecutivo', formato, filtros)
    } catch (error) {
      console.error('Error al exportar:', error)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    )
  }

  if (!dashboardData) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No hay datos disponibles para mostrar
      </Alert>
    )
  }

  const { metricas_generales, consumo_por_laboratorio, consumo_por_categoria, tendencia_mensual } = dashboardData

  // Preparar datos para gráficos
  const datosConsumoLab = consumo_por_laboratorio.map(lab => ({
    nombre: lab.laboratorio_nombre.length > 15 
      ? lab.laboratorio_nombre.substring(0, 15) + '...' 
      : lab.laboratorio_nombre,
    total_consumido: lab.total_consumido,
    insumos_diferentes: lab.insumos_diferentes,
    dias_activo: lab.dias_activo
  }))

  const datosConsumoCategoria = consumo_por_categoria.map(cat => ({
    categoria: cat.categoria,
    total_consumido: cat.total_consumido
  }))

  const datosTendencia = tendencia_mensual.map(mes => ({
    periodo: mes.periodo,
    consumo: mes.consumo_mes,
    ingreso: mes.ingreso_mes,
    laboratorios_activos: mes.laboratorios_activos
  })).reverse() // Mostrar cronológicamente

  return (
    <Box>
      <Paper elevation={1} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" component="h1" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
              Dashboard Ejecutivo
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              Análisis de Consumo de Insumos por Laboratorio
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              startIcon={<ExportIcon />}
              onClick={() => exportarDashboard('csv')}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            >
              Exportar CSV
            </Button>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={() => exportarDashboard('json')}
              sx={{ 
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Exportar JSON
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Filtros */}
      <FiltrosReporte
        onFiltrosChange={handleFiltrosChange}
        filtrosIniciales={filtros}
        mostrarTipoPeriodo={false}
        mostrarCategoria={false}
      />

      {/* Métricas principales */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
          <MetricCard
            title="Laboratorios Activos"
            value={metricas_generales.total_laboratorios_activos}
            icon={<BusinessIcon />}
            color="#1976d2"
            subtitle="Con movimientos registrados"
          />
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
          <MetricCard
            title="Total Consumido"
            value={metricas_generales.total_consumo}
            icon={<TrendingUpIcon />}
            color="#d32f2f"
            subtitle="Unidades totales"
            format="number"
          />
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
          <MetricCard
            title="Insumos Utilizados"
            value={metricas_generales.total_insumos_utilizados}
            icon={<ScienceIcon />}
            color="#ed6c02"
            subtitle="Diferentes tipos"
          />
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
          <MetricCard
            title="Categorías Activas"
            value={metricas_generales.total_categorias}
            icon={<CategoryIcon />}
            color="#2e7d32"
            subtitle="Con consumo registrado"
          />
        </Box>
      </Box>

      {/* Gráficos principales */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        {/* Consumo por Laboratorio */}
        <Box sx={{ width: { xs: '100%', lg: 'calc(66.666% - 8px)' } }}>
          <BarChart
            data={datosConsumoLab}
            title="Consumo por Laboratorio"
            xKey="nombre"
            yKey="total_consumido"
            color="#1976d2"
            height={400}
          />
        </Box>

        {/* Consumo por Categoría */}
        <Box sx={{ width: { xs: '100%', lg: 'calc(33.333% - 8px)' } }}>
          <PieChart
            data={datosConsumoCategoria}
            title="Distribución por Categoría"
            nameKey="categoria"
            valueKey="total_consumido"
            height={400}
          />
        </Box>
      </Box>

      {/* Tendencia temporal */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ width: '100%' }}>
          <AreaChart
            data={datosTendencia}
            title="Tendencia de Consumo vs Ingresos (Mensual)"
            xKey="periodo"
            areas={[
              { key: 'consumo', name: 'Consumo', color: '#d32f2f' },
              { key: 'ingreso', name: 'Ingreso', color: '#2e7d32' }
            ]}
            height={350}
            stacked={false}
          />
        </Box>
      </Box>

      {/* Análisis detallado por laboratorio */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
          <BarChart
            data={datosConsumoLab}
            title="Variedad de Insumos por Laboratorio"
            xKey="nombre"
            yKey="insumos_diferentes"
            color="#ed6c02"
            height={300}
          />
        </Box>
        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
          <BarChart
            data={datosConsumoLab}
            title="Días de Actividad por Laboratorio"
            xKey="nombre"
            yKey="dias_activo"
            color="#2e7d32"
            height={300}
          />
        </Box>
      </Box>

      {/* Información adicional */}
      <Box mt={4}>
        <Typography variant="body2" color="text.secondary" align="center">
          Dashboard generado el {new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Typography>
      </Box>
    </Box>
  )
}

export default DashboardEjecutivo
