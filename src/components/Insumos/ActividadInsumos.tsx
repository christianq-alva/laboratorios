import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material'
import {
  Close,
  History,
  Add,
  Remove,
  FilterList,
  Refresh,
  Schedule,
  Person,
  LocationOn,
} from '@mui/icons-material'
import { laboratorioService, type Laboratorio } from '../../services/laboratorioService'
import { inventarioService, type ActividadInsumo } from '../../services/inventarioService'
import { useApi } from '../../hooks/useApi'
import dayjs from 'dayjs'

interface ActividadInsumosProps {
  open: boolean
  onClose: () => void
}

export const ActividadInsumos: React.FC<ActividadInsumosProps> = ({ open, onClose }) => {
  const { execute } = useApi()
  const [actividad, setActividad] = useState<ActividadInsumo[]>([])
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [filters, setFilters] = useState({
    laboratorio_id: '',
    fecha_inicio: '',
    fecha_fin: '',
    tipo_movimiento: ''
  })

  // Cargar datos iniciales
  useEffect(() => {
    if (open) {
      loadLaboratorios()
      loadActividad()
    }
  }, [open])

  const loadLaboratorios = async () => {
    const response = await execute(() => laboratorioService.getAll())
    if (response.error) {
      setError(response.error)
    } else if (response.data) {
      setLaboratorios(response.data.data || [])
    }
  }

  const loadActividad = async () => {
    setLoading(true)
    setError(null)

    const filtersToSend: any = {}
    if (filters.laboratorio_id) filtersToSend.laboratorio_id = parseInt(filters.laboratorio_id)
    if (filters.fecha_inicio) filtersToSend.fecha_inicio = filters.fecha_inicio
    if (filters.fecha_fin) filtersToSend.fecha_fin = filters.fecha_fin
    if (filters.tipo_movimiento) filtersToSend.tipo_movimiento = filters.tipo_movimiento

    const result = await execute(() => inventarioService.getActividad(filtersToSend))

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setActividad(result.data.data)
    }
    setLoading(false)
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleApplyFilters = () => {
    loadActividad()
  }

  const handleClearFilters = () => {
    setFilters({
      laboratorio_id: '',
      fecha_inicio: '',
      fecha_fin: '',
      tipo_movimiento: ''
    })
  }

  const getTipoMovimientoColor = (tipo: string) => {
    return tipo === 'entrada' ? 'success' : 'error'
  }

  const getTipoMovimientoIcon = (tipo: string) => {
    return tipo === 'entrada' ? <Add /> : <Remove />
  }

  const formatFecha = (fecha: string) => {
    if (!fecha) return 'N/A'
    try {
      return new Date(fecha).toLocaleString('es-PE', {
        timeZone: 'America/Lima',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    } catch (error) {
      console.warn('Error al formatear fecha:', fecha, error)
      return 'Fecha inválida'
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <History color="primary" />
            Movimiento de Insumos
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Filtros */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList />
            Filtros
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <FormControl size="small">
              <InputLabel>Laboratorio</InputLabel>
              <Select
                value={filters.laboratorio_id}
                label="Laboratorio"
                onChange={(e) => handleFilterChange('laboratorio_id', e.target.value)}
              >
                <MenuItem value="">Todos los laboratorios</MenuItem>
                {laboratorios.map((lab) => (
                  <MenuItem key={lab.id} value={lab.id}>
                    {lab.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Fecha inicio"
              type="date"
              value={filters.fecha_inicio}
              onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Fecha fin"
              type="date"
              value={filters.fecha_fin}
              onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />

            <FormControl size="small">
              <InputLabel>Tipo de movimiento</InputLabel>
              <Select
                value={filters.tipo_movimiento}
                label="Tipo de movimiento"
                onChange={(e) => handleFilterChange('tipo_movimiento', e.target.value)}
              >
                <MenuItem value="">Todos los movimientos</MenuItem>
                <MenuItem value="entrada">Entrada</MenuItem>
                <MenuItem value="salida">Salida</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleApplyFilters}
              startIcon={<FilterList />}
            >
              Aplicar Filtros
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleClearFilters}
            >
              Limpiar
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={loadActividad}
              startIcon={<Refresh />}
            >
              Actualizar
            </Button>
          </Box>
        </Paper>

        {/* Tabla de actividad */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Fecha de Movimiento</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Laboratorio</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Observaciones</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Usuario</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Fecha de Sistema</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {actividad.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <History sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No hay actividad registrada
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          No se encontraron movimientos de insumos con los filtros aplicados
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  actividad.map((movimiento) => (
                    <TableRow key={movimiento.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Schedule fontSize="small" color="action" />
                          <Typography variant="body2">
                            {dayjs(movimiento.fecha_movimiento).format('DD/MM/YYYY')}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Chip
                          icon={getTipoMovimientoIcon(movimiento.tipo_movimiento)}
                          label={movimiento.tipo_movimiento === 'entrada' ? 'Entrada' : 'Salida'}
                          color={getTipoMovimientoColor(movimiento.tipo_movimiento)}
                          size="small"
                          variant="filled"
                        />
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationOn fontSize="small" color="action" />
                          <Typography variant="body2">
                            {movimiento.laboratorio_nombre}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Tooltip title={movimiento.observaciones} arrow>
                          <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {movimiento.observaciones}
                          </Typography>
                        </Tooltip>
                        {movimiento.reserva_descripcion && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Reserva: {movimiento.reserva_descripcion}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Person fontSize="small" color="action" />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {movimiento.usuario_nombre}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {movimiento.usuario_rol}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Schedule fontSize="small" color="action" />
                          <Typography variant="body2">
                            {formatFecha(movimiento.fecha_ingreso)}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Resumen */}
        {actividad.length > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Mostrando {actividad.length} movimientos de insumos
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
} 