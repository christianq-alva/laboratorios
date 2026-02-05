import React, { useState, useEffect } from 'react'
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Tooltip,
  Badge,
  TextField,
  Select,
  FormControl,
  InputLabel,
  Button,
  Card,
  CardContent,
  TablePagination,
} from '@mui/material'
import {
  MoreVert,
  Edit,
  Delete,
  Schedule,
  Person,
  LocationOn,
  CalendarMonth,
  AccessTime,
  Inventory,
  Group,
  Visibility,
  FilterList,
  ClearAll,
} from '@mui/icons-material'
import { horarioService } from '../../services/horarioService'
import { laboratorioService } from '../../services/laboratorioService'
import { escuelaService } from '../../services/escuelaService'
import { docenteService } from '../../services/docenteService'
import { cicloService } from '../../services/cicloService'
import type { HorarioSimple } from '../../services/horarioService'
import { useApi } from '../../hooks/useApi'

interface HorariosTableProps {
  onEdit: (horario: HorarioSimple) => void
  onDelete: (horario: HorarioSimple) => void
  onView?: (horario: HorarioSimple) => void
  refresh: boolean
  onRefreshComplete: () => void
}

interface Filters {
  laboratorio_id: string
  escuela_id: string
  docente_id: string
  ciclo_id: string
  fecha_inicio: string
  fecha_fin: string
  estado: string
}

interface SelectOption {
  id: number
  nombre: string
}

function getDefaultStartDate(): string {
  const date = new Date()
  date.setDate(date.getDate() - 30)
  return date.toISOString().split('T')[0]
}

function getDefaultEndDate(): string {
  return new Date().toISOString().split('T')[0]
}

