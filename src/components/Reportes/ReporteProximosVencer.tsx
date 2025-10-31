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
  Tooltip,
  TextField
} from '@mui/material'
import {
  EventBusy,
  TodayOutlined,
  ErrorOutline,
  WarningAmber,
  InfoOutlined,
  Refresh,
  FileDownload,
  CalendarMonth
} from '@mui/icons-material'
import { laboratorioService } from '../../services/laboratorioService'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Laboratorio {
  id: number
  nombre: string
}

interface InsumoProximoVencer {
  insumo_id: number
  insumo_codigo: string
  insumo_nombre: string
  categoria: string
  unidad_medida: string
  laboratorio_id: number
  laboratorio_nombre: string
  detalle_id: number
  lote: string
  cantidad: number
  fecha_vencimiento: string
  fecha_ingreso: string
  dias_restantes: number
  meses_almacenado: number
  estado_vencimiento: 'VENCIDO' | 'VENCE_HOY' | 'URGENTE' | 'PROXIMO' | 'ADVERTENCIA'
  prioridad: number
}

interface Estadisticas {
  total_lotes: number
  vencidos: number
  vence_hoy: number
  urgente: number
  proximo: number
  advertencia: number
  laboratorios_afectados: number
  insumos_unicos: number
}

export const ReporteProximosVencer: React.FC = () => {
  const [insumos, setInsumos] = useState<InsumoProximoVencer[]>([])
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [laboratorioSeleccionado, setLaboratorioSeleccionado] = useState<number | ''>('')
  const [diasFiltro, setDiasFiltro] = useState<number>(90)
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
  }, [laboratorioSeleccionado, diasFiltro])

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
      //const labId = laboratorioSeleccionado === '' ? undefined : laboratorioSeleccionado
      //const response = await insumoService.getInsumosProximosVencer(labId, diasFiltro)
      
      //if (response.success) {
        setInsumos([]) //response.data
        setEstadisticas(null) //response.estadisticas
      //}
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
      case 'VENCIDO':
        return 'error'
      case 'VENCE_HOY':
        return 'error'
      case 'URGENTE':
        return 'warning'
      case 'PROXIMO':
        return 'info'
      case 'ADVERTENCIA':
        return 'default'
      default:
        return 'default'
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'VENCIDO':
        return <EventBusy />
      case 'VENCE_HOY':
        return <TodayOutlined />
      case 'URGENTE':
        return <ErrorOutline />
      case 'PROXIMO':
        return <WarningAmber />
      case 'ADVERTENCIA':
        return <InfoOutlined />
      default:
        return undefined
    }
  }

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'VENCIDO':
        return 'Vencido'
      case 'VENCE_HOY':
        return 'Vence Hoy'
      case 'URGENTE':
        return 'Urgente (≤7 días)'
      case 'PROXIMO':
        return 'Próximo (≤30 días)'
      case 'ADVERTENCIA':
        return 'Advertencia (≤90 días)'
      default:
        return estado
    }
  }

  const formatearFecha = (fecha: string) => {
    try {
      return format(new Date(fecha), 'dd MMM yyyy', { locale: es })
    } catch {
      return fecha
    }
  }

  const exportarReporte = () => {
    // Crear CSV
    const headers = [
      'Código',
      'Insumo',
      'Lote',
      'Cantidad',
      'Laboratorio',
      'Fecha Vencimiento',
      'Días Restantes',
      'Estado'
    ]
    const rows = insumos.map(i => [
      i.insumo_codigo,
      i.insumo_nombre,
      i.lote,
      `${i.cantidad} ${i.unidad_medida}`,
      i.laboratorio_nombre,
      formatearFecha(i.fecha_vencimiento),
      i.dias_restantes,
      getEstadoLabel(i.estado_vencimiento)
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `reporte_proximos_vencer_${new Date().toISOString().split('T')[0]}.csv`)
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
          📅 Reporte de Insumos Próximos a Vencer
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
          {/* @ts-ignore */}
          <Grid xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Días a futuro"
              value={diasFiltro}
              onChange={(e) => setDiasFiltro(parseInt(e.target.value) || 90)}
              disabled={loading}
              InputProps={{
                inputProps: { min: 1, max: 365 }
              }}
              helperText="Mostrar insumos que vencen en los próximos X días"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Estadísticas */}
      {estadisticas && !loading && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* @ts-ignore */}
          <Grid xs={12} sm={6} md={2.4}>
            <Card sx={{ bgcolor: '#ffebee' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Vencidos
                    </Typography>
                    <Typography variant="h4" fontWeight={600} color="error">
                      {estadisticas.vencidos}
                    </Typography>
                  </Box>
                  <EventBusy sx={{ fontSize: 40, opacity: 0.3, color: 'error.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* @ts-ignore */}
          <Grid xs={12} sm={6} md={2.4}>
            <Card sx={{ bgcolor: '#fce4ec' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Vence Hoy
                    </Typography>
                    <Typography variant="h4" fontWeight={600} color="error">
                      {estadisticas.vence_hoy}
                    </Typography>
                  </Box>
                  <TodayOutlined sx={{ fontSize: 40, opacity: 0.3, color: 'error.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* @ts-ignore */}
          <Grid xs={12} sm={6} md={2.4}>
            <Card sx={{ bgcolor: '#fff3e0' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Urgente
                    </Typography>
                    <Typography variant="h4" fontWeight={600} color="warning.main">
                      {estadisticas.urgente}
                    </Typography>
                  </Box>
                  <ErrorOutline sx={{ fontSize: 40, opacity: 0.3, color: 'warning.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* @ts-ignore */}
          <Grid xs={12} sm={6} md={2.4}>
            <Card sx={{ bgcolor: '#e3f2fd' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignments: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Próximo
                    </Typography>
                    <Typography variant="h4" fontWeight={600} color="info.main">
                      {estadisticas.proximo}
                    </Typography>
                  </Box>
                  <WarningAmber sx={{ fontSize: 40, opacity: 0.3, color: 'info.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* @ts-ignore */}
          <Grid xs={12} sm={6} md={2.4}>
            <Card sx={{ bgcolor: '#f5f5f5' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Total Lotes
                    </Typography>
                    <Typography variant="h4" fontWeight={600}>
                      {estadisticas.total_lotes}
                    </Typography>
                  </Box>
                  <CalendarMonth sx={{ fontSize: 40, opacity: 0.3 }} />
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
          <CalendarMonth sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            ✅ No hay insumos próximos a vencer
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No se encontraron lotes que venzan en los próximos {diasFiltro} días
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
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Lote</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }} align="right">Cantidad</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Laboratorio</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Vencimiento</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">Días Restantes</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedInsumos.map((insumo, index) => (
                  <TableRow
                    key={`${insumo.detalle_id}-${index}`}
                    sx={{
                      '&:hover': { bgcolor: 'action.hover' },
                      bgcolor: insumo.dias_restantes < 0 ? '#ffebee' : 'inherit'
                    }}
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
                      <Typography variant="caption" color="text.secondary">
                        {insumo.categoria}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={insumo.lote}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        {insumo.cantidad} {insumo.unidad_medida}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {insumo.laboratorio_nombre}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={`Ingresado: ${formatearFecha(insumo.fecha_ingreso)}`}>
                        <Typography variant="body2" fontWeight={500}>
                          {formatearFecha(insumo.fecha_vencimiento)}
                        </Typography>
                      </Tooltip>
                      <Typography variant="caption" color="text.secondary">
                        ({insumo.meses_almacenado} meses guardado)
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color={insumo.dias_restantes < 0 ? 'error' : insumo.dias_restantes <= 7 ? 'warning.main' : 'text.primary'}
                      >
                        {insumo.dias_restantes < 0 ? (
                          `Vencido hace ${Math.abs(insumo.dias_restantes)} días`
                        ) : insumo.dias_restantes === 0 ? (
                          'Vence HOY'
                        ) : (
                          `${insumo.dias_restantes} días`
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={getEstadoIcon(insumo.estado_vencimiento)}
                        label={getEstadoLabel(insumo.estado_vencimiento)}
                        color={getEstadoColor(insumo.estado_vencimiento)}
                        size="small"
                      />
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

