import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Button,
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
} from '@mui/material'
import {
  Schedule,
  LocationOn,
  Person,
  Edit,
  Delete,
  Visibility,
  FilterList,
  Search,
} from '@mui/icons-material'
import { horarioService, type Horario } from '../../services/horarioService'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import isoWeek from 'dayjs/plugin/isoWeek'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './CalendarioSemanal.css'

// Configurar dayjs para español y plugin isoWeek
dayjs.extend(isoWeek)
dayjs.locale('es')

// Configurar el localizador para React Big Calendar
const locales = {
  'es': es,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

// Interfaces
interface HorarioCalendario {
  id: number
  title: string
  start: Date
  end: Date
  laboratorio: string
  docente: string
  escuela: string
  ciclo: string
  descripcion: string
  color: string
  cantidad_alumnos?: number
  insumos?: Array<{
    nombre: string
    cantidad: number
  }>
  tiene_conflicto?: boolean
  conflicto_mensaje?: string
}

interface CalendarioSemanalProps {
  onEdit?: (horario: Horario) => void
  onDelete?: (horario: Horario) => void
  onView?: (horario: Horario) => void
  onNewHorario?: () => void
  refresh?: boolean
  onRefreshComplete?: () => void
}

// Colores por tipo de actividad
const getColorByTipo = (descripcion: string | null | undefined): string => {
  if (!descripcion) return '#95a5a6' // Gris por defecto
  
  const desc = descripcion.toLowerCase()
  if (desc.includes('reproductor') || desc.includes('reproductor')) return '#ff6b6b' // Rojo
  if (desc.includes('neurología') || desc.includes('neurologia')) return '#4ecdc4' // Azul
  if (desc.includes('señalizacion') || desc.includes('señalización') || desc.includes('señalizacion')) return '#ffa726' // Naranja
  if (desc.includes('histología') || desc.includes('histologia')) return '#ab47bc' // Púrpura
  if (desc.includes('fisioex') || desc.includes('physioex')) return '#26a69a' // Verde
  return '#95a5a6' // Gris por defecto
}




export const CalendarioSemanal: React.FC<CalendarioSemanalProps> = ({
  onEdit,
  onDelete,
  onView,
  onNewHorario,
  refresh = false,
  onRefreshComplete,
}) => {
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [horariosCalendario, setHorariosCalendario] = useState<HorarioCalendario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<HorarioCalendario | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [initialDateSet, setInitialDateSet] = useState(false)
  const [currentView, setCurrentView] = useState<'week' | 'day'>('week')
  
  // Estados para filtros
  const [filtroLaboratorio, setFiltroLaboratorio] = useState<string>('')
  const [filtroDocente, setFiltroDocente] = useState<string>('')
  const [filtroTipo, setFiltroTipo] = useState<string>('')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  // Cargar horarios
  const fetchHorarios = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await horarioService.getAll()
      
      if (result.success) {
        setHorarios(result.data || [])
        procesarHorariosParaCalendario(result.data || [])
      } else {
        setError(result.message || 'Error al cargar horarios')
      }
    } catch (err: any) {
      setError('Error de conexión al cargar horarios')
    } finally {
      setLoading(false)
    }
  }, [])

  // Procesar horarios para el formato del calendario
  const procesarHorariosParaCalendario = useCallback((horariosData: Horario[]) => {
    const horariosProcesados: HorarioCalendario[] = []
    
    horariosData.forEach(horario => {
      // Validar que el horario tenga los datos mínimos necesarios
      if (!horario.id || !horario.fecha_inicio || !horario.fecha_fin) {
        return
      }
      
      // Procesar las fechas de manera más directa
      // Las fechas vienen del backend en formato MySQL: 'YYYY-MM-DD HH:MM:SS'
      const fechaInicio = new Date(horario.fecha_inicio)
      const fechaFin = new Date(horario.fecha_fin)
      
      // Verificar que las fechas sean válidas
      if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
        return
      }
      
      // Log de depuración el evento
      const title = `${horario.laboratorio || 'Laboratorio'} - ${horario.docente || 'Docente'}`
      
      const horarioProcesado: HorarioCalendario = {
        id: horario.id,
        title,
        start: fechaInicio,
        end: fechaFin,
          laboratorio: horario.laboratorio || 'Laboratorio',
          docente: horario.docente || 'Docente',
          escuela: horario.escuela || 'Escuela',
          ciclo: horario.ciclo || 'Ciclo',
          descripcion: horario.descripcion || 'Sin descripción',
          color: getColorByTipo(horario.descripcion),
          cantidad_alumnos: horario.cantidad_alumnos,
          insumos: horario.insumos?.map(i => ({
            nombre: i.nombre || 'Sin nombre',
            cantidad: i.cantidad_usada || 0
          })) || []
        }
        
        horariosProcesados.push(horarioProcesado)
    })
    
    setHorariosCalendario(horariosProcesados)
    
    // Inicializar con la fecha actual
    if (!initialDateSet) {
      const fechaActual = new Date()
      setCurrentDate(fechaActual)
      setInitialDateSet(true)
    }
  }, [initialDateSet])

  // Filtrar horarios
  const horariosFiltrados = useMemo(() => {
    return horariosCalendario.filter(horario => {
      const cumpleLaboratorio = !filtroLaboratorio || 
        (horario.laboratorio && horario.laboratorio.toLowerCase().includes(filtroLaboratorio.toLowerCase()))
      const cumpleDocente = !filtroDocente || 
        (horario.docente && horario.docente.toLowerCase().includes(filtroDocente.toLowerCase()))
      const cumpleTipo = !filtroTipo || 
        (horario.descripcion && horario.descripcion.toLowerCase().includes(filtroTipo.toLowerCase()))
      
      return cumpleLaboratorio && cumpleDocente && cumpleTipo
    })
  }, [horariosCalendario, filtroLaboratorio, filtroDocente, filtroTipo])

  // Componente personalizado para eventos
  const EventComponent = ({ event }: { event: HorarioCalendario }) => (
    <Box
      sx={{
        backgroundColor: event.color,
        color: 'white',
        padding: '2px 4px',
        borderRadius: '3px',
        fontSize: '11px',
        fontWeight: 'bold',
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
      onClick={() => {
        setSelectedEvent(event)
        setDialogOpen(true)
      }}
    >
      <Box>
        <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
          {event.laboratorio}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block' }}>
          {event.docente}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block' }}>
          {event.ciclo}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block' }}>
          {event.escuela}
        </Typography>
      </Box>
    </Box>
  )

  // Manejar selección de evento
  const handleEventSelect = (event: HorarioCalendario) => {
    setSelectedEvent(event)
    setDialogOpen(true)
  }

  // Manejar navegación del calendario
  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate)
  }

  // Manejar cambio de vista
  const handleViewChange = (newView: any) => {
    if (newView === 'week' || newView === 'day') {
      setCurrentView(newView)
    }
  }

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltroLaboratorio('')
    setFiltroDocente('')
    setFiltroTipo('')
  }

  // Cargar horarios al montar el componente
  useEffect(() => {
    fetchHorarios()
  }, [fetchHorarios])

  // Refresh cuando se solicita
  useEffect(() => {
    if (refresh) {
      setInitialDateSet(false) // Permitir que se reajuste la fecha
      fetchHorarios().then(() => {
        onRefreshComplete?.()
      })
    }
  }, [refresh, fetchHorarios, onRefreshComplete])

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
    <Box sx={{ p: 0, height: '100%', width: '100%', maxWidth: '100%' }}>
              {/* Header del calendario */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, px: { xs: 1, sm: 2, md: 3 }, flexShrink: 0, flexWrap: 'wrap', gap: 1 }}>
        <Box>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Calendario Semanal
        </Typography>
          
          {/* Estadísticas rápidas */}
          <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 }, mt: 1, flexWrap: 'wrap' }}>
            <Chip 
              label={`${horariosFiltrados.length} horarios`} 
              color="primary" 
              variant="outlined" 
              size="small"
            />
            <Chip 
              label={`${horariosCalendario.length} total`} 
              color="secondary" 
              variant="outlined" 
              size="small"
            />
            <Chip 
              label={`Semana ${dayjs(currentDate).format('YYYY-[W]WW')}`} 
              color="info" 
              variant="outlined" 
              size="small"
            />
            <Chip 
              label={`${dayjs(currentDate).format('DD/MM/YYYY')}`} 
              color="success" 
              variant="outlined" 
              size="small"
            />
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 }, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
          >
            Filtros
          </Button>
          
          <Button
            variant="outlined"
            onClick={() => setCurrentDate(new Date())}
            startIcon={<Schedule />}
            color="primary"
            size="small"
          >
            Hoy
          </Button>
          
          <Button
            variant="outlined"
            onClick={() => {
              if (horariosCalendario.length > 0) {
                const fechasOrdenadas = horariosCalendario
                  .map(h => h.start)
                  .sort((a, b) => b.getTime() - a.getTime())
                
                if (fechasOrdenadas.length > 0) {
                  setCurrentDate(fechasOrdenadas[0])
                }
              }
            }}
            startIcon={<Schedule />}
            color="secondary"
            size="small"
          >
            Ir a Recientes
          </Button>
          
          {onNewHorario && (
            <Button
              variant="contained"
              startIcon={<Schedule />}
              onClick={onNewHorario}
            >
              Nuevo Horario
            </Button>
          )}
        </Box>
      </Box>

      {/* Filtros */}
      <Collapse in={mostrarFiltros}>
        <Paper sx={{ p: 2, mb: 2, mx: 3, flexShrink: 0 }}>
          <Typography variant="h6" gutterBottom>
            Filtros
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              label="Laboratorio"
              value={filtroLaboratorio}
              onChange={(e) => setFiltroLaboratorio(e.target.value)}
              size="small"
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
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            
            
            <TextField
              label="Tipo de actividad"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
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

      {/* Calendario */}
      <Paper sx={{ 
        p: 0, 
        mb: 2, 
        flex: 1, 
        minHeight: '600px', 
        display: 'flex', 
        flexDirection: 'column', 
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        margin: 0,
        borderRadius: 0
      }}>
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100%' }}>
          <Calendar
            localizer={localizer}
            events={horariosFiltrados}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%', flex: 1, width: '100%', maxWidth: '100%' }}
            views={['week', 'day']}
            view={currentView}
            date={currentDate}
            step={30}
            timeslots={1}
            min={new Date(2024, 0, 1, 7, 30, 0)} // 7:30 AM
            max={new Date(2024, 0, 1, 20, 30, 0)} // 8:30 PM
            components={{
              event: EventComponent,
            }}
            onSelectEvent={handleEventSelect}
            onNavigate={handleNavigate}
            onView={handleViewChange}
            messages={{
              next: "Siguiente",
              previous: "Anterior",
              today: "Hoy",
              month: "Mes",
              week: "Semana",
              day: "Día",
              agenda: "Agenda",
              date: "Fecha",
              time: "Hora",
              event: "Evento",
              noEventsInRange: "No hay eventos en este rango.",
            }}
            culture="es"
            toolbar={true}
            popup={true}
            selectable={false}
            longPressThreshold={15}
            formats={{
              timeGutterFormat: (date: Date) => {
                return dayjs(date).format('HH:mm')
              }
            }}
          />
                              </Box>
      </Paper>

      {/* Leyenda de colores */}
      <Paper sx={{ p: 2, mb: 2, flexShrink: 0, mx: 3 }}>
        <Typography variant="h6" gutterBottom>
          Leyenda de Colores
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip label="Reproductor" sx={{ backgroundColor: '#ff6b6b', color: 'white' }} />
          <Chip label="Neurología" sx={{ backgroundColor: '#4ecdc4', color: 'white' }} />
          <Chip label="Señalización" sx={{ backgroundColor: '#ffa726', color: 'white' }} />
          <Chip label="Histología" sx={{ backgroundColor: '#ab47bc', color: 'white' }} />
          <Chip label="FisioEx" sx={{ backgroundColor: '#26a69a', color: 'white' }} />
          <Chip label="Otros" sx={{ backgroundColor: '#95a5a6', color: 'white' }} />
        </Box>
      </Paper>

      {/* Dialog para detalles del evento */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedEvent && (
          <>
            <DialogTitle sx={{ backgroundColor: selectedEvent.color, color: 'white' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Detalles del Horario
                </Typography>
                <Box>
                  {onView && (
                    <IconButton
                      onClick={() => {
                        const horarioOriginal = horarios.find(h => h.id === selectedEvent.id)
                        if (horarioOriginal) {
                          onView(horarioOriginal)
                          setDialogOpen(false)
                        }
                      }}
                      sx={{ color: 'white' }}
                    >
                      <Visibility />
                    </IconButton>
                  )}
                  {onEdit && (
                    <IconButton
                      onClick={() => {
                        const horarioOriginal = horarios.find(h => h.id === selectedEvent.id)
                        if (horarioOriginal) {
                          onEdit(horarioOriginal)
                          setDialogOpen(false)
                        }
                      }}
                      sx={{ color: 'white' }}
                    >
                      <Edit />
                    </IconButton>
                  )}
                  {onDelete && (
                    <IconButton
                      onClick={() => {
                        const horarioOriginal = horarios.find(h => h.id === selectedEvent.id)
                        if (horarioOriginal) {
                          onDelete(horarioOriginal)
                          setDialogOpen(false)
                        }
                      }}
                      sx={{ color: 'white' }}
                    >
                      <Delete />
                    </IconButton>
                  )}
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Laboratorio:</strong> {selectedEvent.laboratorio}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Docente:</strong> {selectedEvent.docente}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Ciclo:</strong> {selectedEvent.ciclo}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Escuela:</strong> {selectedEvent.escuela}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Descripción:</strong> {selectedEvent.descripcion}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Fecha de inicio:</strong> {dayjs(selectedEvent.start).format('DD/MM/YYYY HH:mm')}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Fecha de fin:</strong> {dayjs(selectedEvent.end).format('DD/MM/YYYY HH:mm')}
                  </Typography>
                  {selectedEvent.cantidad_alumnos && (
                    <Typography variant="subtitle1" gutterBottom>
                      <strong>Cantidad de alumnos:</strong> {selectedEvent.cantidad_alumnos}
                    </Typography>
                  )}
                </Box>
                {selectedEvent.insumos && selectedEvent.insumos.length > 0 && (
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Insumos
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {selectedEvent.insumos.map((insumo, index) => (
                        <Chip
                          key={index}
                          label={`${insumo.nombre}: ${insumo.cantidad}`}
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Box>
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
