import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Collapse,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import {
  Schedule,
  LocationOn,
  Person,
  Group,
  Edit,
  Delete,
  Visibility,
  FilterList,
  ChevronLeft,
  ChevronRight,
  Today,
  Share,
  Download,
} from '@mui/icons-material'
import { horarioService, type Horario } from '../../services/horarioService'
import { laboratorioService, type Laboratorio } from '../../services/laboratorioService'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import isoWeek from 'dayjs/plugin/isoWeek'
import isBetween from 'dayjs/plugin/isBetween'
import './CalendarioSimple.css'
import { TIME_BLOCKS } from '../../utils/timeBlocks'

// Configurar dayjs
dayjs.extend(isoWeek)
dayjs.extend(isBetween)
dayjs.locale('es')

interface HorarioEvento {
  id: number
  laboratorio: string
  docente: string
  grupo: string
  descripcion: string
  horaInicio: string
  horaFin: string
  color: string
  cantidad_alumnos?: number
  horarioOriginal: Horario
}

interface CalendarioSimpleProps {
  onEdit?: (horario: Horario) => void
  onDelete?: (horario: Horario) => void
  onView?: (horario: Horario) => void
  onNewHorario?: () => void
  onShare?: (laboratorioId?: number) => void
  onExport?: () => void
  refresh?: boolean
  onRefreshComplete?: () => void
}

