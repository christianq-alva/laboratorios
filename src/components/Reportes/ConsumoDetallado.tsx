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
  TablePagination,
  Chip
} from '@mui/material'
import {
  GetApp as ExportIcon,
} from '@mui/icons-material'
import { BarChart, LineChart } from './Charts'
import FiltrosReporte from './FiltrosReporte'
import {
  reporteService,
  type ConsumoResumen,
  type FiltrosReporte as FiltrosType,
  formatearNumero
} from '../../services/reporteService'

const ConsumoDetallado: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [consumoData, setConsumoData] = useState<ConsumoResumen[]>([])
  const [filtros, setFiltros] = useState<FiltrosType>({ tipo_periodo: 'mensual' })
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    cargarConsumo()
  }, [])

  const cargarConsumo = async (nuevosFiltros?: FiltrosType) => {
    setLoading(true)
    setError(null)
    
    try {
      const filtrosAplicar = nuevosFiltros || filtros
      const response = await reporteService.getConsumoResumen(filtrosAplicar)
      
      if (response.success) {
        setConsumoData(response.data)
      } else {
        setError(response.message || 'Error al cargar el reporte de consumo')
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos de consumo')
    } finally {
      setLoading(false)
    }
  }

  const handleFiltrosChange = (nuevosFiltros: FiltrosType) => {
    setFiltros(nuevosFiltros)
    setPage(0) // Reset pagination
    cargarConsumo(nuevosFiltros)
  }

  const exportarReporte = async (formato: 'json' | 'csv') => {
    try {
      await reporteService.exportarReporte('consumo_detallado', formato, filtros)
    } catch (error) {
      console.error('Error al exportar:', error)
    }
  }

  // Preparar datos para gráficos
  const prepararDatosGraficos = () => {
    if (!consumoData.length) return { porPeriodo: [], porLaboratorio: [], porCategoria: [] }

    // Agrupar por período
    const consumoPorPeriodo = consumoData.reduce((acc: any, item) => {
      const key = item.periodo
      if (!acc[key]) {
        acc[key] = { periodo: key, total_consumido: 0, total_ingresado: 0 }
      }
      acc[key].total_consumido += item.total_consumido
      acc[key].total_ingresado += item.total_ingresado
      return acc
    }, {})

    // Agrupar por laboratorio
    const consumoPorLab = consumoData.reduce((acc: any, item) => {
      const key = item.laboratorio_nombre
      if (!acc[key]) {
        acc[key] = { nombre: key, total_consumido: 0 }
      }
      acc[key].total_consumido += item.total_consumido
      return acc
    }, {})

    // Agrupar por categoría
    const consumoPorCat = consumoData.reduce((acc: any, item) => {
      const key = item.categoria
      if (!acc[key]) {
        acc[key] = { categoria: key, total_consumido: 0 }
      }
      acc[key].total_consumido += item.total_consumido
      return acc
    }, {})

    return {
      porPeriodo: Object.values(consumoPorPeriodo).sort((a: any, b: any) => 
        a.periodo.localeCompare(b.periodo)
      ),
      porLaboratorio: Object.values(consumoPorLab).sort((a: any, b: any) => 
        b.total_consumido - a.total_consumido
      ).slice(0, 10), // Top 10
      porCategoria: Object.values(consumoPorCat).sort((a: any, b: any) => 
        b.total_consumido - a.total_consumido
      )
    }
  }

  const datosGraficos = prepararDatosGraficos()

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
      <Paper elevation={1} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" component="h1" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
              Consumo Detallado
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              Análisis detallado de consumo de insumos por período
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
        mostrarTipoPeriodo={true}
        mostrarCategoria={true}
      />

      {/* Gráficos de resumen */}
      {consumoData.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          {/* Tendencia por período */}
          <Box sx={{ width: { xs: '100%', lg: 'calc(66.666% - 8px)' } }}>
            <LineChart
              data={datosGraficos.porPeriodo}
              title={`Tendencia de Consumo ${filtros.tipo_periodo === 'anual' ? 'Anual' : 'Mensual'}`}
              xKey="periodo"
              lines={[
                { key: 'total_consumido', name: 'Consumido', color: '#d32f2f' },
                { key: 'total_ingresado', name: 'Ingresado', color: '#2e7d32' }
              ]}
              height={350}
            />
          </Box>

          {/* Top laboratorios */}
          <Box sx={{ width: { xs: '100%', lg: 'calc(33.333% - 8px)' } }}>
            <BarChart
              data={datosGraficos.porLaboratorio}
              title="Top Laboratorios"
              xKey="nombre"
              yKey="total_consumido"
              color="#1976d2"
              height={350}
            />
          </Box>
        </Box>
      )}

      {/* Consumo por categoría */}
      {datosGraficos.porCategoria.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          <Box sx={{ width: '100%' }}>
            <BarChart
              data={datosGraficos.porCategoria}
              title="Consumo por Categoría de Insumo"
              xKey="categoria"
              yKey="total_consumido"
              color="#ed6c02"
              height={300}
            />
          </Box>
        </Box>
      )}

      {/* Tabla detallada */}
      <Paper elevation={2}>
        <Box p={2}>
          <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            Detalle de Consumo
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Registro detallado de todos los movimientos de insumos
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 600 }}>Período</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Laboratorio</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Insumo</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Categoría</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Unidad</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Consumido</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Ingresado</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Movimientos</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {consumoData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{row.periodo}</TableCell>
                    <TableCell>{row.laboratorio_nombre}</TableCell>
                    <TableCell>{row.insumo_nombre}</TableCell>
                    <TableCell>
                      <Chip 
                        label={row.categoria} 
                        size="small" 
                        variant="outlined"
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>{row.unidad_medida}</TableCell>
                    <TableCell align="right">
                      <Typography 
                        color={row.total_consumido > 0 ? 'error' : 'text.secondary'}
                        fontWeight={row.total_consumido > 0 ? 600 : 400}
                      >
                        {formatearNumero(row.total_consumido)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        color={row.total_ingresado > 0 ? 'success.main' : 'text.secondary'}
                        fontWeight={row.total_ingresado > 0 ? 600 : 400}
                      >
                        {formatearNumero(row.total_ingresado)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={0.5} justifyContent="center">
                        {row.num_movimientos_salida > 0 && (
                          <Chip 
                            label={`${row.num_movimientos_salida} salidas`}
                            size="small"
                            color="error"
                            variant="outlined"
                          />
                        )}
                        {row.num_movimientos_entrada > 0 && (
                          <Chip 
                            label={`${row.num_movimientos_entrada} entradas`}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={consumoData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10))
            setPage(0)
          }}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
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

export default ConsumoDetallado
