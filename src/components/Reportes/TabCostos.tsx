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
  Button,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormGroup,
  FormControlLabel,
  Checkbox,
  LinearProgress,
} from '@mui/material'
import { AttachMoney, Science, Download } from '@mui/icons-material'
import * as XLSX from 'xlsx'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import dayjs from 'dayjs'
import {
  reporteService,
  type HorarioCosto,
  type CostoPorEscuela,
} from '../../services/reporteService'
import type { Escuela } from '../../services/escuelaService'
import type { Laboratorio } from '../../services/laboratorioService'
import type { Ciclo } from '../../services/cicloService'
import {
  CHART_COLORS,
  formatS,
  formatFecha,
  formatHora,
  currentMonth,
  firstMonthOfYear,
} from './reportesUtils'
import { FiltrosBar } from './FiltrosBar'

interface TabCostosProps {
  escuelas: Escuela[]
  laboratorios: Laboratorio[]
  ciclos: Ciclo[]
}

export const TabCostos: React.FC<TabCostosProps> = ({ escuelas, laboratorios, ciclos }) => {
  // ── Filtros (aislados de otros tabs) ──
  const [escuelaId, setEscuelaId] = useState<number | ''>('')
  const [laboratorioId, setLaboratorioId] = useState<number | ''>('')
  const [cicloId, setCicloId] = useState<number | ''>('')
  const [mesInicio, setMesInicio] = useState(firstMonthOfYear())
  const [mesFin, setMesFin] = useState(currentMonth())

  // ── Data ──
  const [horarios, setHorarios] = useState<HorarioCosto[]>([])
  const [costosPorEscuela, setCostosPorEscuela] = useState<CostoPorEscuela[]>([])

  // ── UI ──
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)

  // ── Export dialog ──
  const [exportOpen, setExportOpen] = useState(false)
  const [exportMesInicio, setExportMesInicio] = useState(firstMonthOfYear())
  const [exportMesFin, setExportMesFin] = useState(currentMonth())
  const [exportEscuelas, setExportEscuelas] = useState<number[]>([])
  const [exportLoading, setExportLoading] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const handleClearFilters = () => {
    setEscuelaId('')
    setLaboratorioId('')
    setCicloId('')
    setMesInicio(firstMonthOfYear())
    setMesFin(currentMonth())
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const filtros = {
        laboratorio_id: laboratorioId || undefined,
        mes_inicio: mesInicio || undefined,
        mes_fin: mesFin || undefined,
      }
      const [tablaRes, escuelaRes] = await Promise.all([
        reporteService.getHorariosConCosto({ ...filtros, escuela_id: escuelaId || undefined, ciclo_id: cicloId || undefined }),
        reporteService.getCostoPorEscuela(filtros),
      ])
      setHorarios(tablaRes.data ?? [])
      setCostosPorEscuela(escuelaRes.data ?? [])
      setPage(0)
    } catch {
      setError('Error al cargar los reportes. Verifica la conexión al servidor.')
    }
    setLoading(false)
  }, [escuelaId, laboratorioId, cicloId, mesInicio, mesFin])

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openExportDialog = () => {
    setExportMesInicio(mesInicio || firstMonthOfYear())
    setExportMesFin(mesFin || currentMonth())
    setExportEscuelas(escuelas.map((e) => e.id))
    setExportError(null)
    setExportOpen(true)
  }

  const toggleEscuela = (id: number) => {
    setExportEscuelas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleExport = async () => {
    if (exportEscuelas.length === 0) {
      setExportError('Selecciona al menos una escuela.')
      return
    }
    setExportLoading(true)
    setExportError(null)
    try {
      const wb = XLSX.utils.book_new()
      const selectedEscuelas = escuelas.filter((e) => exportEscuelas.includes(e.id))

      for (const esc of selectedEscuelas) {
        const res = await reporteService.getHorariosConCosto({
          escuela_id: esc.id,
          mes_inicio: exportMesInicio || undefined,
          mes_fin: exportMesFin || undefined,
        })
        const rows = res.data ?? []

        const wsData: (string | number)[][] = [
          ['Reporte de Gasto de Insumos'],
          [`Escuela: ${esc.nombre}`],
          [`Período: ${exportMesInicio} – ${exportMesFin}`],
          [],
          ['Escuela', 'Laboratorio', 'Fecha', 'Hora inicio', 'Hora fin', 'Descripción', 'Docente', 'Ciclo', 'Estado', 'N° Grupos', 'Alumnos', 'N° Insumos', 'Costo Total (S/.)'],
          ...rows.map((h) => [
            h.escuela,
            h.laboratorio,
            dayjs(h.fecha_inicio).format('DD/MM/YYYY'),
            dayjs(h.fecha_inicio).format('HH:mm'),
            dayjs(h.fecha_fin).format('HH:mm'),
            h.descripcion,
            h.docente,
            h.ciclo,
            h.estado === 'C' ? 'Cerrado' : 'Programado',
            h.num_grupos,
            h.cantidad_alumnos,
            h.num_insumos,
            Number(h.costo_total_insumos),
          ]),
        ]

        const ws = XLSX.utils.aoa_to_sheet(wsData)
        ws['!cols'] = [20, 20, 14, 12, 12, 40, 22, 16, 14, 10, 10, 12, 18].map((w) => ({ wch: w }))
        ws['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } },
          { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } },
          { s: { r: 2, c: 0 }, e: { r: 2, c: 12 } },
        ]
        const sheetName = esc.nombre.slice(0, 31).replace(/[\\/:*?[\]]/g, '_')
        XLSX.utils.book_append_sheet(wb, ws, sheetName)
      }

      const fileName = `Reporte_Insumos_${exportMesInicio}_${exportMesFin}.xlsx`
      XLSX.writeFile(wb, fileName)
      setExportOpen(false)
    } catch {
      setExportError('Error al generar el archivo. Verifica la conexión.')
    }
    setExportLoading(false)
  }

  // KPIs
  const totalHorarios = horarios.length
  const costoTotal = horarios.reduce((s, h) => s + Number(h.costo_total_insumos), 0)
  const promedioCosto = totalHorarios > 0 ? costoTotal / totalHorarios : 0
  const paginatedHorarios = horarios.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const chartCostos = costosPorEscuela.map((e) => ({
    escuela: e.escuela,
    costo_total: Number(e.costo_total),
    total_horarios: Number(e.total_horarios),
  }))

  return (
    <Box>
      <FiltrosBar
        escuelas={escuelas}
        laboratorios={laboratorios}
        ciclos={ciclos}
        showEscuela
        showCiclo
        laboratorioId={laboratorioId}
        escuelaId={escuelaId}
        cicloId={cicloId}
        mesInicio={mesInicio}
        mesFin={mesFin}
        onLaboratorio={setLaboratorioId}
        onEscuela={setEscuelaId}
        onCiclo={setCicloId}
        onMesInicio={setMesInicio}
        onMesFin={setMesFin}
        onClear={handleClearFilters}
        onBuscar={fetchData}
        loading={loading}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3} alignItems="flex-start">
        {/* ── Tabla ── */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper sx={{ borderRadius: 2 }}>
            <Box sx={{ px: 2.5, pt: 2, pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Science fontSize="small" color="primary" />
                  Detalle de Horarios
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Download fontSize="small" />}
                  onClick={openExportDialog}
                  disabled={loading}
                  sx={{ textTransform: 'none' }}
                >
                  Exportar Excel
                </Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="caption" color="text.secondary">
                  <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>{totalHorarios}</Box> horarios
                </Typography>
                <Typography variant="caption" color="text.disabled">·</Typography>
                <Typography variant="caption" color="text.secondary">
                  <Box component="span" sx={{ fontWeight: 700, color: 'success.main' }}>{formatS(costoTotal)}</Box> costo total
                </Typography>
                <Typography variant="caption" color="text.disabled">·</Typography>
                <Typography variant="caption" color="text.secondary">
                  <Box component="span" sx={{ fontWeight: 700, color: 'primary.main' }}>{formatS(promedioCosto)}</Box> promedio/clase
                </Typography>
              </Box>
            </Box>
            <TableContainer>
              <Table size="small" sx={{ tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 600, width: 140 }}>Laboratorio</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, width: 96 }}>Fecha</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, width: 76 }}>H. inicio</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, width: 72 }}>H. fin</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, width: 170, maxWidth: 170 }}>Descripción</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, width: 130, textAlign: 'right' }}>Costo insumos</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <CircularProgress size={28} />
                      </TableCell>
                    </TableRow>
                  ) : paginatedHorarios.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No se encontraron horarios con los filtros seleccionados
                      </TableCell>
                    </TableRow>
                  ) : paginatedHorarios.map((h) => (
                    <TableRow key={h.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                      <TableCell sx={{ width: 140 }}>
                        <Typography variant="body2" noWrap title={h.laboratorio}>{h.laboratorio}</Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', width: 96 }}>{formatFecha(h.fecha_inicio)}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', width: 76 }}>{formatHora(h.fecha_inicio)}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', width: 72 }}>{formatHora(h.fecha_fin)}</TableCell>
                      <TableCell sx={{ width: 170, maxWidth: 170, overflow: 'hidden' }}>
                        <Typography variant="body2" noWrap title={h.descripcion}>{h.descripcion}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap title={`${h.docente} · ${h.escuela}`}>{h.docente} · {h.escuela}</Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', width: 130, textAlign: 'right' }}>
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
        </Grid>

        {/* ── Costo por Escuela ── */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <AttachMoney color="success" fontSize="small" />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Costo por Escuela</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Desglose de todas las escuelas · {mesInicio && mesFin ? `${mesInicio} → ${mesFin}` : 'Todos los períodos'}
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}><CircularProgress size={24} /></Box>
            ) : chartCostos.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
                <Typography color="text.secondary" variant="body2">Sin datos</Typography>
              </Box>
            ) : (
              <Box sx={{ overflowY: 'auto', maxHeight: 600 }}>
                <ResponsiveContainer width="100%" height={Math.max(200, chartCostos.length * 56)}>
                  <BarChart layout="vertical" data={chartCostos} margin={{ left: 4, right: 32, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => `S/.${Number(v).toFixed(0)}`} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="escuela" width={110} tick={{ fontSize: 11 }} tickLine={false} />
                    <Tooltip
                      formatter={(value: number) => [formatS(value), 'Costo total']}
                      labelFormatter={(label) => `Escuela: ${label}`}
                    />
                    <Bar dataKey="costo_total" radius={[0, 4, 4, 0]} barSize={28}>
                      {chartCostos.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* ── Diálogo Exportar Excel ── */}
      <Dialog open={exportOpen} onClose={() => !exportLoading && setExportOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Download fontSize="small" />
          Exportar a Excel
        </DialogTitle>

        {exportLoading && <LinearProgress />}

        <DialogContent dividers>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>Rango de meses</Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              label="Mes inicio"
              type="month"
              size="small"
              fullWidth
              value={exportMesInicio}
              onChange={(e) => setExportMesInicio(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              disabled={exportLoading}
            />
            <TextField
              label="Mes fin"
              type="month"
              size="small"
              fullWidth
              value={exportMesFin}
              onChange={(e) => setExportMesFin(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              disabled={exportLoading}
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Escuelas a incluir ({exportEscuelas.length}/{escuelas.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" onClick={() => setExportEscuelas(escuelas.map((e) => e.id))} disabled={exportLoading}>
                Todas
              </Button>
              <Button size="small" onClick={() => setExportEscuelas([])} disabled={exportLoading}>
                Ninguna
              </Button>
            </Box>
          </Box>
          <Paper variant="outlined" sx={{ p: 1.5, maxHeight: 260, overflowY: 'auto' }}>
            <FormGroup>
              {escuelas.map((esc) => (
                <FormControlLabel
                  key={esc.id}
                  control={
                    <Checkbox
                      size="small"
                      checked={exportEscuelas.includes(esc.id)}
                      onChange={() => toggleEscuela(esc.id)}
                      disabled={exportLoading}
                    />
                  }
                  label={<Typography variant="body2">{esc.nombre}</Typography>}
                />
              ))}
            </FormGroup>
          </Paper>

          {exportError && <Alert severity="error" sx={{ mt: 2 }}>{exportError}</Alert>}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setExportOpen(false)} disabled={exportLoading}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            startIcon={exportLoading ? <CircularProgress size={16} color="inherit" /> : <Download />}
            onClick={handleExport}
            disabled={exportLoading || exportEscuelas.length === 0}
          >
            {exportLoading ? 'Generando...' : 'Descargar Excel'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
