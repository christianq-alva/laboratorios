import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Avatar,
  Chip,
  LinearProgress
} from '@mui/material'
import {
  GetApp as ExportIcon,
  Star as StarIcon,
  Science as ScienceIcon
} from '@mui/icons-material'
import { BarChart, PieChart } from './Charts'
import FiltrosReporte from './FiltrosReporte'
import {
  reporteService,
  type TopInsumo,
  type FiltrosReporte as FiltrosType,
  formatearNumero,
  formatearFecha
} from '../../services/reporteService'

const TopInsumos: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [topInsumos, setTopInsumos] = useState<TopInsumo[]>([])
  const [filtros, setFiltros] = useState<FiltrosType>({ limite: 20 })

  useEffect(() => {
    cargarTopInsumos()
  }, [])

  const cargarTopInsumos = async (nuevosFiltros?: FiltrosType) => {
    setLoading(true)
    setError(null)
    
    try {
      const filtrosAplicar = nuevosFiltros || filtros
      const response = await reporteService.getTopInsumos(filtrosAplicar)
      
      if (response.success) {
        setTopInsumos(response.data)
      } else {
        setError(response.message || 'Error al cargar el top de insumos')
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos de top insumos')
    } finally {
      setLoading(false)
    }
  }

  const handleFiltrosChange = (nuevosFiltros: FiltrosType) => {
    setFiltros(nuevosFiltros)
    cargarTopInsumos(nuevosFiltros)
  }

  const exportarReporte = async (formato: 'json' | 'csv') => {
    try {
      await reporteService.exportarReporte('top_insumos', formato, filtros)
    } catch (error) {
      console.error('Error al exportar:', error)
    }
  }

  // Preparar datos para gráficos
  const prepararDatosGraficos = () => {
    if (!topInsumos.length) return { porConsumo: [], porCategoria: [] }

    // Top 10 para gráfico de barras
    const top10 = topInsumos.slice(0, 10).map(insumo => ({
      nombre: insumo.insumo_nombre.length > 20 
        ? insumo.insumo_nombre.substring(0, 20) + '...'
        : insumo.insumo_nombre,
      total_consumido: insumo.total_consumido,
      laboratorios_usuarios: insumo.laboratorios_usuarios
    }))

    // Agrupar por categoría
    const porCategoria = topInsumos.reduce((acc: any, insumo) => {
      if (!acc[insumo.categoria]) {
        acc[insumo.categoria] = { categoria: insumo.categoria, total_consumido: 0, count: 0 }
      }
      acc[insumo.categoria].total_consumido += insumo.total_consumido
      acc[insumo.categoria].count += 1
      return acc
    }, {})

    return {
      porConsumo: top10,
      porCategoria: Object.values(porCategoria)
    }
  }

  const datosGraficos = prepararDatosGraficos()
  const maxConsumo = topInsumos.length > 0 ? topInsumos[0].total_consumido : 1

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

  return (
    <Box>
      <Paper elevation={1} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #ffa726 0%, #ff7043 100%)' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" component="h1" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
              Top Insumos Más Consumidos
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              Ranking de insumos con mayor demanda
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              startIcon={<ExportIcon />}
              onClick={() => exportarReporte('csv')}
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
              onClick={() => exportarReporte('json')}
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
        mostrarCategoria={true}
        mostrarLimite={true}
      />

      {/* Gráficos de resumen */}
      {topInsumos.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          {/* Top 10 insumos */}
          <Box sx={{ width: { xs: '100%', lg: 'calc(66.666% - 8px)' } }}>
            <BarChart
              data={datosGraficos.porConsumo}
              title="Top 10 Insumos Más Consumidos"
              xKey="nombre"
              yKey="total_consumido"
              color="#ff7043"
              height={400}
            />
          </Box>

          {/* Distribución por categoría */}
          <Box sx={{ width: { xs: '100%', lg: 'calc(33.333% - 8px)' } }}>
            <PieChart
              data={datosGraficos.porCategoria}
              title="Consumo por Categoría"
              nameKey="categoria"
              valueKey="total_consumido"
              height={400}
            />
          </Box>
        </Box>
      )}

      {/* Tarjetas de top 3 */}
      {topInsumos.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          {topInsumos.slice(0, 3).map((insumo, index) => (
            <Box sx={{ width: { xs: '100%', md: 'calc(33.333% - 16px)' } }} key={insumo.insumo_id}>
              <Card 
                elevation={3} 
                sx={{ 
                  background: index === 0 ? 'linear-gradient(135deg, #ffd700 0%, #ffb300 100%)' :
                             index === 1 ? 'linear-gradient(135deg, #c0c0c0 0%, #9e9e9e 100%)' :
                             'linear-gradient(135deg, #cd7f32 0%, #8d5524 100%)',
                  color: 'white',
                  position: 'relative',
                  overflow: 'visible'
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: -15,
                    right: 15,
                    zIndex: 1
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: index === 0 ? '#ff8f00' : 
                               index === 1 ? '#757575' : '#5d4037',
                      width: 40,
                      height: 40,
                      fontSize: '1.2rem',
                      fontWeight: 700
                    }}
                  >
                    {index + 1}
                  </Avatar>
                </Box>
                <CardContent sx={{ pt: 3 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <ScienceIcon sx={{ mr: 1, fontSize: '2rem' }} />
                    <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                      {insumo.insumo_nombre}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                    Código: {insumo.insumo_codigo}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    {formatearNumero(insumo.total_consumido)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                    {insumo.unidad_medida} consumidas
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip
                      size="small"
                      label={`${insumo.laboratorios_usuarios} laboratorios`}
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                    />
                    <Chip
                      size="small"
                      label={insumo.categoria}
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {/* Tabla completa */}
      <Paper elevation={2}>
        <Box p={2}>
          <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            Ranking Completo de Insumos
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Lista completa ordenada por cantidad total consumida
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 600 }}>Ranking</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Insumo</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Código</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Categoría</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Total Consumido</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Promedio/Mov.</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Laboratorios</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Días Activo</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Último Consumo</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Popularidad</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topInsumos.map((insumo, index) => (
                <TableRow key={insumo.insumo_id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      {index < 3 && (
                        <StarIcon 
                          sx={{ 
                            color: index === 0 ? '#ffd700' : 
                                   index === 1 ? '#c0c0c0' : '#cd7f32',
                            mr: 1
                          }} 
                        />
                      )}
                      <Typography fontWeight={index < 3 ? 700 : 400}>
                        #{index + 1}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={600}>
                      {insumo.insumo_nombre}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {insumo.insumo_codigo}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={insumo.categoria} 
                      size="small" 
                      variant="outlined"
                      color="primary"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography 
                      fontWeight={600}
                      color={index < 3 ? 'error.main' : 'text.primary'}
                    >
                      {formatearNumero(insumo.total_consumido)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {insumo.unidad_medida}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatearNumero(insumo.promedio_por_movimiento)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={insumo.laboratorios_usuarios}
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {insumo.dias_consumo}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatearFecha(insumo.ultimo_consumo)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ width: '100%', maxWidth: 100 }}>
                      <LinearProgress
                        variant="determinate"
                        value={(insumo.total_consumido / maxConsumo) * 100}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: '#e0e0e0',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: index < 3 ? '#ff7043' : '#1976d2',
                            borderRadius: 4
                          }
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {Math.round((insumo.total_consumido / maxConsumo) * 100)}%
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Información adicional */}
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
    </Box>
  )
}

export default TopInsumos
