import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material'
import {
  ChevronLeft,
  ChevronRight,
  Today,
  Schedule,
  Person,
  LocationOn,
  School,
  Group,
  Inventory,
  Close,
  Add
} from '@mui/icons-material'
import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/es'
import { horarioService } from '../../services/horarioService'
import type { Horario } from '../../services/horarioService'

// Configurar dayjs en español
dayjs.locale('es')

interface CalendarViewProps {
  onRefresh?: () => void
  onNewHorario?: () => void
}

interface HorarioEvent {
  id: number
  title: string
  start: Dayjs
  end: Dayjs
  laboratorio: string
  docente: string
  grupo: string
  escuela: string
  descripcion: string
  insumos?: Array<{
    nombre: string
    cantidad: number
  }>
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onRefresh, onNewHorario }) => {
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs())
  const [horarios, setHorarios] = useState<HorarioEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null)
  const [selectedHorarios, setSelectedHorarios] = useState<HorarioEvent[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)

  // Cargar horarios del mes actual
  const loadHorarios = async (date: Dayjs) => {
    try {
      setLoading(true)
      setError(null)

      const result = await horarioService.getAll()

      if (result.success) {
        const horariosFormateados: HorarioEvent[] = result.data.map((horario: Horario) => ({
          id: horario.id,
          title: `${horario.laboratorio || 'Lab'} - ${horario.docente || 'Docente'}`,
          start: dayjs(horario.fecha_inicio),
          end: dayjs(horario.fecha_fin),
          laboratorio: horario.laboratorio || 'Laboratorio',
          docente: horario.docente || 'Docente',
          grupo: horario.grupo || 'Grupo',
          escuela: horario.escuela || 'Escuela',
          descripcion: horario.descripcion,
          insumos: horario.insumos?.map(i => ({
            nombre: i.nombre,
            cantidad: i.cantidad_usada
          })) || []
        }))
        setHorarios(horariosFormateados)
      } else {
        setError(result.message || 'Error al cargar horarios')
      }
    } catch (err: any) {
      console.error('Error loading horarios:', err)
      setError('Error de conexión al cargar horarios')
    } finally {
      setLoading(false)
    }
  }

  // Cargar horarios cuando cambia el mes
  useEffect(() => {
    loadHorarios(currentDate)
  }, [currentDate])

  // Navegar al mes anterior
  const handlePrevMonth = () => {
    setCurrentDate(prev => prev.subtract(1, 'month'))
  }

  // Navegar al mes siguiente
  const handleNextMonth = () => {
    setCurrentDate(prev => prev.add(1, 'month'))
  }

  // Ir al día actual
  const handleToday = () => {
    setCurrentDate(dayjs())
  }

  // Manejar clic en una fecha
  const handleDateClick = (date: Dayjs) => {
    const horariosDelDia = horarios.filter(horario => 
      horario.start.isSame(date, 'day')
    )
    
    setSelectedDate(date)
    setSelectedHorarios(horariosDelDia)
    setDialogOpen(true)
  }

  // Generar días del mes
  const generateDaysOfMonth = () => {
    const startOfMonth = currentDate.startOf('month')
    const endOfMonth = currentDate.endOf('month')
    const startOfWeek = startOfMonth.startOf('week')
    const endOfWeek = endOfMonth.endOf('week')
    
    const days = []
    let currentDay = startOfWeek
    
    while (currentDay.isBefore(endOfWeek) || currentDay.isSame(endOfWeek, 'day')) {
      days.push(currentDay)
      currentDay = currentDay.add(1, 'day')
    }
    
    return days
  }

  // Obtener horarios de un día específico
  const getHorariosForDay = (date: Dayjs) => {
    return horarios.filter(horario => horario.start.isSame(date, 'day'))
  }

  // Renderizar un día del calendario
  const renderDay = (date: Dayjs) => {
    const horariosDelDia = getHorariosForDay(date)
    const isToday = date.isSame(dayjs(), 'day')
    const isCurrentMonth = date.isSame(currentDate, 'month')
    const isWeekend = date.day() === 0 || date.day() === 6

    return (
      <Box
        key={date.format('YYYY-MM-DD')}
        sx={{
          minHeight: 120,
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          p: 1,
          cursor: 'pointer',
          bgcolor: isToday ? 'primary.50' : 'background.paper',
          borderColor: isToday ? 'primary.main' : '#e0e0e0',
          '&:hover': {
            bgcolor: 'action.hover',
            borderColor: 'primary.main'
          },
          opacity: isCurrentMonth ? 1 : 0.5,
          position: 'relative'
        }}
        onClick={() => handleDateClick(date)}
      >
        {/* Número del día */}
        <Typography
          variant="body2"
          sx={{
            fontWeight: isToday ? 700 : 500,
            color: isToday ? 'primary.main' : isWeekend ? 'text.secondary' : 'text.primary',
            mb: 1,
            textAlign: 'center',
            fontSize: '0.9rem'
          }}
        >
          {date.date()}
        </Typography>

        {/* Horarios del día */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {horariosDelDia.slice(0, 3).map((horario) => (
            <Tooltip
              key={horario.id}
              title={`${horario.laboratorio} - ${horario.docente} (${horario.start.format('HH:mm')}-${horario.end.format('HH:mm')})`}
              arrow
            >
              <Box
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  p: 0.5,
                  borderRadius: 0.5,
                  fontSize: '0.7rem',
                  lineHeight: 1.2,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'primary.dark'
                  }
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                  {horario.start.format('HH:mm')}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                  {horario.laboratorio.split(' ')[0]}
                </Typography>
              </Box>
            </Tooltip>
          ))}
          
          {horariosDelDia.length > 3 && (
            <Chip
              label={`+${horariosDelDia.length - 3} más`}
              size="small"
              color="secondary"
              variant="outlined"
              sx={{
                fontSize: '0.6rem',
                height: 16,
                '& .MuiChip-label': {
                  px: 0.5
                }
              }}
            />
          )}
        </Box>

        {/* Indicador de día actual */}
        {isToday && (
          <Box
            sx={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: 'primary.main'
            }}
          />
        )}
      </Box>
    )
  }

  // Generar encabezados de días de la semana
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
      <CardContent>
        {/* Encabezado del calendario */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Schedule color="primary" />
            Calendario de Horarios
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={handlePrevMonth} size="small">
              <ChevronLeft />
            </IconButton>
            
            <Typography variant="h6" sx={{ fontWeight: 600, minWidth: 150, textAlign: 'center' }}>
              {currentDate.format('MMMM YYYY')}
            </Typography>
            
            <IconButton onClick={handleNextMonth} size="small">
              <ChevronRight />
            </IconButton>
            
            <Button
              variant="outlined"
              size="small"
              startIcon={<Today />}
              onClick={handleToday}
              sx={{ ml: 1 }}
            >
              Hoy
            </Button>

            {onNewHorario && (
              <Button
                variant="contained"
                size="small"
                startIcon={<Add />}
                onClick={onNewHorario}
                sx={{ ml: 1 }}
              >
                Nuevo Horario
              </Button>
            )}
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Calendario tipo agenda */}
        <Box sx={{ mb: 3 }}>
          {/* Encabezados de días de la semana */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: 0.5, 
            mb: 1 
          }}>
            {weekDays.map((day) => (
              <Box key={day} sx={{ textAlign: 'center' }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: 'text.secondary',
                    py: 1,
                    bgcolor: 'grey.50',
                    borderRadius: 1
                  }}
                >
                  {day}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Días del calendario */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: 0.5 
          }}>
            {generateDaysOfMonth().map((date) => (
              <Box key={date.format('YYYY-MM-DD')}>
                {renderDay(date)}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Estadísticas del mes */}
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Resumen del mes:
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip
              label={`${horarios.length} horarios programados`}
              color="primary"
              variant="outlined"
              size="small"
            />
            <Chip
              label={`${new Set(horarios.map(h => h.start.format('YYYY-MM-DD'))).size} días con actividad`}
              color="secondary"
              variant="outlined"
              size="small"
            />
            <Chip
              label={`${new Set(horarios.map(h => h.laboratorio)).size} laboratorios utilizados`}
              color="success"
              variant="outlined"
              size="small"
            />
          </Box>
        </Box>
      </CardContent>

      {/* Diálogo de detalles del día */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Horarios del {selectedDate?.format('dddd, D [de] MMMM [de] YYYY')}
            </Typography>
            <IconButton onClick={() => setDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {selectedHorarios.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Schedule sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No hay horarios programados
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Este día no tiene reservas de laboratorio
              </Typography>
            </Box>
          ) : (
            <List>
              {selectedHorarios.map((horario, index) => (
                <React.Fragment key={horario.id}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Schedule color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {horario.start.format('HH:mm')} - {horario.end.format('HH:mm')}
                          </Typography>
                          <Chip
                            label={horario.laboratorio}
                            color="primary"
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Person fontSize="small" color="action" />
                            <Typography variant="body2">
                              {horario.docente}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Group fontSize="small" color="action" />
                            <Typography variant="body2">
                              {horario.grupo} • {horario.escuela}
                            </Typography>
                          </Box>
                          {horario.descripcion && (
                            <Typography variant="body2" color="text.secondary">
                              {horario.descripcion}
                            </Typography>
                          )}
                          {horario.insumos && horario.insumos.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                Insumos: {horario.insumos.map(i => `${i.nombre} (${i.cantidad})`).join(', ')}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < selectedHorarios.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
} 