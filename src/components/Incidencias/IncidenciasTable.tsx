import React, { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem as SelectMenuItem,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Autocomplete
} from '@mui/material'
import {
  Visibility,
  ReportProblem,
  Search,
  Clear,
  Schedule,
  Person,
  LocationOn,
  CalendarToday,
  FilterList,
  MoreVert,
  Delete
} from '@mui/icons-material'
import { incidenciaService, type Incidencia } from '../../services/incidenciaService'
import { laboratorioService, type Laboratorio } from '../../services/laboratorioService'
import dayjs from 'dayjs'
import { useApi } from '../../hooks/useApi'

interface IncidenciasTableProps {
  onView?: (incidencia: Incidencia) => void
  onDelete?: (incidencia: Incidencia) => void
  refresh?: boolean
  onRefreshComplete?: () => void
}

export const IncidenciasTable: React.FC<IncidenciasTableProps> = ({
  onView,
  onDelete,
  refresh,
  onRefreshComplete
}) => {
  const { execute } = useApi()
  const [incidencias, setIncidencias] = useState<Incidencia[]>([])
  const [filteredIncidencias, setFilteredIncidencias] = useState<Incidencia[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para el menú contextual
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedIncidencia, setSelectedIncidencia] = useState<Incidencia | null>(null)

  // Estados para laboratorios
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [filtroLaboratorioObj, setFiltroLaboratorioObj] = useState<Laboratorio | null>(null)

  // Filtros avanzados
  const [filtroFecha, setFiltroFecha] = useState('')
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('')
  const [filtroFechaFin, setFiltroFechaFin] = useState('')
  const [filtroLaboratorio, setFiltroLaboratorio] = useState('')
  const [filtroDocente, setFiltroDocente] = useState('')
  const [filtroReportadoPor, setFiltroReportadoPor] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  // Cargar laboratorios
  const loadLaboratorios = async () => {
    const response = await execute(() => laboratorioService.getAll())
    if (response.data) {
      setLaboratorios(response.data)
    }
  }

  // Cargar datos
  const loadData = async () => {
    setLoading(true)
    setError(null)

    const response = await execute(() => incidenciaService.getAll())
    if (response.error) {
      setError(response.error)
    } else if (response.data) {
      setIncidencias(response.data.data || [])
      setFilteredIncidencias(response.data.data || [])
    }
    setLoading(false)
    onRefreshComplete?.() //Temporalmente
  }

  // Efecto para cargar datos iniciales
  useEffect(() => {
    loadData()
    loadLaboratorios()
  }, [])

  // Efecto para refrescar cuando cambia el refresh prop
  useEffect(() => {
    if (refresh !== undefined) {
      loadData()
    }
  }, [refresh])

  // Efecto para aplicar filtros
  useEffect(() => {
    let filtered = incidencias

    // Filtro de búsqueda general
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(incidencia =>
        incidencia.titulo.toLowerCase().includes(searchLower) ||
        incidencia.descripcion.toLowerCase().includes(searchLower) ||
        incidencia.laboratorio.toLowerCase().includes(searchLower) ||
        incidencia.docente.toLowerCase().includes(searchLower) ||
        incidencia.reportado_por.toLowerCase().includes(searchLower)
      )
    }

    // Filtros específicos
    if (filtroFecha) {
      filtered = filtered.filter(incidencia =>
        incidencia.fecha_reporte.includes(filtroFecha) ||
        incidencia.fecha_clase.includes(filtroFecha)
      )
    }

    // Filtro por rango de fechas
    if (filtroFechaInicio || filtroFechaFin) {
      filtered = filtered.filter(incidencia => {
        const fechaReporte = dayjs(incidencia.fecha_reporte)
        const fechaInicio = filtroFechaInicio ? dayjs(filtroFechaInicio) : null
        const fechaFin = filtroFechaFin ? dayjs(filtroFechaFin) : null

        if (fechaInicio && fechaFin) {
          return fechaReporte.isAfter(fechaInicio.subtract(1, 'day')) && fechaReporte.isBefore(fechaFin.add(1, 'day'))
        } else if (fechaInicio) {
          return fechaReporte.isAfter(fechaInicio.subtract(1, 'day'))
        } else if (fechaFin) {
          return fechaReporte.isBefore(fechaFin.add(1, 'day'))
        }
        return true
      })
    }
    if (filtroLaboratorio) {
      filtered = filtered.filter(incidencia =>
        incidencia.laboratorio.toLowerCase().includes(filtroLaboratorio.toLowerCase())
      )
    }
    if (filtroDocente) {
      filtered = filtered.filter(incidencia =>
        incidencia.docente.toLowerCase().includes(filtroDocente.toLowerCase())
      )
    }
    if (filtroReportadoPor) {
      filtered = filtered.filter(incidencia =>
        incidencia.reportado_por.toLowerCase().includes(filtroReportadoPor.toLowerCase())
      )
    }

    // Filtro por tipo de incidencia (basado en fecha)
    if (filtroEstado) {
      const ahora = dayjs()
      filtered = filtered.filter(incidencia => {
        const fechaReporte = dayjs(incidencia.fecha_reporte)
        const diasDiferencia = ahora.diff(fechaReporte, 'day')

        switch (filtroEstado) {
          case 'reciente':
            return diasDiferencia <= 1
          case 'semana':
            return diasDiferencia <= 7
          case 'mes':
            return diasDiferencia <= 30
          case 'antigua':
            return diasDiferencia > 30
          default:
            return true
        }
      })
    }

    setFilteredIncidencias(filtered)
  }, [incidencias, searchTerm, filtroFecha, filtroFechaInicio, filtroFechaFin, filtroLaboratorio, filtroDocente, filtroReportadoPor, filtroEstado])

  // Función para limpiar todos los filtros
  const limpiarFiltros = () => {
    setSearchTerm('')
    setFiltroFecha('')
    setFiltroFechaInicio('')
    setFiltroFechaFin('')
    setFiltroLaboratorio('')
    setFiltroLaboratorioObj(null)
    setFiltroDocente('')
    setFiltroReportadoPor('')
    setFiltroEstado('')
    setFilteredIncidencias(incidencias)
  }

  // Función para limpiar búsqueda
  const handleClearSearch = () => {
    setSearchTerm('')
  }

  // Función para formatear fecha
  const formatFecha = (fecha: string) => {
    return dayjs(fecha).format('DD/MM/YYYY HH:mm')
  }

  // Función para obtener el color del chip según la fecha
  const getFechaColor = (fecha: string) => {
    const fechaIncidencia = dayjs(fecha)
    const ahora = dayjs()
    const diferencia = ahora.diff(fechaIncidencia, 'day')

    if (diferencia <= 1) return 'error' // Últimas 24 horas
    if (diferencia <= 7) return 'warning' // Última semana
    return 'default' // Más antigua
  }

  // Manejo del menú contextual
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, incidencia: Incidencia) => {
    setAnchorEl(event.currentTarget)
    setSelectedIncidencia(incidencia)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedIncidencia(null)
  }

  const handleView = () => {
    if (selectedIncidencia && onView) {
      onView(selectedIncidencia)
    }
    handleMenuClose()
  }

  const handleDelete = () => {
    if (selectedIncidencia && onDelete) {
      onDelete(selectedIncidencia)
    }
    handleMenuClose()
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    )
  }

  return (
    <Box>
      {/* Barra de búsqueda */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReportProblem color="primary" />
            Incidencias Reportadas
          </Typography>

        </Box>

        {/* Barra de búsqueda y filtros */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TextField
            placeholder="Buscar incidencias por título, descripción, laboratorio, docente..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <Search sx={{ color: 'text.secondary', mr: 1 }} />
              ),
              endAdornment: searchTerm && (
                <IconButton
                  size="small"
                  onClick={handleClearSearch}
                  sx={{ color: 'text.secondary' }}
                >
                  <Clear />
                </IconButton>
              )
            }}
          />

          {incidencias.length > 5 && (
            <Button
              size="small"
              startIcon={<FilterList />}
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              variant="outlined"
              color={mostrarFiltros ? "primary" : "inherit"}
              sx={{ minWidth: 'auto' }}
            >
              {mostrarFiltros ? 'Ocultar' : 'Filtrar'}
              {(filtroFecha || filtroFechaInicio || filtroFechaFin || filtroLaboratorio || filtroDocente || filtroReportadoPor || filtroEstado) && (
                <Chip
                  label="!"
                  size="small"
                  color="warning"
                  sx={{ ml: 1, minWidth: 20, height: 20, fontSize: '0.75rem' }}
                />
              )}
            </Button>
          )}

          {searchTerm && (
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              {filteredIncidencias.length} resultado{filteredIncidencias.length !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>

        {/* Panel de filtros avanzados */}
        {mostrarFiltros && (
          <Box sx={{
            p: 2,
            mb: 2,
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            backgroundColor: '#f5f5f5'
          }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterList fontSize="small" />
              Filtros Avanzados ({filteredIncidencias.length} de {incidencias.length} incidencias)
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                size="small"
                label="Fecha específica (DD/MM/YYYY)"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                placeholder="Ej: 15/12/2024"
                sx={{ minWidth: 180 }}
              />

              <TextField
                size="small"
                type="date"
                label="Desde"
                value={filtroFechaInicio}
                onChange={(e) => setFiltroFechaInicio(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 120 }}
              />

              <TextField
                size="small"
                type="date"
                label="Hasta"
                value={filtroFechaFin}
                onChange={(e) => setFiltroFechaFin(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 120 }}
              />

              <Autocomplete
                size="small"
                options={laboratorios}
                getOptionLabel={(option) => `${option.nombre} - ${option.ubicacion}`}
                value={filtroLaboratorioObj}
                onChange={(event, newValue) => {
                  setFiltroLaboratorioObj(newValue)
                  setFiltroLaboratorio(newValue ? newValue.nombre : '')
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Laboratorio"
                    placeholder="Selecciona un laboratorio"
                  />
                )}
                sx={{ minWidth: 250 }}
              />

              <TextField
                size="small"
                label="Docente"
                value={filtroDocente}
                onChange={(e) => setFiltroDocente(e.target.value)}
                placeholder="Nombre del docente"
                sx={{ minWidth: 150 }}
              />

              <TextField
                size="small"
                label="Reportado por"
                value={filtroReportadoPor}
                onChange={(e) => setFiltroReportadoPor(e.target.value)}
                placeholder="Usuario que reportó"
                sx={{ minWidth: 150 }}
              />

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Tipo de incidencia</InputLabel>
                <Select
                  value={filtroEstado}
                  label="Tipo de incidencia"
                  onChange={(e) => setFiltroEstado(e.target.value)}
                >
                  <SelectMenuItem value="">Todas</SelectMenuItem>
                  <SelectMenuItem value="reciente">Recientes (últimas 24h)</SelectMenuItem>
                  <SelectMenuItem value="semana">Esta semana</SelectMenuItem>
                  <SelectMenuItem value="mes">Este mes</SelectMenuItem>
                  <SelectMenuItem value="antigua">Antiguas (+30 días)</SelectMenuItem>
                </Select>
              </FormControl>

              <Button
                size="small"
                startIcon={<Clear />}
                onClick={limpiarFiltros}
                variant="outlined"
                color="secondary"
              >
                Limpiar
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      {/* Tabla de incidencias */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600, width: '25%' }}>Título</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '15%' }}>Laboratorio</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '15%' }}>Docente</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '15%' }}>Fecha Clase</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '15%' }}>Fecha Reporte</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '10%' }}>Reportado Por</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '5%' }} align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredIncidencias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <ReportProblem sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No hay incidencias registradas
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {searchTerm || filtroFecha || filtroLaboratorio || filtroDocente || filtroReportadoPor
                        ? `No se encontraron incidencias con los filtros aplicados`
                        : 'No se han reportado incidencias en el sistema'
                      }
                    </Typography>
                    {(searchTerm || filtroFecha || filtroFechaInicio || filtroFechaFin || filtroLaboratorio || filtroDocente || filtroReportadoPor) && (
                      <Button
                        size="small"
                        onClick={limpiarFiltros}
                        sx={{ mt: 1 }}
                        variant="outlined"
                      >
                        Limpiar filtros
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredIncidencias.map((incidencia) => (
                <TableRow key={incidencia.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ReportProblem color="error" fontSize="small" />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                          {incidencia.titulo}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {incidencia.descripcion}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="body2">
                        {incidencia.laboratorio}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person fontSize="small" color="action" />
                      <Typography variant="body2">
                        {incidencia.docente}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Schedule fontSize="small" color="action" />
                      <Typography variant="body2">
                        {formatFecha(incidencia.fecha_clase)}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={formatFecha(incidencia.fecha_reporte)}
                      color={getFechaColor(incidencia.fecha_reporte)}
                      size="small"
                      variant="outlined"
                      icon={<CalendarToday fontSize="small" />}
                    />
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {incidencia.reportado_por}
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    <Tooltip title="Más opciones">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, incidencia)}
                        sx={{ color: 'grey.600' }}
                      >
                        <MoreVert />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Información adicional */}
      {filteredIncidencias.length > 0 && (
        <Box sx={{ p: 2, backgroundColor: 'grey.50', borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            Mostrando {filteredIncidencias.length} de {incidencias.length} incidencia{incidencias.length !== 1 ? 's' : ''}
            {searchTerm && (
              <> que coinciden con "{searchTerm}"</>
            )}
          </Typography>
        </Box>
      )}

      {/* Menú contextual */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: { boxShadow: 3, borderRadius: 2 }
        }}
      >
        {onView && (
          <MenuItem onClick={handleView}>
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            <ListItemText>Ver Incidencia</ListItemText>
          </MenuItem>
        )}

        {onDelete && (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <Delete fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Eliminar Incidencia</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  )
} 