export const HorariosTable: React.FC<HorariosTableProps> = ({
  onEdit,
  onDelete,
  onView,
  refresh,
  onRefreshComplete,
}) => {
  const [horarios, setHorarios] = useState<HorarioSimple[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedHorario, setSelectedHorario] = useState<HorarioSimple | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const { execute } = useApi()

  // Estados para opciones de selects
  const [laboratorios, setLaboratorios] = useState<SelectOption[]>([])
  const [escuelas, setEscuelas] = useState<SelectOption[]>([])
  const [docentes, setDocentes] = useState<SelectOption[]>([])
  const [ciclos, setCiclos] = useState<SelectOption[]>([])

  // Estado para filtros - con valores por defecto
  const [filters, setFilters] = useState<Filters>({
    laboratorio_id: '',
    escuela_id: '',
    docente_id: '',
    ciclo_id: '',
    fecha_inicio: getDefaultStartDate(),
    fecha_fin: getDefaultEndDate(),
    estado: '',
  })

  // Cargar opciones de selects
  const loadSelectOptions = async () => {
    try {
      const [labResult, escResult, docResult, cicResult] = await Promise.all([
        execute(() => laboratorioService.getAll()),
        execute(() => escuelaService.getAll()),
        execute(() => docenteService.getAll()),
        execute(() => cicloService.getAll()),
      ])

      if (labResult.data?.data) {
        const sortedLabs = [...labResult.data.data].sort((a, b) => a.nombre.localeCompare(b.nombre))
        setLaboratorios(sortedLabs)
      }
      if (escResult.data?.data) {
        const sortedEscuelas = [...escResult.data.data].sort((a, b) => a.nombre.localeCompare(b.nombre))
        setEscuelas(sortedEscuelas)
      }
      if (docResult.data?.data) {
        const sortedDocentes = [...docResult.data.data].sort((a, b) => a.nombre.localeCompare(b.nombre))
        setDocentes(sortedDocentes)
      }
      if (cicResult.data?.data) {
        setCiclos(cicResult.data.data)
      }
    } catch (err) {
      console.error('Error loading select options:', err)
    }
  }

  const fetchHorarios = async () => {
    setLoading(true)
    setError(null)

    const filterParams: any = {}
    if (filters.laboratorio_id) filterParams.laboratorio_id = parseInt(filters.laboratorio_id)
    if (filters.escuela_id) filterParams.escuela_id = parseInt(filters.escuela_id)
    if (filters.docente_id) filterParams.docente_id = parseInt(filters.docente_id)
    if (filters.ciclo_id) filterParams.ciclo_id = parseInt(filters.ciclo_id)
    if (filters.fecha_inicio) filterParams.fecha_inicio = filters.fecha_inicio
    if (filters.fecha_fin) filterParams.fecha_fin = filters.fecha_fin
    if (filters.estado) filterParams.estado = filters.estado

    const result = await execute(() => horarioService.getAll(filterParams))

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setHorarios(result.data.data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadSelectOptions()
  }, [])

  useEffect(() => {
    setPage(0)
    fetchHorarios()
  }, [filters])

  useEffect(() => {
    setPage(0)
    fetchHorarios().then(() => {
      onRefreshComplete?.()
    })
  }, [refresh])

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, horario: HorarioSimple) => {
    setAnchorEl(event.currentTarget)
    setSelectedHorario(horario)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedHorario(null)
  }

  const handleEdit = () => {
    if (selectedHorario) {
      onEdit(selectedHorario)
    }
    handleMenuClose()
  }

  const handleDelete = () => {
    if (selectedHorario) {
      onDelete(selectedHorario)
    }
    handleMenuClose()
  }

  const handleView = () => {
    if (selectedHorario && onView) {
      onView(selectedHorario)
    }
    handleMenuClose()
  }

  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleResetFilters = () => {
    setFilters({
      laboratorio_id: '',
      escuela_id: '',
      docente_id: '',
      ciclo_id: '',
      fecha_inicio: getDefaultStartDate(),
      fecha_fin: getDefaultEndDate(),
      estado: '',
    })
    setPage(0)
  }

  // Funciones para manejar la paginación
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  // Calcular los horarios a mostrar según la página actual
  const paginatedHorarios = horarios.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  // Formatear fecha y hora
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  if (loading && horarios.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <>
      {/* Panel de Filtros */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterList fontSize="small" />
              Filtros
            </Typography>
            <Button
              size="small"
              startIcon={<ClearAll />}
              onClick={handleResetFilters}
              variant="outlined"
            >
              Limpiar
            </Button>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            {/* Fecha Inicio */}
            <TextField
              label="Fecha Inicio"
              type="date"
              fullWidth
              size="small"
              value={filters.fecha_inicio}
              onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: getDefaultEndDate(), onKeyDown: (e) => e.preventDefault() }}
            />

            {/* Fecha Fin */}
            <TextField
              label="Fecha Fin"
              type="date"
              fullWidth
              size="small"
              value={filters.fecha_fin}
              onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ onKeyDown: (e) => e.preventDefault() }}
            />

            {/* Laboratorio */}
            <FormControl fullWidth size="small">
              <InputLabel>Laboratorio</InputLabel>
              <Select
                value={filters.laboratorio_id}
                label="Laboratorio"
                onChange={(e) => handleFilterChange('laboratorio_id', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {laboratorios.map(lab => (
                  <MenuItem key={lab.id} value={lab.id.toString()}>
                    {lab.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Escuela */}
            <FormControl fullWidth size="small">
              <InputLabel>Escuela</InputLabel>
              <Select
                value={filters.escuela_id}
                label="Escuela"
                onChange={(e) => handleFilterChange('escuela_id', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {escuelas.map(esc => (
                  <MenuItem key={esc.id} value={esc.id.toString()}>
                    {esc.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Docente */}
            <FormControl fullWidth size="small">
              <InputLabel>Docente</InputLabel>
              <Select
                value={filters.docente_id}
                label="Docente"
                onChange={(e) => handleFilterChange('docente_id', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {docentes.map(doc => (
                  <MenuItem key={doc.id} value={doc.id.toString()}>
                    {doc.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Ciclo */}
            <FormControl fullWidth size="small">
              <InputLabel>Ciclo</InputLabel>
              <Select
                value={filters.ciclo_id}
                label="Ciclo"
                onChange={(e) => handleFilterChange('ciclo_id', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {ciclos.map(ciclo => (
                  <MenuItem key={ciclo.id} value={ciclo.id.toString()}>
                    {ciclo.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Estado */}
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={filters.estado}
                label="Estado"
                onChange={(e) => handleFilterChange('estado', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="P">Programado</MenuItem>
                <MenuItem value="C">Cerrado</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Mensaje de error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabla */}
      {horarios.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Schedule sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No hay horarios registrados
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Crea el primer horario usando el botón "Nuevo Horario"
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>Laboratorio</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Docente</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Fecha & Hora</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Ciclo</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Descripción</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Insumos</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
            {paginatedHorarios.map((horario) => {
              const fechaInicio = formatDateTime(horario.fecha_inicio)
              const fechaFin = formatDateTime(horario.fecha_fin)

              return (
                <TableRow key={horario.id} hover>
                  {/* Laboratorio */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn fontSize="small" color="primary" />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {horario.laboratorio}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {horario.laboratorio_id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Docente */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person fontSize="small" color="action" />
                      <Typography variant="body2">
                        {horario.docente}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Fecha & Hora */}
                  <TableCell>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <CalendarMonth fontSize="small" color="action" />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {fechaInicio.date}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTime fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {fechaInicio.time} - {fechaFin.time}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Ciclo */}
                  <TableCell>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Group fontSize="small" color="action" />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {horario.ciclo}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {horario.escuela}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Descripción */}
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={horario.descripcion}
                    >
                      {horario.descripcion}
                    </Typography>
                  </TableCell>

                  {/* Insumos */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Inventory fontSize="small" color="action" />
                      <Badge
                        badgeContent={horario.insumos_requeridos}
                        color="primary"
                        showZero
                      >
                        <Chip
                          label="Ver"
                          size="small"
                          variant="outlined"
                          sx={{ cursor: onView ? 'pointer' : 'default' }}
                          onClick={onView ? () => onView(horario) : undefined}
                        />
                      </Badge>
                    </Box>
                  </TableCell>

                  {/* Estado */}
                  <TableCell>
                    <Chip
                      label={horario.estado == 'C' ? "Cerrado" : "Programado"}
                      color={horario.estado == 'C' ? "default" : "success"}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>

                  {/* Acciones */}
                  <TableCell align="center">
                    <Tooltip title="Más opciones">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, horario)}
                        sx={{ color: 'grey.600' }}
                      >
                        <MoreVert />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={horarios.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
        </TableContainer>
      )}

      {/* Menú contextual */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { boxShadow: 3, borderRadius: 2 }
        }}
      >
        {onView && (
          <MenuItem onClick={handleView}>
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            <ListItemText>Ver detalles</ListItemText>
          </MenuItem>
        )}

        <MenuItem 
          onClick={handleEdit}
          disabled={selectedHorario?.estado === 'C'}
        >
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar horario</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Eliminar horario</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}