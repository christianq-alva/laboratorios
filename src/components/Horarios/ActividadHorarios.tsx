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
  Tooltip,
  TablePagination,
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
  Lock,
  LockOpen,
} from '@mui/icons-material'
import { horarioService, type ActividadHorario } from '../../services/horarioService'
import { laboratorioService, type Laboratorio } from '../../services/laboratorioService'
import { useApi } from '../../hooks/useApi'
import { usuarioService, type Usuario } from '../../services/usuarioService'
import { useAuth } from '../../hooks/useAuth'

interface ActividadHorariosProps {
  open: boolean
  onClose: () => void
}

export const ActividadHorarios: React.FC<ActividadHorariosProps> = ({ open, onClose }) => {
  const { execute } = useApi()
  const { user } = useAuth()
  const [actividad, setActividad] = useState<ActividadHorario[]>([])
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [filters, setFilters] = useState({
    laboratorio_id: '',
    fecha_inicio: '',
    fecha_fin: '',
    accion: '',
    usuario_id: ''
  })

  // Paginación
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

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
      setUsuarios(response.data.data)
    }
  }
  const loadActividad = async () => {
    setLoading(true)
    setError(null)
    setPage(0)

    const filtersToSend: any = {}
    if (filters.laboratorio_id) filtersToSend.laboratorio_id = parseInt(filters.laboratorio_id)
    if (filters.fecha_inicio) filtersToSend.fecha_inicio = filters.fecha_inicio
    if (filters.fecha_fin) filtersToSend.fecha_fin = filters.fecha_fin
    if (filters.accion) filtersToSend.accion = filters.accion
    if (filters.usuario_id) filtersToSend.usuario_id = parseInt(filters.usuario_id)

    const result = await execute(() => horarioService.getActividad(filtersToSend))

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
      accion: '',
      usuario_id: ''
    })
    setPage(0)
  }

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const paginatedActividad = actividad.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  const getAccionColor = (accion: string) => {
    switch (accion) {
      case 'crear': return 'success'
      case 'editar': return 'warning'
      case 'eliminar': return 'error'
      case 'cerrar': return 'info'
      case 'reabrir': return 'success'
      default: return 'default'
    }
  }

  const getAccionIcon = (accion: string) => {
    switch (accion) {
      case 'crear': return <Add />
      case 'editar': return <Edit />
      case 'eliminar': return <Delete />
      case 'cerrar': return <Lock />
      case 'reabrir': return <LockOpen />
      default: return <History />
    }
  }

  const getAccionLabel = (accion: string) => {
    switch (accion) {
      case 'crear': return 'Crear'
      case 'editar': return 'Editar'
      case 'eliminar': return 'Eliminar'
      case 'cerrar': return 'Cerrar'
      case 'reabrir': return 'Reabrir'
      default: return accion
    }
  }

  const formatFecha = (fecha: string) => {
    if (!fecha) return 'N/A'
    try {
      const fechaObj = new Date(fecha)
      if (isNaN(fechaObj.getTime())) {
        return 'Fecha inválida'
      }
      // Formatear en zona horaria de Perú
      return fechaObj.toLocaleString('es-PE', {
        timeZone: 'America/Lima',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(',', '')
    } catch (error) {
      return 'Error en fecha'
    }
  }

  const formatFechaHorario = (fecha: string) => {
    if (!fecha) return 'N/A'
    try {
      const fechaObj = new Date(fecha)
      if (isNaN(fechaObj.getTime())) {
        return 'Fecha inválida'
      }
      // Formatear en zona horaria de Perú
      return fechaObj.toLocaleString('es-PE', {
        timeZone: 'America/Lima',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(',', '')
    } catch (error) {
      return 'Error en fecha'
    }
  }


  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <History color="primary" />
            Actividad de Horarios
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
              <InputLabel>Acción</InputLabel>
              <Select
                value={filters.accion}
                label="Acción"
                onChange={(e) => handleFilterChange('accion', e.target.value)}
              >
                <MenuItem value="">Todas las acciones</MenuItem>
                <MenuItem value="crear">Crear</MenuItem>
                <MenuItem value="editar">Editar</MenuItem>
                <MenuItem value="eliminar">Eliminar</MenuItem>
                <MenuItem value="cerrar">Cerrar</MenuItem>
                <MenuItem value="reabrir">Reabrir</MenuItem>
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
                  <TableCell sx={{ fontWeight: 600 }}>Acción</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Descripción</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Horario</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Laboratorio</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Docente</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Usuario</TableCell>
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
                          No se encontraron registros de actividad con los filtros aplicados
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedActividad.map((registro) => (
                    <TableRow key={registro.actividad_id} hover>
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
                          icon={getAccionIcon(registro.accion)}
                          label={getAccionLabel(registro.accion)}
                          color={getAccionColor(registro.accion)}
                          size="small"
                          variant="filled"
                        />
                      </TableCell>

                      <TableCell>
                        <Tooltip title={registro.descripcion} arrow>
                          <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {registro.descripcion}
                          </Typography>
                        </Tooltip>
                      </TableCell>

                      <TableCell>
                        <Box>
                          {(() => {
                            if (registro.fecha_inicio && registro.fecha_fin) {
                              return (
                                <>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {formatFechaHorario(registro.fecha_inicio)} - {formatFechaHorario(registro.fecha_fin)}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {registro.cantidad_alumnos} alumnos
                                  </Typography>
                                </>
                              )
                            } else {
                              return (
                                <Typography variant="body2" color="text.secondary">
                                  Datos no disponibles
                                </Typography>
                              )
                            }
                          })()}
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationOn fontSize="small" color="action" />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {registro.laboratorio_nombre}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {registro.laboratorio_ubicacion !== 'Ubicación N/A' ? registro.laboratorio_ubicacion : 'Ubicación no disponible'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Person fontSize="small" color="action" />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {registro.docente_nombre}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {`${registro.ciclo_nombre} - ${registro.escuela_nombre}`}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Person fontSize="small" color="primary" />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {registro.usuario_nombre_completo}
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
            {actividad.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={actividad.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                }
              />
            )}
          </TableContainer>
        )}

        {/* Resumen */}
        {actividad.length > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Mostrando {actividad.length} registros de actividad de horarios
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