// Colores por tipo de actividad - Paleta UPeU
const getColorByTipo = (descripcion: string | null | undefined): string => {
  if (!descripcion) return '#6b7280' // Gris
  
  const desc = descripcion.toLowerCase()
  if (desc.includes('reproductor')) return '#d32f2f' // Rojo
  if (desc.includes('neurología') || desc.includes('neurologia')) return '#2e5984' // Azul medio
  if (desc.includes('señalización') || desc.includes('señalizacion')) return '#f4a900' // Dorado UPeU
  if (desc.includes('histología') || desc.includes('histologia')) return '#4a6fa5' // Azul claro
  if (desc.includes('fisioex') || desc.includes('physioex')) return '#2e7d32' // Verde
  return '#1e3a5f' // Azul UPeU por defecto
}

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export const CalendarioSimple: React.FC<CalendarioSimpleProps> = ({
  onEdit,
  onDelete,
  onView,
  onNewHorario,
  onShare,
  onExport,
  refresh = false,
  onRefreshComplete,
}) => {
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Horario | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentWeek, setCurrentWeek] = useState(dayjs().startOf('isoWeek'))
  
  // Estados para laboratorios (jefes con múltiples labs)
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [selectedLaboratorio, setSelectedLaboratorio] = useState<number | 'all'>('all')
  const [userRole, setUserRole] = useState<string>('')
  
  // Estados para filtros
  const [filtroLaboratorio, setFiltroLaboratorio] = useState<string>('')
  const [filtroDocente, setFiltroDocente] = useState<string>('')
  const [filtroGrupo, setFiltroGrupo] = useState<string>('')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  // Cargar laboratorios del usuario
  const fetchLaboratorios = useCallback(async () => {
    try {
      const result = await laboratorioService.getAll()
      if (result.success) {
        setLaboratorios(result.data || [])
        setUserRole(result.user_role || '')
        
        // Si es jefe de laboratorio y solo tiene un lab, seleccionarlo automáticamente
        if (result.user_role === 'Jefe de Laboratorio' && result.data?.length === 1) {
          setSelectedLaboratorio(result.data[0].id)
        }
      }
    } catch (err) {
      console.error('Error al cargar laboratorios:', err)
    }
  }, [])

  // Cargar horarios
  const fetchHorarios = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await horarioService.getAll()
      
      if (result.success) {
        setHorarios(result.data || [])
        setUserRole(result.user_role || '')
      } else {
        setError(result.message || 'Error al cargar horarios')
      }
    } catch (err: unknown) {
      console.error('Error al cargar horarios:', err)
      setError('Error de conexión al cargar horarios')
    } finally {
      setLoading(false)
    }
  }, [])

  // Filtrar horarios por semana actual, laboratorio seleccionado y filtros
  const horariosSemana = useMemo(() => {
    const inicioSemana = currentWeek.startOf('isoWeek')
    const finSemana = currentWeek.endOf('isoWeek')
    
    return horarios.filter(horario => {
      // Verificar si el horario está en la semana actual
      const fechaHorario = dayjs(horario.fecha_inicio)
      if (!fechaHorario.isBetween(inicioSemana, finSemana, null, '[]')) {
        return false
      }
      
      // Filtrar por laboratorio seleccionado (solo para jefes con múltiples labs)
      if (selectedLaboratorio !== 'all') {
        const laboratorioSeleccionado = laboratorios.find(lab => lab.id === selectedLaboratorio)
        if (laboratorioSeleccionado && horario.laboratorio !== laboratorioSeleccionado.nombre) {
          return false
        }
      }
      
      // Aplicar filtros adicionales
      const cumpleLaboratorio = !filtroLaboratorio || 
        horario.laboratorio?.toLowerCase().includes(filtroLaboratorio.toLowerCase())
      const cumpleDocente = !filtroDocente || 
        horario.docente?.toLowerCase().includes(filtroDocente.toLowerCase())
      const cumpleGrupo = !filtroGrupo || 
        horario.grupo?.toLowerCase().includes(filtroGrupo.toLowerCase())
      
      return cumpleLaboratorio && cumpleDocente && cumpleGrupo
    })
  }, [horarios, currentWeek, selectedLaboratorio, laboratorios, filtroLaboratorio, filtroDocente, filtroGrupo])

  // Organizar eventos por día y hora
  const eventosPorDiaYHora = useMemo(() => {
    const eventos: Record<string, HorarioEvento[]> = {}
    
    DIAS_SEMANA.forEach((_, diaIndex) => {
      TIME_BLOCKS.forEach(block => {
        const key = `${diaIndex}-${block.start}`
        eventos[key] = []
      })
    })
    
    horariosSemana.forEach(horario => {
      const fecha = dayjs(horario.fecha_inicio)
      const diaIndex = fecha.isoWeekday() - 1 // 0 = Lunes, 4 = Viernes
      
      if (diaIndex >= 0 && diaIndex < 7) { // Todos los días de la semana
        const horaInicio = fecha.format('HH:mm')
        const horaFin = dayjs(horario.fecha_fin).format('HH:mm')
        
        // Encontrar el slot de tiempo correspondiente
        TIME_BLOCKS.forEach(block => {
          const slotStart = dayjs(`2024-01-01 ${block.start}`)
          const slotEnd = dayjs(`2024-01-01 ${block.end}`)
          const eventoStart = dayjs(`2024-01-01 ${horaInicio}`)
          const eventoEnd = dayjs(`2024-01-01 ${horaFin}`)
          
          // Verificar si el evento ocupa este slot
          if (
            (eventoStart.isBefore(slotEnd) && eventoEnd.isAfter(slotStart)) ||
            (eventoStart.isSame(slotStart) || eventoEnd.isSame(slotEnd))
          ) {
            const key = `${diaIndex}-${block.start}`
            if (!eventos[key]) eventos[key] = []
            
            eventos[key].push({
              id: horario.id,
              laboratorio: horario.laboratorio || '',
              docente: horario.docente || '',
              grupo: horario.grupo || '',
              descripcion: horario.descripcion || '',
              horaInicio,
              horaFin,
              color: horario.color || getColorByTipo(horario.descripcion),
              cantidad_alumnos: horario.cantidad_alumnos,
              horarioOriginal: horario
            })
          }
        })
      }
    })
    
    return eventos
  }, [horariosSemana])

  // Navegación de semanas
  const handlePreviousWeek = () => {
    setCurrentWeek(prev => prev.subtract(1, 'week'))
  }

  const handleNextWeek = () => {
    setCurrentWeek(prev => prev.add(1, 'week'))
  }

  const handleToday = () => {
    setCurrentWeek(dayjs().startOf('isoWeek'))
  }

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltroLaboratorio('')
    setFiltroDocente('')
    setFiltroGrupo('')
    // Resetear el selector de laboratorio para admin y jefes con múltiples labs
    if ((userRole === 'Jefe de Laboratorio' && laboratorios.length > 1) ||
        (userRole === 'Administrador' && laboratorios.length > 0)) {
      setSelectedLaboratorio('all')
    }
  }

  // Cargar datos al montar
  useEffect(() => {
    fetchLaboratorios()
    fetchHorarios()
    
    // Verificar si viene navegación desde dashboard
    const dashboardNav = localStorage.getItem('dashboard_navigation')
    if (dashboardNav) {
      try {
        const navData = JSON.parse(dashboardNav)
        // Verificar que la navegación sea reciente (últimos 5 segundos)
        if (Date.now() - navData.timestamp < 5000) {
          setSelectedLaboratorio(navData.laboratorioId)
          console.log('🎯 Navegación desde dashboard - Laboratorio seleccionado:', navData.laboratorioId)
        }
        // Limpiar la navegación
        localStorage.removeItem('dashboard_navigation')
      } catch (err) {
        console.error('Error al procesar navegación desde dashboard:', err)
      }
    }
  }, [fetchLaboratorios, fetchHorarios])

  // Refresh cuando se solicita (siempre que cambie la bandera), evitando el primer render
  const hasMountedRef = useRef(false)
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }
    Promise.all([fetchLaboratorios(), fetchHorarios()]).then(() => {
      onRefreshComplete?.()
    })
  }, [refresh, fetchLaboratorios, fetchHorarios, onRefreshComplete])

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
    <Box sx={{ p: 2 }}>
      {/* Header con navegación */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
              Calendario Semanal
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
              <Chip 
                label={`${horariosSemana.length} horarios`} 
                color="primary" 
                size="small"
              />
              <Chip 
                label={`${horarios.length} total`} 
                size="small"
                variant="outlined"
              />
              {selectedLaboratorio !== 'all' && laboratorios.length > 0 && (
                <Chip 
                  label={`${laboratorios.find(lab => lab.id === selectedLaboratorio)?.nombre || 'Laboratorio'}`}
                  color="secondary"
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
            
            {/* Selector de laboratorio para administradores y jefes con múltiples labs */}
            {((userRole === 'Jefe de Laboratorio' && laboratorios.length > 1) || 
              (userRole === 'Administrador' && laboratorios.length > 0)) && (
              <FormControl size="small" sx={{ minWidth: 200, mt: 1 }}>
                <InputLabel>Ver laboratorio</InputLabel>
                <Select
                  value={selectedLaboratorio}
                  label="Ver laboratorio"
                  onChange={(e) => setSelectedLaboratorio(e.target.value as number | 'all')}
                >
                  <MenuItem value="all">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn fontSize="small" />
                      Todos los laboratorios
                    </Box>
                  </MenuItem>
                  {laboratorios.map((lab) => (
                    <MenuItem key={lab.id} value={lab.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOn fontSize="small" />
                        {lab.nombre} - {lab.ubicacion}
                        {lab.escuela && (
                          <Typography variant="caption" sx={{ ml: 1, opacity: 0.7 }}>
                            ({lab.escuela})
                          </Typography>
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
          
          {/* Navegación de semanas */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={handlePreviousWeek} size="small">
                <ChevronLeft />
              </IconButton>
              
              <Button
                variant="outlined"
                size="small"
                startIcon={<Today />}
                onClick={handleToday}
                sx={{ minWidth: 200 }}
              >
                {currentWeek.format('DD/MM/YYYY')} - {currentWeek.add(6, 'day').format('DD/MM/YYYY')}
              </Button>
              
              <IconButton onClick={handleNextWeek} size="small">
                <ChevronRight />
              </IconButton>
            </Box>
            
            {/* Indicador del laboratorio activo */}
            {(userRole === 'Jefe de Laboratorio' || userRole === 'Administrador') && selectedLaboratorio !== 'all' && (
              <Alert 
                severity="info" 
                sx={{ 
                  py: 0.5, 
                  fontSize: '0.75rem',
                  '& .MuiAlert-message': { py: 0 }
                }}
              >
                Viendo: <strong>{laboratorios.find(lab => lab.id === selectedLaboratorio)?.nombre}</strong>
              </Alert>
            )}
          </Box>
          
          {/* Acciones */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              size="small"
            >
              Filtros
            </Button>
            
            {onShare && (userRole === 'Jefe de Laboratorio' || userRole === 'Administrador') && (
              <Button
                variant="outlined"
                startIcon={<Share />}
                onClick={() => onShare(selectedLaboratorio !== 'all' ? selectedLaboratorio as number : undefined)}
                size="small"
                color="secondary"
              >
                Compartir
              </Button>
            )}
            
            {onExport && (userRole === 'Jefe de Laboratorio' || userRole === 'Administrador') && (
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={onExport}
                size="small"
                color="success"
              >
                Descargar
              </Button>
            )}
            
            {onNewHorario && (
              <Button
                variant="contained"
                startIcon={<Schedule />}
                onClick={onNewHorario}
                size="small"
              >
                Nuevo Horario
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Filtros */}
      <Collapse in={mostrarFiltros}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
            Filtros
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Laboratorio"
              value={filtroLaboratorio}
              onChange={(e) => setFiltroLaboratorio(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOn fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              label="Docente"
              value={filtroDocente}
              onChange={(e) => setFiltroDocente(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              label="Grupo"
              value={filtroGrupo}
              onChange={(e) => setFiltroGrupo(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Group fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            
            <Button
              variant="outlined"
              onClick={limpiarFiltros}
              size="small"
            >
              Limpiar
            </Button>
          </Box>
        </Paper>
      </Collapse>

              {/* Tabla de calendario */}
        <TableContainer 
          id="calendario-exportable"
          component={Paper} 
          sx={{ maxHeight: 'calc(100vh - 300px)' }}
        >
          <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell 
                sx={{ 
                  fontWeight: 'bold', 
                  backgroundColor: '#f5f5f5',
                  width: 100,
                  borderRight: '2px solid #e0e0e0'
                }}
              >
                Hora
              </TableCell>
                              {DIAS_SEMANA.map((dia, index) => {
                  const dayDate = currentWeek.add(index, 'day')
                  const isToday = dayDate.isSame(dayjs(), 'day')
                  return (
                    <TableCell 
                      key={dia} 
                      align="center"
                      sx={{ 
                        fontWeight: 'bold',
                        backgroundColor: isToday ? '#e3f2fd' : '#f5f5f5',
                        minWidth: 180,
                        borderRight: index < 6 ? '1px solid #e0e0e0' : 'none',
                        borderTop: isToday ? '3px solid #2196f3' : 'none'
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ color: isToday ? '#1976d2' : 'inherit' }}>
                        {dia}
                      </Typography>
                      <Typography variant="caption" color={isToday ? 'primary' : 'text.secondary'}>
                        {dayDate.format('DD/MM')}
                      </Typography>
                    </TableCell>
                  )
                })}
            </TableRow>
          </TableHead>
          <TableBody>
            {TIME_BLOCKS.map((block) => (
              <TableRow key={block.id} hover>
                <TableCell 
                  sx={{ 
                    fontWeight: 500,
                    backgroundColor: '#fafafa',
                    borderRight: '2px solid #e0e0e0',
                    py: 1
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {block.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {block.start} - {block.end}
                  </Typography>
                </TableCell>
                                  {DIAS_SEMANA.map((_, diaIndex) => {
                    const key = `${diaIndex}-${block.start}`
                    const eventos = eventosPorDiaYHora[key] || []
                    const dayDate = currentWeek.add(diaIndex, 'day')
                    const isToday = dayDate.isSame(dayjs(), 'day')
                    
                    return (
                      <TableCell 
                        key={key}
                        sx={{ 
                          p: 0.3,
                          borderRight: diaIndex < 6 ? '1px solid #e0e0e0' : 'none',
                          verticalAlign: 'top',
                          height: 42, // Reducido de 60 a 42 (30% menos)
                          backgroundColor: eventos.length > 0 
                            ? (isToday ? '#e8f4fd' : '#fafafa')
                            : (isToday ? '#f3f8fe' : 'white')
                        }}
                      >
                      {eventos.map(evento => (
                        <Card
                          key={evento.id}
                          sx={{
                            backgroundColor: evento.color,
                            color: 'white',
                            mb: eventos.length > 1 ? 0.5 : 0,
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            '&:hover': {
                              transform: 'scale(1.02)',
                              boxShadow: 2
                            }
                          }}
                          onClick={() => {
                            setSelectedEvent(evento.horarioOriginal)
                            setDialogOpen(true)
                          }}
                        >
                          <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontWeight: 'bold',
                                display: 'block',
                                fontSize: '0.7rem',
                                lineHeight: 1.2
                              }}
                            >
                              {evento.laboratorio}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                display: 'block',
                                fontSize: '0.65rem',
                                opacity: 0.95
                              }}
                            >
                              {evento.docente}
                            </Typography>
                                                          <Typography 
                                variant="caption" 
                                sx={{ 
                                  display: 'block',
                                  fontSize: '0.65rem',
                                  opacity: 0.9
                                }}
                              >
                                {evento.grupo}
                              </Typography>
                          </CardContent>
                        </Card>
                      ))}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Leyenda de colores dinámicos */}
      {horariosSemana.length > 0 && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Colores en esta semana
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {Array.from(new Set(horariosSemana.map(h => h.color || getColorByTipo(h.descripcion))))
              .map((color) => {
                const horariosConEsteColor = horariosSemana.filter(h => 
                  (h.color || getColorByTipo(h.descripcion)) === color
                )
                const primerHorario = horariosConEsteColor[0]
                const descripcionTipo = primerHorario?.descripcion?.split(' ')[0] || 'Actividad'
                
                return (
                  <Chip 
                    key={color}
                    label={`${descripcionTipo} (${horariosConEsteColor.length})`}
                    size="small" 
                    sx={{ backgroundColor: color, color: 'white' }} 
                  />
                )
              })
            }
          </Box>
        </Paper>
      )}

      {/* Dialog para detalles del evento */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedEvent && (
          <>
            <DialogTitle sx={{ backgroundColor: getColorByTipo(selectedEvent.descripcion), color: 'white' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Detalles del Horario
                </Typography>
                <Box>
                  {onView && (
                    <IconButton
                      onClick={() => {
                        onView(selectedEvent)
                        setDialogOpen(false)
                      }}
                      sx={{ color: 'white' }}
                      size="small"
                    >
                      <Visibility />
                    </IconButton>
                  )}
                  {onEdit && (
                    <IconButton
                      onClick={() => {
                        onEdit(selectedEvent)
                        setDialogOpen(false)
                      }}
                      sx={{ color: 'white' }}
                      size="small"
                    >
                      <Edit />
                    </IconButton>
                  )}
                  {onDelete && (
                    <IconButton
                      onClick={() => {
                        onDelete(selectedEvent)
                        setDialogOpen(false)
                      }}
                      sx={{ color: 'white' }}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  )}
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Laboratorio
                  </Typography>
                  <Typography variant="body1">
                    {selectedEvent.laboratorio}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Docente
                  </Typography>
                  <Typography variant="body1">
                    {selectedEvent.docente}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Grupo
                  </Typography>
                  <Typography variant="body1">
                    {selectedEvent.grupo}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Descripción
                  </Typography>
                  <Typography variant="body1">
                    {selectedEvent.descripcion}
                  </Typography>
                </Box>
                
                <Divider />
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Horario
                  </Typography>
                  <Typography variant="body1">
                    {dayjs(selectedEvent.fecha_inicio).format('DD/MM/YYYY HH:mm')} - {dayjs(selectedEvent.fecha_fin).format('HH:mm')}
                  </Typography>
                </Box>
                
                {selectedEvent.cantidad_alumnos && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Cantidad de alumnos
                    </Typography>
                    <Typography variant="body1">
                      {selectedEvent.cantidad_alumnos}
                    </Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>
                Cerrar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  )
}
