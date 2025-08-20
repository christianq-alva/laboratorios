import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
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
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  Button,
} from '@mui/material'
import {
  LocationOn,
  Person,
  Group,
  Schedule,
  ChevronLeft,
  ChevronRight,
  Today,
  FilterList,
  School,
  Visibility,
} from '@mui/icons-material'
import { shareService, type PublicData } from '../../services/shareService'
import { TIME_BLOCKS } from '../../utils/timeBlocks'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import isoWeek from 'dayjs/plugin/isoWeek'
import isBetween from 'dayjs/plugin/isBetween'

// Configurar dayjs
dayjs.extend(isoWeek)
dayjs.extend(isBetween)
dayjs.locale('es')

interface HorarioEventoPublico {
  id: number
  laboratorio: string
  docente: string
  grupo: string
  ciclo: string
  descripcion: string
  horaInicio: string
  horaFin: string
  color: string
  cantidad_alumnos?: number
}

// Colores por tipo de actividad (mismo que el calendario privado)
const getColorByTipo = (descripcion: string | null | undefined): string => {
  if (!descripcion) return '#95a5a6'
  
  const desc = descripcion.toLowerCase()
  if (desc.includes('reproductor')) return '#ff6b6b'
  if (desc.includes('neurología') || desc.includes('neurologia')) return '#4ecdc4'
  if (desc.includes('señalización') || desc.includes('señalizacion')) return '#ffa726'
  if (desc.includes('histología') || desc.includes('histologia')) return '#ab47bc'
  if (desc.includes('fisioex') || desc.includes('physioex')) return '#26a69a'
  return '#95a5a6'
}

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export const HorarioPublico: React.FC = () => {
  const { laboratorio_id } = useParams<{ laboratorio_id: string }>()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  
  const [publicData, setPublicData] = useState<PublicData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentWeek, setCurrentWeek] = useState(dayjs().startOf('isoWeek'))
  
  // Estados para filtros
  const [filtroDocente, setFiltroDocente] = useState<string>('')
  const [filtroCiclo, setFiltroCiclo] = useState<string>('')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  // Cargar datos públicos
  useEffect(() => {
    const loadPublicData = async () => {
      if (!laboratorio_id || !token) {
        setError('Enlace inválido: falta información necesaria')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        const data = await shareService.getPublicHorarios(parseInt(laboratorio_id), token)
        setPublicData(data)
      } catch (err: any) {
        console.error('Error al cargar datos públicos:', err)
        setError(err.message || 'Error al cargar horarios públicos')
      } finally {
        setLoading(false)
      }
    }

    loadPublicData()
  }, [laboratorio_id, token])

  // Filtrar horarios por semana actual y filtros
  const horariosSemana = useMemo(() => {
    if (!publicData) return []
    
    const inicioSemana = currentWeek.startOf('isoWeek')
    const finSemana = currentWeek.endOf('isoWeek')
    
    return publicData.horarios.filter(horario => {
      // Verificar si el horario está en la semana actual
      const fechaHorario = dayjs(horario.fecha_inicio)
      if (!fechaHorario.isBetween(inicioSemana, finSemana, null, '[]')) {
        return false
      }
      
      // Aplicar filtros
      const cumpleDocente = !filtroDocente || 
        horario.docente?.toLowerCase().includes(filtroDocente.toLowerCase())
      const cumpleCiclo = !filtroCiclo || 
        horario.ciclo?.toLowerCase().includes(filtroCiclo.toLowerCase())
      
      return cumpleDocente && cumpleCiclo
    })
  }, [publicData, currentWeek, filtroDocente, filtroCiclo])

  // Organizar eventos por día y hora
  const eventosPorDiaYHora = useMemo(() => {
    const eventos: Record<string, HorarioEventoPublico[]> = {}
    
    DIAS_SEMANA.forEach((dia, diaIndex) => {
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
              ciclo: horario.ciclo || '',
              descripcion: horario.descripcion || '',
              horaInicio,
              horaFin,
              color: horario.color || getColorByTipo(horario.descripcion),
              cantidad_alumnos: horario.cantidad_alumnos
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
    setFiltroDocente('')
    setFiltroCiclo('')
  }

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100vh',
        p: 4 
      }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Cargando horarios...
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100vh',
        p: 4 
      }}>
        <Alert severity="error" sx={{ mb: 2, maxWidth: 500 }}>
          <Typography variant="h6" gutterBottom>
            Error al cargar horarios
          </Typography>
          <Typography variant="body2">
            {error}
          </Typography>
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Verifica que el enlace sea correcto y no haya expirado
        </Typography>
      </Box>
    )
  }

  if (!publicData) {
    return null
  }
  
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Header público */}
      <Paper sx={{ p: 3, mb: 2, borderRadius: 0, boxShadow: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <LocationOn color="primary" sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              {publicData.laboratorio.nombre}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {publicData.laboratorio.ubicacion}
              {publicData.laboratorio.escuela && ` • ${publicData.laboratorio.escuela}`}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Visibility fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            Vista pública de horarios • Solo lectura
          </Typography>
        </Box>
      </Paper>

      <Box sx={{ p: 2 }}>
        {/* Controles */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                Horarios Semanales
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label={`${horariosSemana.length} horarios`} 
                  color="primary" 
                  size="small"
                />
                <Chip 
                  label={`${publicData.horarios.length} total`} 
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Box>
            
            {/* Navegación de semanas */}
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
            
            {/* Botón de filtros */}
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              size="small"
            >
              Filtros
            </Button>
          </Box>
        </Paper>

        {/* Filtros */}
        <Collapse in={mostrarFiltros}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
              Filtros
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Docente</InputLabel>
                <Select
                  value={filtroDocente}
                  label="Docente"
                  onChange={(e) => setFiltroDocente(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Todos los docentes</em>
                  </MenuItem>
                  {publicData.filtros.docentes.map((docente) => (
                    <MenuItem key={docente} value={docente}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person fontSize="small" />
                        {docente}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Ciclo</InputLabel>
                <Select
                  value={filtroCiclo}
                  label="Ciclo"
                  onChange={(e) => setFiltroCiclo(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Todos los ciclos</em>
                  </MenuItem>
                  {publicData.filtros.ciclos.map((ciclo) => (
                    <MenuItem key={ciclo} value={ciclo}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <School fontSize="small" />
                        {ciclo}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
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
        <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 300px)' }}>
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
                              cursor: 'default'
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
                                {evento.docente}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  display: 'block',
                                  fontSize: '0.65rem',
                                  opacity: 0.95
                                }}
                              >
                                {evento.grupo}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  display: 'block',
                                  fontSize: '0.65rem',
                                  opacity: 0.9
                                }}
                              >
                                {evento.ciclo}
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
                .map((color, index) => {
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

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 4, py: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Vista pública de horarios • Generada automáticamente
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
