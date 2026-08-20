import React from 'react'
import {
  Box,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Typography,
  Chip,
  CircularProgress,
} from '@mui/material'
import { Search, FilterList, Clear } from '@mui/icons-material'
import type { Escuela } from '../../services/escuelaService'
import type { Laboratorio } from '../../services/laboratorioService'
import type { Ciclo } from '../../services/cicloService'
import { currentMonth, firstMonthOfYear } from './reportesUtils'

// Barra de filtros reutilizable. Cada tab decide qué filtros mostrar
// (showEscuela / showCiclo) y mantiene su propio estado, de modo que un filtro
// solo afecta a los reportes de su tab.
export interface FiltrosBarProps {
  escuelas: Escuela[]
  laboratorios: Laboratorio[]
  ciclos?: Ciclo[]
  showEscuela?: boolean
  showCiclo?: boolean
  laboratorioId: number | ''
  escuelaId: number | ''
  cicloId: number | ''
  mesInicio: string
  mesFin: string
  onLaboratorio: (v: number | '') => void
  onEscuela: (v: number | '') => void
  onCiclo: (v: number | '') => void
  onMesInicio: (v: string) => void
  onMesFin: (v: string) => void
  onClear: () => void
  onBuscar: () => void
  loading: boolean
  /** Contenido extra (p. ej. toggle de granularidad) alineado a la derecha */
  extra?: React.ReactNode
}

export const FiltrosBar: React.FC<FiltrosBarProps> = ({
  escuelas,
  laboratorios,
  ciclos = [],
  showEscuela = true,
  showCiclo = false,
  laboratorioId,
  escuelaId,
  cicloId,
  mesInicio,
  mesFin,
  onLaboratorio,
  onEscuela,
  onCiclo,
  onMesInicio,
  onMesFin,
  onClear,
  onBuscar,
  loading,
  extra,
}) => {
  const activeFiltersCount = [
    laboratorioId !== '',
    showEscuela && escuelaId !== '',
    showCiclo && cicloId !== '',
    mesInicio !== firstMonthOfYear(),
    mesFin !== currentMonth(),
  ].filter(Boolean).length

  return (
    <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <FilterList fontSize="small" sx={{ color: 'text.secondary' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            Filtros
          </Typography>
          {activeFiltersCount > 0 && (
            <Chip label={activeFiltersCount} size="small" color="primary" sx={{ height: 18, fontSize: 11, '.MuiChip-label': { px: 0.75 } }} />
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {extra}
          {activeFiltersCount > 0 && (
            <Button
              size="small"
              startIcon={<Clear sx={{ fontSize: '14px !important' }} />}
              onClick={onClear}
              sx={{ color: 'text.secondary', fontSize: 12, py: 0, minWidth: 0, textTransform: 'none' }}
            >
              Limpiar
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={1.5} alignItems="flex-end">
        {/* Laboratorio */}
        <Grid size={{ xs: 12, sm: 4, md: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Laboratorio</InputLabel>
            <Select
              value={laboratorioId}
              label="Laboratorio"
              onChange={(e) => onLaboratorio(e.target.value as number | '')}
            >
              <MenuItem value=""><em>Todos</em></MenuItem>
              {laboratorios.map((l) => (
                <MenuItem key={l.id} value={l.id}>{l.nombre}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Escuela */}
        {showEscuela && (
          <Grid size={{ xs: 12, sm: 4, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Escuela</InputLabel>
              <Select
                value={escuelaId}
                label="Escuela"
                onChange={(e) => onEscuela(e.target.value as number | '')}
              >
                <MenuItem value=""><em>Todas</em></MenuItem>
                {escuelas.map((e) => (
                  <MenuItem key={e.id} value={e.id}>{e.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}

        {/* Ciclo */}
        {showCiclo && (
          <Grid size={{ xs: 12, sm: 4, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Ciclo</InputLabel>
              <Select
                value={cicloId}
                label="Ciclo"
                onChange={(e) => onCiclo(e.target.value as number | '')}
              >
                <MenuItem value=""><em>Todos</em></MenuItem>
                {ciclos.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}

        {/* Rango de meses agrupado */}
        <Grid size={{ xs: 12, sm: 8, md: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              label="Desde"
              type="month"
              size="small"
              fullWidth
              value={mesInicio}
              onChange={(e) => onMesInicio(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Typography variant="body2" color="text.disabled" sx={{ flexShrink: 0, userSelect: 'none' }}>—</Typography>
            <TextField
              label="Hasta"
              type="month"
              size="small"
              fullWidth
              value={mesFin}
              onChange={(e) => onMesFin(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
        </Grid>

        {/* Buscar */}
        <Grid size={{ xs: 12, sm: 4, md: 2 }}>
          <Button
            variant="contained"
            fullWidth
            startIcon={loading ? <CircularProgress size={15} color="inherit" /> : <Search />}
            onClick={onBuscar}
            disabled={loading}
            sx={{ height: 40 }}
          >
            {loading ? 'Buscando…' : 'Buscar'}
          </Button>
        </Grid>
      </Grid>
    </Paper>
  )
}
