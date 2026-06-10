import React, { useState, useEffect, useCallback } from 'react'
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
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Grid,
  Divider,
  TextField,
} from '@mui/material'
import { Search, Assessment, AttachMoney, Science } from '@mui/icons-material'
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
  type HorarioCosto,
  type CostoPorEscuela,
  type HorariosPorLaboratorio,
} from '../services/reporteService'
import { escuelaService } from '../services/escuelaService'
import type { Escuela } from '../services/escuelaService'
import dayjs from 'dayjs'

const CHART_COLORS = [
  '#1565C0', '#2E7D32', '#F57C00', '#6A1B9A',
  '#00838F', '#AD1457', '#558B2F', '#E65100',
]

const formatS = (val: number | string) =>
  `S/. ${Number(val).toFixed(2)}`

const formatFecha = (f: string) => dayjs(f).format('DD/MM/YYYY')
const formatHora = (f: string) => dayjs(f).format('HH:mm')

const currentMonth = () => dayjs().format('YYYY-MM')
const threeMonthsAgo = () => dayjs().subtract(2, 'month').format('YYYY-MM')

export const Reportes: React.FC = () => {
  // ── Filtros ──
  const [escuelaId, setEscuelaId] = useState<number | ''>('')
  const [mesInicio, setMesInicio] = useState(threeMonthsAgo())
  const [mesFin, setMesFin] = useState(currentMonth())

  // ── Data ──
  const [escuelas, setEscuelas] = useState<Escuela[]>([])
  const [horarios, setHorarios] = useState<HorarioCosto[]>([])
  const [costosPorEscuela, setCostosPorEscuela] = useState<CostoPorEscuela[]>([])
  const [horariosPorLab, setHorariosPorLab] = useState<HorariosPorLaboratorio[]>([])

  // ── UI state ──
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    escuelaService.getAll().then((res) => setEscuelas(res.data ?? []))
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const filtros = {
        mes_inicio: mesInicio || undefined,
        mes_fin: mesFin || undefined,
      }
      const [tablaRes, escuelaRes, labRes] = await Promise.all([
        reporteService.getHorariosConCosto({ ...filtros, escuela_id: escuelaId || undefined }),
        reporteService.getCostoPorEscuela(filtros),
        reporteService.getHorariosPorLaboratorio(filtros),
      ])
      setHorarios(tablaRes.data ?? [])
      setCostosPorEscuela(escuelaRes.data ?? [])
      setHorariosPorLab(labRes.data ?? [])
      setPage(0)
    } catch {
      setError('Error al cargar los reportes. Verifica la conexión al servidor.')
    }
    setLoading(false)
  }, [escuelaId, mesInicio, mesFin])

  useEffect(() => {
    fetchData()
  }, [])

  // KPIs
  const totalHorarios = horarios.length
  const costoTotal = horarios.reduce((s, h) => s + Number(h.costo_total_insumos), 0)
  const promedioCosto = totalHorarios > 0 ? costoTotal / totalHorarios : 0

  // Tabla paginada
  const paginatedHorarios = horarios.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  // Chart data — normalize DECIMAL strings to numbers
  const chartCostos = costosPorEscuela.map((e) => ({
    escuela: e.escuela,
    costo_total: Number(e.costo_total),
    total_horarios: Number(e.total_horarios),
  }))
  const chartLabs = horariosPorLab.map((l) => ({
    laboratorio: l.laboratorio,
    Programados: Number(l.horarios_programados),
    Cerrados: Number(l.horarios_cerrados),
  }))

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assessment color="primary" sx={{ fontSize: 36 }} />
          Reportes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Análisis de horarios, costos de insumos y uso de laboratorios
        </Typography>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Escuela</InputLabel>
              <Select
                value={escuelaId}
                label="Escuela"
                onChange={(e) => setEscuelaId(e.target.value as number | '')}
              >
                <MenuItem value=""><em>Todas las escuelas</em></MenuItem>
                {escuelas.map((e) => (
                  <MenuItem key={e.id} value={e.id}>{e.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <TextField
              label="Mes inicio"
              type="month"
              size="small"
              fullWidth
              value={mesInicio}
              onChange={(e) => setMesInicio(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <TextField
              label="Mes fin"
              type="month"
              size="small"
              fullWidth
              value={mesFin}
              onChange={(e) => setMesFin(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={2} md={2}>
            <Button
              variant="contained"
              fullWidth
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Search />}
              onClick={fetchData}
              disabled={loading}
              sx={{ height: 40 }}
            >
              {loading ? 'Cargando...' : 'Buscar'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* KPIs */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Paper sx={{ px: 2.5, py: 1.5, borderRadius: 2, minWidth: 160 }}>
          <Typography variant="caption" color="text.secondary">Total horarios</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{totalHorarios}</Typography>
        </Paper>
        <Paper sx={{ px: 2.5, py: 1.5, borderRadius: 2, minWidth: 200 }}>
          <Typography variant="caption" color="text.secondary">Costo total estimado</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>{formatS(costoTotal)}</Typography>
        </Paper>
        <Paper sx={{ px: 2.5, py: 1.5, borderRadius: 2, minWidth: 200 }}>
          <Typography variant="caption" color="text.secondary">Promedio por clase</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>{formatS(promedioCosto)}</Typography>
        </Paper>
      </Box>

      {/* Tabla */}
      <Paper sx={{ borderRadius: 2, mb: 4 }}>
        <Box sx={{ px: 2.5, pt: 2, pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Science fontSize="small" color="primary" />
            Detalle de Horarios
          </Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                {['Escuela', 'Laboratorio', 'Fecha', 'Hora inicio', 'Hora fin', 'Descripción', 'Estado', 'Costo insumos'].map((h) => (
                  <TableCell key={h} sx={{ color: 'white', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : paginatedHorarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No se encontraron horarios con los filtros seleccionados
                  </TableCell>
                </TableRow>
              ) : paginatedHorarios.map((h) => (
                <TableRow key={h.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{h.escuela}</Typography>
                    <Typography variant="caption" color="text.secondary">{h.ciclo}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{h.laboratorio}</Typography>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatFecha(h.fecha_inicio)}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatHora(h.fecha_inicio)}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatHora(h.fecha_fin)}</TableCell>
                  <TableCell sx={{ maxWidth: 260 }}>
                    <Typography variant="body2" noWrap title={h.descripcion}>{h.descripcion}</Typography>
                    <Typography variant="caption" color="text.secondary">{h.docente}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={h.estado === 'C' ? 'Cerrado' : 'Programado'}
                      size="small"
                      color={h.estado === 'C' ? 'success' : 'warning'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {Number(h.costo_total_insumos) > 0
                      ? <Chip label={formatS(h.costo_total_insumos)} size="small" color="success" variant="outlined" sx={{ fontWeight: 700 }} />
                      : <Typography variant="caption" color="text.secondary">—</Typography>
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={horarios.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0) }}
          labelRowsPerPage="Filas:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>

      <Divider sx={{ mb: 4 }} />

      {/* Gráficas */}
      <Grid container spacing={3}>
        {/* Gráfica 1: Costo por escuela */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 2.5, borderRadius: 2, height: 420 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AttachMoney color="success" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Costo por Escuela</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
              {mesInicio && mesFin ? `${mesInicio} → ${mesFin}` : 'Todos los períodos'}
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}><CircularProgress /></Box>
            ) : chartCostos.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
                <Typography color="text.secondary" variant="body2">Sin datos para el período seleccionado</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  layout="vertical"
                  data={chartCostos}
                  margin={{ left: 10, right: 30, top: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => `S/.${Number(v).toFixed(0)}`}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="escuela"
                    width={130}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatS(value), 'Costo total']}
                    labelFormatter={(label) => `Escuela: ${label}`}
                  />
                  <Bar dataKey="costo_total" radius={[0, 4, 4, 0]}>
                    {chartCostos.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* Gráfica 2: Horarios por laboratorio */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 2.5, borderRadius: 2, height: 420 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Science color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Horarios por Laboratorio</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
              {mesInicio && mesFin ? `${mesInicio} → ${mesFin}` : 'Todos los períodos'}
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}><CircularProgress /></Box>
            ) : chartLabs.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
                <Typography color="text.secondary" variant="body2">Sin datos para el período seleccionado</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={chartLabs}
                  margin={{ left: 0, right: 20, top: 5, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="laboratorio"
                    tick={{ fontSize: 10 }}
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend verticalAlign="top" />
                  <Bar dataKey="Programados" stackId="a" fill="#F57C00" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Cerrados" stackId="a" fill="#1565C0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
