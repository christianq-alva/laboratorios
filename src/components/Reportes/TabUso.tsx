import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import { AccessTime, Science, Download } from '@mui/icons-material'
import * as XLSX from 'xlsx'
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
  type HorariosPorLaboratorio,
  type HorasUsoLaboratorio,
  type Granularidad,
} from '../../services/reporteService'
import type { Escuela } from '../../services/escuelaService'
import type { Laboratorio } from '../../services/laboratorioService'
import {
  CHART_COLORS,
  formatHoras,
  formatPeriodo,
  currentMonth,
  firstMonthOfYear,
} from './reportesUtils'
import { FiltrosBar } from './FiltrosBar'

interface TabUsoProps {
  escuelas: Escuela[]
  laboratorios: Laboratorio[]
}

const granLabel: Record<Granularidad, string> = { dia: 'día', semana: 'semana', mes: 'mes' }

export const TabUso: React.FC<TabUsoProps> = ({ escuelas, laboratorios }) => {
  // ── Filtros (aislados de otros tabs) ──
  const [escuelaId, setEscuelaId] = useState<number | ''>('')
  const [laboratorioId, setLaboratorioId] = useState<number | ''>('')
  const [mesInicio, setMesInicio] = useState(firstMonthOfYear())
  const [mesFin, setMesFin] = useState(currentMonth())
  const [granularidad, setGranularidad] = useState<Granularidad>('mes')

  // ── Data ──
  const [horasData, setHorasData] = useState<HorasUsoLaboratorio[]>([])
  const [horariosPorLab, setHorariosPorLab] = useState<HorariosPorLaboratorio[]>([])

  // ── UI ──
  const [loading, setLoading] = useState(false)
  const [horasLoading, setHorasLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClearFilters = () => {
    setEscuelaId('')
    setLaboratorioId('')
    setMesInicio(firstMonthOfYear())
    setMesFin(currentMonth())
  }

  const fetchHoras = useCallback(async () => {
    setHorasLoading(true)
    try {
      const res = await reporteService.getHorasUso({
        laboratorio_id: laboratorioId || undefined,
        escuela_id: escuelaId || undefined,
        mes_inicio: mesInicio || undefined,
        mes_fin: mesFin || undefined,
        granularidad,
      })
      setHorasData(res.data ?? [])
    } catch {
      setHorasData([])
    }
    setHorasLoading(false)
  }, [escuelaId, laboratorioId, mesInicio, mesFin, granularidad])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await reporteService.getHorariosPorLaboratorio({
        laboratorio_id: laboratorioId || undefined,
        escuela_id: escuelaId || undefined,
        mes_inicio: mesInicio || undefined,
        mes_fin: mesFin || undefined,
      })
      setHorariosPorLab(res.data ?? [])
    } catch {
      setError('Error al cargar los reportes. Verifica la conexión al servidor.')
    }
    setLoading(false)
  }, [escuelaId, laboratorioId, mesInicio, mesFin])

  const handleBuscar = useCallback(() => {
    fetchData()
    fetchHoras()
  }, [fetchData, fetchHoras])

  useEffect(() => {
    fetchData()
    fetchHoras()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Refresca solo las horas al cambiar la granularidad (sin pulsar Buscar)
  const didMountHoras = useRef(false)
  useEffect(() => {
    if (!didMountHoras.current) {
      didMountHoras.current = true
      return
    }
    fetchHoras()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [granularidad])

  // ── Horas de uso: pivote por período + ranking ──
  const labsEnHoras = Array.from(new Set(horasData.map((h) => h.laboratorio)))

  const chartHoras = (() => {
    const map = new Map<string, Record<string, string | number>>()
    for (const h of horasData) {
      if (!map.has(h.periodo)) map.set(h.periodo, { periodo: h.periodo })
      map.get(h.periodo)![h.laboratorio] = Number(h.horas_uso)
    }
    return Array.from(map.values())
      .sort((a, b) => String(a.periodo).localeCompare(String(b.periodo)))
      .map((row): Record<string, string | number> => ({
        ...row,
        periodoLabel: formatPeriodo(String(row.periodo), granularidad),
      }))
  })()

  const rankingHoras = (() => {
    const map = new Map<string, number>()
    for (const h of horasData) {
      map.set(h.laboratorio, (map.get(h.laboratorio) ?? 0) + Number(h.horas_uso))
    }
    return Array.from(map.entries())
      .map(([laboratorio, horas]) => ({ laboratorio, horas }))
      .sort((a, b) => b.horas - a.horas)
  })()

  const horasTotales = rankingHoras.reduce((s, r) => s + r.horas, 0)
  const sesionesTotales = horasData.reduce((s, h) => s + Number(h.num_sesiones), 0)
  const numPeriodos = chartHoras.length
  const promedioHorasPeriodo = numPeriodos > 0 ? horasTotales / numPeriodos : 0
  const labMasUsado = rankingHoras[0]?.laboratorio ?? '—'

  const chartLabs = horariosPorLab.map((l) => ({
    laboratorio: l.laboratorio,
    Programados: Number(l.horarios_programados),
    Cerrados: Number(l.horarios_cerrados),
  }))

  const exportHoras = () => {
    const headers = ['Período', 'Laboratorio', 'Horas de uso', 'N° sesiones']
    const rows = chartHoras.flatMap((row) =>
      labsEnHoras
        .filter((lab) => row[lab] != null)
        .map((lab) => {
          const detalle = horasData.find((h) => h.periodo === row.periodo && h.laboratorio === lab)
          return [row.periodoLabel, lab, Number(row[lab]), Number(detalle?.num_sesiones ?? 0)]
        })
    )
    const ws = XLSX.utils.aoa_to_sheet([
      ['Reporte de Horas de Uso por Laboratorio'],
      [`Granularidad: por ${granLabel[granularidad]}`],
      [`Período: ${mesInicio} – ${mesFin}`],
      [],
      headers,
      ...rows,
    ])
    ws['!cols'] = [24, 24, 14, 12].map((w) => ({ wch: w }))
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Horas de Uso')
    XLSX.writeFile(wb, `Horas_Uso_Laboratorio_${mesInicio}_${mesFin}.xlsx`)
  }

  return (
    <Box>
      <FiltrosBar
        escuelas={escuelas}
        laboratorios={laboratorios}
        showEscuela
        laboratorioId={laboratorioId}
        escuelaId={escuelaId}
        cicloId={''}
        mesInicio={mesInicio}
        mesFin={mesFin}
        onLaboratorio={setLaboratorioId}
        onEscuela={setEscuelaId}
        onCiclo={() => {}}
        onMesInicio={setMesInicio}
        onMesFin={setMesFin}
        onClear={handleClearFilters}
        onBuscar={handleBuscar}
        loading={loading || horasLoading}
        extra={
          <ToggleButtonGroup
            size="small"
            exclusive
            value={granularidad}
            onChange={(_, val) => { if (val) setGranularidad(val as Granularidad) }}
          >
            <ToggleButton value="dia" sx={{ textTransform: 'none', px: 1.5 }}>Día</ToggleButton>
            <ToggleButton value="semana" sx={{ textTransform: 'none', px: 1.5 }}>Semana</ToggleButton>
            <ToggleButton value="mes" sx={{ textTransform: 'none', px: 1.5 }}>Mes</ToggleButton>
          </ToggleButtonGroup>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── Horas de Uso por Laboratorio ── */}
      <Paper sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 0.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTime fontSize="small" color="primary" />
            Horas de Uso por Laboratorio
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Download fontSize="small" />}
            onClick={exportHoras}
            disabled={horasLoading || horasData.length === 0}
            sx={{ textTransform: 'none' }}
          >
            Exportar Excel
          </Button>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          Ocupación (reservas programadas y cerradas) · {mesInicio && mesFin ? `${mesInicio} → ${mesFin}` : 'Todos los períodos'}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            <Box component="span" sx={{ fontWeight: 700, color: 'primary.main' }}>{formatHoras(horasTotales)}</Box> totales
          </Typography>
          <Typography variant="caption" color="text.disabled">·</Typography>
          <Typography variant="caption" color="text.secondary">
            <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>{formatHoras(promedioHorasPeriodo)}</Box> prom/{granLabel[granularidad]}
          </Typography>
          <Typography variant="caption" color="text.disabled">·</Typography>
          <Typography variant="caption" color="text.secondary">
            <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>{sesionesTotales}</Box> sesiones
          </Typography>
          <Typography variant="caption" color="text.disabled">·</Typography>
          <Typography variant="caption" color="text.secondary">
            Más usado: <Box component="span" sx={{ fontWeight: 700, color: 'success.main' }}>{labMasUsado}</Box>
          </Typography>
        </Box>

        {horasLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
        ) : horasData.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <Typography color="text.secondary" variant="body2">Sin datos de horas para los filtros seleccionados</Typography>
          </Box>
        ) : (
          <Grid container spacing={3} alignItems="flex-start">
            <Grid size={{ xs: 12, lg: 8 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Horas por {granLabel[granularidad]} (por laboratorio)
              </Typography>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartHoras} margin={{ left: 0, right: 10, top: 4, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="periodoLabel" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}h`} />
                  <Tooltip formatter={(value: number, name: string) => [formatHoras(value), name]} />
                  <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
                  {labsEnHoras.map((lab, i) => (
                    <Bar key={lab} dataKey={lab} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[3, 3, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </Grid>

            <Grid size={{ xs: 12, lg: 4 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Ranking (horas totales)
              </Typography>
              <Box sx={{ overflowY: 'auto', maxHeight: 320 }}>
                <ResponsiveContainer width="100%" height={Math.max(160, rankingHoras.length * 46)}>
                  <BarChart layout="vertical" data={rankingHoras} margin={{ left: 4, right: 40, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}h`} />
                    <YAxis type="category" dataKey="laboratorio" width={100} tick={{ fontSize: 11 }} tickLine={false} />
                    <Tooltip formatter={(value: number) => [formatHoras(value), 'Horas']} />
                    <Bar dataKey="horas" radius={[0, 4, 4, 0]} barSize={24}>
                      {rankingHoras.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* ── Horarios por Laboratorio ── */}
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Science color="primary" fontSize="small" />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Horarios por Laboratorio</Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          {escuelaId
            ? `${escuelas.find((e) => e.id === escuelaId)?.nombre ?? 'Escuela seleccionada'} · `
            : 'Todas las escuelas · '}
          {mesInicio && mesFin ? `${mesInicio} → ${mesFin}` : 'Todos los períodos'}
        </Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}><CircularProgress size={24} /></Box>
        ) : chartLabs.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
            <Typography color="text.secondary" variant="body2">Sin datos</Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartLabs} margin={{ left: 0, right: 10, top: 4, bottom: 45 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="laboratorio" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Programados" stackId="a" fill="#F57C00" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Cerrados" stackId="a" fill="#1565C0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Paper>
    </Box>
  )
}
