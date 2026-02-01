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
  Edit,
  Delete,
  FilterList,
  Refresh,
  Schedule,
  Person,
  LocationOn,
  Memory,
} from '@mui/icons-material'
import { equipoService, type ActividadEquipo } from '../../services/equipoService'
import { laboratorioService, type Laboratorio } from '../../services/laboratorioService'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../hooks/useAuth'
import { usuarioService, type Usuario } from '../../services/usuarioService'
interface ActividadEquiposProps {
  open: boolean
  onClose: () => void
}

export const ActividadEquipos: React.FC<ActividadEquiposProps> = ({ open, onClose }) => {
  const { execute } = useApi()
  const { user } = useAuth()
  const [actividad, setActividad] = useState<ActividadEquipo[]>([])
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [filters, setFilters] = useState({
    laboratorio_id: '',
    fecha_inicio: '',
    fecha_fin: '',
    tipo_movimiento: '',
    usuario_id: ''
  })

  // Cargar datos iniciales
  useEffect(() => {
    if (open) {
      loadLaboratorios()
      if (user?.rol === 'Administrador') {
        loadUsuarios()
      }
      loadActividad()
    }
  }, [open, user])

  const loadLaboratorios = async () => {
    const response = await execute(() => laboratorioService.getAll())
    if (response.error) {
      setError(response.error)
    } else if (response.data) {
      const sortedLaboratorios = [...(response.data.data || [])].sort((a, b) => a.nombre.localeCompare(b.nombre))
      setLaboratorios(sortedLaboratorios)
    }
  }

  const loadUsuarios = async () => {
    const response = await execute(() => usuarioService.getAll())
    if (response.error) {
      setError(response.error)
    } else if (response.data) {
      setUsuarios(response.data.data || [])
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
    if (filters.usuario_id) filtersToSend.usuario_id = parseInt(filters.usuario_id)
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
      tipo_movimiento: '',
      usuario_id: ''
    })
  }
  const handleOnClose = () => {
    setError(null)
    setActividad([])
    setLaboratorios([])
    setLoading(false)
    handleClearFilters()
    onClose()
  }

  const getTipoActividadColor = (tipoActividad: string) => {
    switch (tipoActividad) {
      case 'crear': return 'success'
      case 'actualizar': return 'info'
      case 'eliminar': return 'error'
      default: return 'default'
    }
  }

  const getTipoActividadIcon = (tipoActividad: string) => {
    switch (tipoActividad) {
      case 'crear': return <Add />
      case 'actualizar': return <Edit />
      case 'eliminar': return <Delete />
      default: return <History />
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

  const formatTipoActividad = (tipoActividad: string) => {
    switch (tipoActividad) {
      case 'crear': return 'Creado'
      case 'actualizar': return 'Actualizado'
      case 'eliminar': return 'Eliminado'
      default: return tipoActividad
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleOnClose}
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
          <IconButton onClick={handleOnClose}>
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
              </Select>
            </FormControl>
            {user?.rol === 'Administrador' && (
              <FormControl size="small">
                <InputLabel>Usuario</InputLabel>
                <Select
                  value={filters.usuario_id}
                  label="Usuario"
                  onChange={(e) => handleFilterChange('usuario_id', e.target.value)}
                >
                  <MenuItem value="">Todos los usuarios</MenuItem>
                  {usuarios.map((usuario) => (
                    <MenuItem key={usuario.id} value={usuario.id}>
                      {usuario.nombre_completo} ({usuario.rol_nombre})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
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
                  <TableCell sx={{ fontWeight: 600 }}>Detalles</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Equipo</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Marca/Modelo</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Laboratorio</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Usuario</TableCell>

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
                    <TableRow key={`${registro.tipo_actividad}-${registro.id}`} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Schedule fontSize="small" color="action" />
                          <Typography variant="body2">
                            {formatFecha(registro.fecha_actividad)}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Chip
                          icon={getTipoActividadIcon(registro.tipo_actividad)}
                          label={formatTipoActividad(registro.tipo_actividad)}
                          color={getTipoActividadColor(registro.tipo_actividad)}
                          variant="filled"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title={registro.observaciones} arrow>
                          <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {registro.observaciones}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Memory fontSize="small" color="action" />
                          <Box>
                            {registro.equipo_nombre ? (
                              <>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {registro.equipo_nombre}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {registro.equipo_codigo}
                                </Typography>
                              </>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Equipo eliminado
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        {registro.equipo_nombre ? (
                          <Typography variant="body2">
                            {registro.equipo_marca && registro.equipo_modelo
                              ? `${registro.equipo_marca} ${registro.equipo_modelo}`
                              : registro.equipo_marca || registro.equipo_modelo || 'N/A'
                            }
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Equipo eliminado
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        {registro.equipo_nombre ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationOn fontSize="small" color="action" />
                            <Typography variant="body2">
                              {registro.laboratorio_nombre || '-'}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Equipo eliminado
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
        <Button onClick={handleOnClose} variant="outlined">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
