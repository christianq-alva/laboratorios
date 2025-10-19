import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid,
  Button,
  TablePagination,
  Tooltip
} from '@mui/material'
import {
  Warning,
  Error as ErrorIcon,
  NotificationImportant,
  Refresh,
  FileDownload,
  Inventory
} from '@mui/icons-material'
import { insumoService } from '../../services/insumoService'
import { laboratorioService } from '../../services/laboratorioService'

interface Laboratorio {
  id: number
  nombre: string
}

interface InsumoStockBajo {
  insumo_id: number
  insumo_codigo: string
  insumo_nombre: string
  categoria: string
  unidad_medida: string
  laboratorio_id: number
  laboratorio_nombre: string
  stock_actual: number
  stock_minimo: number
  punto_reorden: number | null
  diferencia_minimo: number
  porcentaje_stock_minimo: number | null
  estado_stock: 'AGOTADO' | 'BAJO' | 'REORDENAR'
  observaciones: string | null
  ultima_actualizacion: string | null
}

interface Estadisticas {
  total_alertas: number
  agotados: number
  bajo_stock: number
  reordenar: number
  laboratorios_afectados: number
}

export const ReporteStockBajo: React.FC = () => {
  const [insumos, setInsumos] = useState<InsumoStockBajo[]>([])
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [laboratorioSeleccionado, setLaboratorioSeleccionado] = useState<number | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Cargar laboratorios al montar
  useEffect(() => {
    loadLaboratorios()
  }, [])

  // Cargar reporte inicial
  useEffect(() => {
    loadReporte()
  }, [laboratorioSeleccionado])

  const loadLaboratorios = async () => {
    try {
      const response = await laboratorioService.getAll()
      if (response.success && response.data) {
        setLaboratorios(response.data)
      }
    } catch (error) {
      console.error('Error al cargar laboratorios:', error)
    }
  }

  const loadReporte = async () => {
    setLoading(true)
    setError(null)
    try {
      const labId = laboratorioSeleccionado === '' ? undefined : laboratorioSeleccionado
      const response = await insumoService.getInsumosStockBajo(labId)
      
      if (response.success) {
        setInsumos(response.data)
        setEstadisticas(response.estadisticas)
      }
    } catch (error: any) {
      setError(error.message || 'Error al cargar el reporte')
      console.error('Error al cargar reporte:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'AGOTADO':
        return 'error'
      case 'BAJO':
        return 'warning'
      case 'REORDENAR':
        return 'info'
      default:
        return 'default'
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'AGOTADO':
        return <ErrorIcon />
      case 'BAJO':
        return <Warning />
      case 'REORDENAR':
        return <NotificationImportant />
      default:
        return undefined
    }
  }

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'AGOTADO':
        return 'Agotado'
      case 'BAJO':
        return 'Stock Bajo'
      case 'REORDENAR':
        return 'Reordenar'
      default:
        return estado
    }
  }

  const exportarReporte = () => {
    // Crear CSV
    const headers = ['Código', 'Insumo', 'Categoría', 'Laboratorio', 'Stock Actual', 'Stock Mínimo', 'Déficit', 'Estado']
    const rows = insumos.map(i => [
      i.insumo_codigo,
      i.insumo_nombre,
      i.categoria,
      i.laboratorio_nombre,
      i.stock_actual,
      i.stock_minimo,
      Math.abs(i.diferencia_minimo),
      getEstadoLabel(i.estado_stock)
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `reporte_stock_bajo_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const paginatedInsumos = insumos.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          📉 Reporte de Insumos con Stock Bajo
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadReporte}
            disabled={loading}
          >
            Actualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<FileDownload />}
            onClick={exportarReporte}
            disabled={insumos.length === 0 || loading}
          >
            Exportar CSV
          </Button>
        </Box>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          {/* @ts-ignore */}
          <Grid xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Laboratorio</InputLabel>
              <Select
                value={laboratorioSeleccionado}
                label="Laboratorio"
                onChange={(e) => setLaboratorioSeleccionado(e.target.value as number | '')}
                disabled={loading}
              >
                <MenuItem value="">Todos los laboratorios</MenuItem>
                {laboratorios.map((lab) => (
                  <MenuItem key={lab.id} value={lab.id}>
                    {lab.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Estadísticas */}
      {estadisticas && !loading && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* @ts-ignore */}
          <Grid xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#ffebee' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Agotados
                    </Typography>
                    <Typography variant="h4" fontWeight={600} color="error">
                      {estadisticas.agotados}
                    </Typography>
                  </Box>
                  <ErrorIcon sx={{ fontSize: 48, opacity: 0.3, color: 'error.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* @ts-ignore */}
          <Grid xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#fff3e0' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Stock Bajo
                    </Typography>
                    <Typography variant="h4" fontWeight={600} color="warning.main">
                      {estadisticas.bajo_stock}
                    </Typography>
                  </Box>
                  <Warning sx={{ fontSize: 48, opacity: 0.3, color: 'warning.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* @ts-ignore */}
          <Grid xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#e3f2fd' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      A Reordenar
                    </Typography>
                    <Typography variant="h4" fontWeight={600} color="info.main">
                      {estadisticas.reordenar}
                    </Typography>
                  </Box>
                  <NotificationImportant sx={{ fontSize: 48, opacity: 0.3, color: 'info.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* @ts-ignore */}
          <Grid xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#f3e5f5' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Total Alertas
                    </Typography>
                    <Typography variant="h4" fontWeight={600}>
                      {estadisticas.total_alertas}
                    </Typography>
                  </Box>
                  <Inventory sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Tabla */}
      {!loading && insumos.length === 0 && (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <Inventory sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            ✅ No hay insumos con stock bajo
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Todos los insumos tienen stock adecuado o no tienen stock mínimo configurado
          </Typography>
        </Paper>
      )}

      {!loading && insumos.length > 0 && (
        <Paper sx={{ borderRadius: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Código</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Insumo</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Categoría</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Laboratorio</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }} align="right">Stock Actual</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }} align="right">Stock Mínimo</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }} align="right">Déficit</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">Estado</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Observaciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedInsumos.map((insumo, index) => (
                  <TableRow
                    key={`${insumo.insumo_id}-${insumo.laboratorio_id}-${index}`}
                    sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {insumo.insumo_codigo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {insumo.insumo_nombre}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={insumo.categoria}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {insumo.laboratorio_nombre}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        {insumo.stock_actual} {insumo.unidad_medida}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {insumo.stock_minimo} {insumo.unidad_medida}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        fontWeight={600}
                        color="error"
                      >
                        -{Math.abs(insumo.diferencia_minimo)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={getEstadoIcon(insumo.estado_stock)}
                        label={getEstadoLabel(insumo.estado_stock)}
                        color={getEstadoColor(insumo.estado_stock)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {insumo.observaciones ? (
                        <Tooltip title={insumo.observaciones}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {insumo.observaciones}
                          </Typography>
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={insumos.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
          />
        </Paper>
      )}
    </Box>
  )
}

