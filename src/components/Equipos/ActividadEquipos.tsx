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
  Build,
  Add,
  Edit,
  Delete,
  FilterList,
  Refresh,
  Schedule,
  Person,
  LocationOn,
  Memory,
  SwapHoriz
} from '@mui/icons-material'
import { equipoService, type ActividadEquipo } from '../../services/equipoService'
import { laboratorioService, type Laboratorio } from '../../services/laboratorioService'
import { useApi } from '../../hooks/useApi'

interface ActividadEquiposProps {
  open: boolean
  onClose: () => void
}

export const ActividadEquipos: React.FC<ActividadEquiposProps> = ({ open, onClose }) => {
  const { execute } = useApi()
  const [actividad, setActividad] = useState<ActividadEquipo[]>([])
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

    const result = await execute(() => equipoService.getActividad(filtersToSend))

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

  const getTipoMovimientoColor = (tipo: string, tipoRegistro: string) => {
    if (tipoRegistro === 'crud') {
      switch (tipo) {
        case 'crear': return 'success'
        case 'actualizar': return 'info'
        case 'eliminar': return 'error'
        default: return 'default'
      }
    } else {
      switch (tipo) {
        case 'entrada': return 'success'
        case 'reserva': return 'warning'
        case 'devolucion': return 'info'
        default: return 'default'
      }
    }
  }

  const getTipoMovimientoIcon = (tipo: string, tipoRegistro: string) => {
    if (tipoRegistro === 'crud') {
      switch (tipo) {
        case 'crear': return <Add />
        case 'actualizar': return <Edit />
        case 'eliminar': return <Delete />
        default: return <Build />
      }
    } else {
      switch (tipo) {
        case 'entrada': return <Add />
        case 'reserva': return <SwapHoriz />
        case 'devolucion': return <SwapHoriz />
        default: return <Memory />
      }
    }
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

  const formatTipoMovimiento = (tipo: string, tipoRegistro: string) => {
    if (tipoRegistro === 'crud') {
      switch (tipo) {
        case 'crear': return 'Creado'
        case 'actualizar': return 'Actualizado'
        case 'eliminar': return 'Eliminado'
        default: return tipo
      }
    } else {
      switch (tipo) {
        case 'entrada': return 'Ingreso'
        case 'reserva': return 'Reserva'
        case 'devolucion': return 'Devolución'
        default: return tipo
      }
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, height: '90vh' } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <History color="primary" />
            Actividad de Equipos
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
                  <MenuItem key={lab.id} value={lab.id.toString()}>
                    {lab.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              type="date"
              label="Fecha inicio"
              value={filters.fecha_inicio}
              onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              size="small"
              type="date"
              label="Fecha fin"
              value={filters.fecha_fin}
              onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <FormControl size="small">
              <InputLabel>Tipo de actividad</InputLabel>
              <Select
                value={filters.tipo_movimiento}
                label="Tipo de actividad"
                onChange={(e) => handleFilterChange('tipo_movimiento', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="crear">Creación</MenuItem>
                <MenuItem value="actualizar">Actualización</MenuItem>
                <MenuItem value="eliminar">Eliminación</MenuItem>
                <MenuItem value="entrada">Ingreso</MenuItem>
                <MenuItem value="reserva">Reserva</MenuItem>
                <MenuItem value="devolucion">Devolución</MenuItem>
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
                  <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Equipo</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Marca/Modelo</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Cantidad</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Laboratorio</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Usuario</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Detalles</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {actividad.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <History sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No hay actividad registrada
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          No se encontraron registros de actividad con los filtros aplicados
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  actividad.map((registro) => (
                    <TableRow key={`${registro.tipo_registro}-${registro.id}`} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Schedule fontSize="small" color="action" />
                          <Typography variant="body2">
                            {formatFecha(registro.fecha_movimiento)}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Chip
                          icon={getTipoMovimientoIcon(registro.tipo_movimiento, registro.tipo_registro)}
                          label={formatTipoMovimiento(registro.tipo_movimiento, registro.tipo_registro)}
                          color={getTipoMovimientoColor(registro.tipo_movimiento, registro.tipo_registro)}
                          variant="filled"
                          size="small"
                        />
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Memory fontSize="small" color="action" />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {registro.equipo_nombre}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {registro.equipo_codigo}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {registro.equipo_marca && registro.equipo_modelo
                            ? `${registro.equipo_marca} ${registro.equipo_modelo}`
                            : registro.equipo_marca || registro.equipo_modelo || 'N/A'
                          }
                        </Typography>
                      </TableCell>

                      <TableCell>
                        {registro.cantidad ? (
                          <Chip
                            label={registro.cantidad}
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        {registro.laboratorio_nombre ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationOn fontSize="small" color="action" />
                            <Typography variant="body2">
                              {registro.laboratorio_nombre}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Person fontSize="small" color="action" />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {registro.usuario_nombre}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {registro.usuario_rol}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Tooltip title={registro.observaciones} arrow>
                          <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {registro.observaciones}
                          </Typography>
                        </Tooltip>
                        {registro.reserva_descripcion && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Reserva: {registro.reserva_descripcion}
                          </Typography>
                        )}
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
              Mostrando {actividad.length} registros de actividad de equipos
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
