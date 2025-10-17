import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'

import { 
  reporteService,
  formatearNumero 
} from '../services/reporteService'
import type { 
  DashboardEjecutivo, 
  TopInsumo, 
  FiltrosReporte
} from '../services/reporteService'

interface ReporteData {
  metricas_generales?: {
    total_laboratorios_activos: number
    total_categorias: number
    total_insumos_utilizados: number
    total_consumo: number
    total_ingresos: number
    dias_actividad: number
  }
  consumo_por_laboratorio?: Array<{
    laboratorio_nombre: string
    total_consumido: number
    insumos_diferentes: number
  }>
  consumo_por_categoria?: Array<{
    categoria: string
    total_consumido: number
  }>
  tendencia_mensual?: Array<{
    mes: string
    consumo: number
    ingresos: number
  }>
  top_insumos?: Array<{
    nombre: string
    consumo: number
    categoria: string
  }>
}

const ReportesSimple: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ReporteData | null>(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Cargando datos de reportes desde la base de datos...')
      
      // Filtros por defecto - últimos 6 meses
      const fechaFin = new Date().toISOString().split('T')[0]
      const fechaInicio = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      const filtros: FiltrosReporte = {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        limite: 5
      }

      // Cargar datos en paralelo
      const [dashboardResponse, topInsumosResponse] = await Promise.all([
        reporteService.getDashboardEjecutivo(filtros),
        reporteService.getTopInsumos(filtros)
      ])

      console.log('📊 Dashboard response:', dashboardResponse)
      console.log('🏆 Top insumos response:', topInsumosResponse)

      if (!dashboardResponse.success) {
        throw new Error(dashboardResponse.message || 'Error al cargar dashboard')
      }

      if (!topInsumosResponse.success) {
        throw new Error(topInsumosResponse.message || 'Error al cargar top insumos')
      }

      const dashboardData: DashboardEjecutivo = dashboardResponse.data
      const topInsumos: TopInsumo[] = topInsumosResponse.data

      // Ya no necesitamos transformar tendencia mensual

      // Transformar top insumos para el gráfico
      const top_insumos = topInsumos.map(item => ({
        nombre: item.insumo_nombre,
        consumo: item.total_consumido,
        categoria: item.categoria
      }))

      const reporteData: ReporteData = {
        metricas_generales: dashboardData.metricas_generales,
        consumo_por_laboratorio: dashboardData.consumo_por_laboratorio,
        consumo_por_categoria: dashboardData.consumo_por_categoria,
        tendencia_mensual: [], // Ya no se usa
        top_insumos
      }
      
      console.log('✅ Datos cargados exitosamente:', reporteData)
      setData(reporteData)
      
    } catch (err: any) {
      console.error('❌ Error al cargar datos de reportes:', err)
      setError(err.message || 'Error al cargar datos de reportes')
      
      // En caso de error, mostrar datos de fallback
      const fallbackData: ReporteData = {
        metricas_generales: {
          total_laboratorios_activos: 0,
          total_categorias: 0,
          total_insumos_utilizados: 0,
          total_consumo: 0,
          total_ingresos: 0,
          dias_actividad: 0
        },
        consumo_por_laboratorio: [],
        consumo_por_categoria: [],
        tendencia_mensual: [],
        top_insumos: []
      }
      setData(fallbackData)
    } finally {
      setLoading(false)
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

  const metricas = data?.metricas_generales

  return (
    <Box>
      {/* Encabezado */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
            Reportes
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Análisis de consumo de insumos por laboratorio
          </Typography>
        </Box>
      </Box>

      <Container maxWidth="xl" sx={{ px: 0 }}>

      {/* Métricas principales */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Card elevation={2} sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <DashboardIcon sx={{ fontSize: 40, color: '#1976d2', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2' }}>
              {metricas?.total_laboratorios_activos || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Laboratorios Activos
            </Typography>
          </CardContent>
        </Card>
        
        <Card elevation={2} sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <TrendingUpIcon sx={{ fontSize: 40, color: '#d32f2f', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#d32f2f' }}>
              {formatearNumero(metricas?.total_consumo || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Consumido
            </Typography>
          </CardContent>
        </Card>
        
        <Card elevation={2} sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <TimelineIcon sx={{ fontSize: 40, color: '#ed6c02', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#ed6c02' }}>
              {metricas?.total_insumos_utilizados || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Insumos Utilizados
            </Typography>
          </CardContent>
        </Card>
        
        <Card elevation={2} sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <AssessmentIcon sx={{ fontSize: 40, color: '#2e7d32', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#2e7d32' }}>
              {metricas?.total_categorias || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Categorías Activas
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Gráficos de análisis */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        📊 Análisis de Consumo
      </Typography>

      {/* Gráfico de barras - Consumo por laboratorio */}
      <Card elevation={2} sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
            Consumo por Laboratorio
          </Typography>
          <Box sx={{ width: '100%', height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.consumo_por_laboratorio || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="laboratorio_nombre" 
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => [formatearNumero(value as number), 'Unidades Consumidas']}
                  labelStyle={{ color: '#333' }}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="total_consumido" 
                  fill="#1976d2" 
                  radius={[4, 4, 0, 0]}
                  name="Total Consumido"
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Gráfico de barras - Top insumos (versión simplificada) */}
      <Card elevation={2} sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
            Top 5 Insumos Más Consumidos
          </Typography>
          <Box sx={{ width: '100%', height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.top_insumos || []} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="nombre" 
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => [formatearNumero(value as number), 'Unidades']}
                  labelFormatter={(label) => `Insumo: ${label}`}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="consumo" 
                  fill="#ff7f0e" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Gráfico de barras - Comparación de Insumos Consumidos */}
      <Card elevation={2} sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
            Comparación de Insumos Más Consumidos
          </Typography>
          <Box sx={{ width: '100%', height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.top_insumos || []} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="nombre" 
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => [formatearNumero(value as number), 'Unidades Consumidas']}
                  labelFormatter={(label) => `Insumo: ${label}`}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="consumo" 
                  name="Unidades Consumidas"
                  radius={[4, 4, 0, 0]}
                >
                  {(data?.top_insumos || []).map((_, index) => {
                    const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2']
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Consumo por laboratorio */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Card elevation={2} sx={{ flex: '1 1 400px', minWidth: 400 }}>
          <CardContent>
            <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
              Consumo por Laboratorio
            </Typography>
            {data?.consumo_por_laboratorio?.map((lab, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {lab.laboratorio_nombre}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total consumido: {lab.total_consumido} unidades
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Insumos diferentes: {lab.insumos_diferentes}
                </Typography>
              </Box>
            ))}
          </CardContent>
        </Card>

        <Card elevation={2} sx={{ flex: '1 1 400px', minWidth: 400 }}>
          <CardContent>
            <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
              Consumo por Categoría
            </Typography>
            {data?.consumo_por_categoria?.map((cat, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {cat.categoria}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total consumido: {cat.total_consumido} unidades
                </Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Box>

      {/* Información adicional */}
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            Información del Reporte
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Este reporte muestra el consumo de insumos en tiempo real basado en los movimientos registrados en el sistema.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Datos del período actual:
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              Días de actividad: {metricas?.dias_actividad || 0}
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Total de ingresos: {metricas?.total_ingresos || 0} unidades
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Laboratorios con actividad: {metricas?.total_laboratorios_activos || 0}
            </Typography>
          </Box>
          
          <Box mt={3}>
            <Button 
              variant="contained" 
              onClick={cargarDatos}
              sx={{ mr: 2 }}
            >
              Actualizar Datos
            </Button>
            <Button 
              variant="outlined"
              onClick={() => window.print()}
            >
              Imprimir Reporte
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Footer */}
      <Box mt={4}>
        <Typography variant="body2" color="text.secondary" align="center">
          Reporte generado el {new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Typography>
      </Box>
      </Container>
    </Box>
  )
}

export default ReportesSimple
