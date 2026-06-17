import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Typography,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Popover,
  ToggleButton,
  ToggleButtonGroup,
  Chip
} from '@mui/material'
import {
  Schedule,
  Delete,
  Info,
  CheckCircle,
  Add,
  Repeat,
  Close,
  CalendarMonth,
  Event,
  AutoAwesome
} from '@mui/icons-material'

import { horarioService, type CreateHorarioData } from '../../services/horarioService'
import { laboratorioService, type Laboratorio } from '../../services/laboratorioService'
import { docenteService, type Docente } from '../../services/docenteService'
import { TIME_BLOCKS } from '../../utils/timeBlocks'
import { escuelaService } from '../../services/escuelaService'

interface HorarioRecurrenteProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface Escuela {
  id: number
  nombre: string
}

interface Ciclo {
  id: number
  nombre: string
}

interface CreationResult {
  date: string
  success: boolean
  error?: string
  horario_id?: number
}

// Paleta de colores disponibles - 56 colores con buen contraste para texto blanco
// Organizados en múltiples filas
const COLOR_PALETTE = [
  // Fila 1
  { color: '#d32f2f', name: 'Rojo' }, // Rojo oscuro - buen contraste
  { color: '#c62828', name: 'Rojo Oscuro' }, // Rojo muy oscuro
  { color: '#e64a19', name: 'Naranja Rojo' }, // Naranja rojizo oscuro
  { color: '#f57c00', name: 'Naranja' }, // Naranja oscuro
  { color: '#f9a825', name: 'Ámbar' }, // Ámbar oscuro
  { color: '#fbc02d', name: 'Amarillo Oscuro' }, // Amarillo oscuro
  // Fila 2
  { color: '#388e3c', name: 'Verde' }, // Verde oscuro - buen contraste
  { color: '#2e7d32', name: 'Verde Oscuro' }, // Verde muy oscuro
  { color: '#00796b', name: 'Verde Azulado' }, // Verde azulado oscuro
  { color: '#00897b', name: 'Turquesa' }, // Turquesa oscuro
  { color: '#0097a7', name: 'Cian' }, // Cian oscuro
  { color: '#0277bd', name: 'Azul Claro' }, // Azul claro oscuro
  // Fila 3
  { color: '#1565c0', name: 'Azul' }, // Azul oscuro - buen contraste
  { color: '#0d47a1', name: 'Azul Oscuro' }, // Azul muy oscuro
  { color: '#283593', name: 'Índigo' }, // Índigo oscuro
  { color: '#512da8', name: 'Púrpura Oscuro' }, // Púrpura oscuro
  { color: '#6a1b9a', name: 'Púrpura' }, // Púrpura muy oscuro
  { color: '#7b1fa2', name: 'Violeta' }, // Violeta oscuro
  // Fila 4
  { color: '#c2185b', name: 'Rosa' }, // Rosa oscuro - buen contraste
  { color: '#ad1457', name: 'Rosa Oscuro' }, // Rosa muy oscuro
  { color: '#880e4f', name: 'Rosa Profundo' }, // Rosa profundo
  { color: '#b71c1c', name: 'Rojo Profundo' }, // Rojo profundo
  { color: '#bf360c', name: 'Naranja Profundo' }, // Naranja profundo
  { color: '#e65100', name: 'Naranja Intenso' }, // Naranja intenso
  // Fila 5
  { color: '#1b5e20', name: 'Verde Profundo' }, // Verde profundo - buen contraste
  { color: '#004d40', name: 'Verde Azulado Profundo' }, // Verde azulado profundo
  { color: '#006064', name: 'Cian Profundo' }, // Cian profundo
  { color: '#01579b', name: 'Azul Profundo' }, // Azul profundo
  { color: '#1a237e', name: 'Índigo Profundo' }, // Índigo profundo
  { color: '#4a148c', name: 'Púrpura Profundo' }, // Púrpura profundo
  // Fila 6
  { color: '#424242', name: 'Gris Oscuro' }, // Gris oscuro - buen contraste
  { color: '#212121', name: 'Gris Muy Oscuro' }, // Gris muy oscuro
  { color: '#263238', name: 'Gris Azulado' }, // Gris azulado oscuro
  { color: '#3e2723', name: 'Marrón' }, // Marrón oscuro
  { color: '#5d4037', name: 'Marrón Oscuro' }, // Marrón muy oscuro
  { color: '#6d4c41', name: 'Tierra' }, // Color tierra oscuro
  // Fila 7 - Colores adicionales
  { color: '#8b0000', name: 'Rojo Oscuro Intenso' }, // Rojo oscuro intenso
  { color: '#a0522d', name: 'Sienna' }, // Sienna oscuro
  { color: '#8b4513', name: 'Saddle Brown' }, // Marrón silla
  { color: '#654321', name: 'Marrón Oscuro Intenso' }, // Marrón oscuro intenso
  { color: '#2f4f4f', name: 'Gris Pizarra Oscuro' }, // Gris pizarra oscuro
  { color: '#191970', name: 'Azul Medianoche' }, // Azul medianoche
  // Fila 8
  { color: '#800080', name: 'Púrpura' }, // Púrpura estándar
  { color: '#4b0082', name: 'Índigo Oscuro' }, // Índigo oscuro
  { color: '#8b008b', name: 'Magenta Oscuro' }, // Magenta oscuro
  { color: '#9932cc', name: 'Orquídea Oscuro' }, // Orquídea oscuro
  { color: '#8b008b', name: 'Violeta Oscuro' }, // Violeta oscuro
  { color: '#6b0082', name: 'Púrpura Intenso' }, // Púrpura intenso
  // Fila 9
  { color: '#006400', name: 'Verde Oscuro' }, // Verde oscuro
  { color: '#228b22', name: 'Verde Bosque' }, // Verde bosque
  { color: '#2e8b57', name: 'Verde Mar' }, // Verde mar
  { color: '#3cb371', name: 'Verde Medio' }, // Verde medio
  { color: '#008b8b', name: 'Cian Oscuro' }, // Cian oscuro
  { color: '#008080', name: 'Teal' }, // Teal oscuro
  // Fila 10
  { color: '#000080', name: 'Azul Marino' }, // Azul marino
  { color: '#00008b', name: 'Azul Oscuro' }, // Azul oscuro
  { color: '#0000cd', name: 'Azul Medio' }, // Azul medio
  { color: '#1e90ff', name: 'Azul Dodger' }, // Azul dodger
  { color: '#0066cc', name: 'Azul Real' }, // Azul real
  { color: '#003366', name: 'Azul Noche' } // Azul noche
]

export const HorarioRecurrente: React.FC<HorarioRecurrenteProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  // Estados del formulario
  const [formData, setFormData] = useState({
    laboratorio_id: 0,
    docente_id: 0,
    escuela_id: 0,
    ciclo_id: 0,
    descripcion: '',
    cantidad_alumnos: 1,
    color: '#4ecdc4',
    start_time: '',
    end_time: ''
  })

  // Estados para opciones
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [escuelas, setEscuelas] = useState<Escuela[]>([])
  const [ciclos, setCiclos] = useState<Ciclo[]>([])


  // Estados de fechas
  const [newDate, setNewDate] = useState<string>('')
  const [selectedDates, setSelectedDates] = useState<string[]>([])

  // Modo de selección: manual (fecha por fecha) o patrón semanal
  const [modoSeleccion, setModoSeleccion] = useState<'manual' | 'patron'>('manual')
  const [diasSemana, setDiasSemana] = useState<number[]>([])
  const [rangoDesde, setRangoDesde] = useState<string>('')
  const [rangoHasta, setRangoHasta] = useState<string>('')
  const [patronInfo, setPatronInfo] = useState<string | null>(null)
  const [patronError, setPatronError] = useState<string | null>(null)

  // Estados de carga y errores
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creationResults, setCreationResults] = useState<CreationResult[]>([])
  const [showResults, setShowResults] = useState(false)
  
  // Estado para el popover de colores
  const [colorAnchorEl, setColorAnchorEl] = useState<HTMLButtonElement | null>(null)
  const colorPopoverOpen = Boolean(colorAnchorEl)

  // Cargar datos iniciales
  useEffect(() => {
    if (open) {
      loadInitialData()
      resetForm()
    }
  }, [open])

  const resetForm = () => {
    setFormData({
      laboratorio_id: 0,
      docente_id: 0,
      escuela_id: 0,
      ciclo_id: 0,
      descripcion: '',
      cantidad_alumnos: 1,
      color: '#4ecdc4',
      start_time: '',
      end_time: ''
    })
    setSelectedDates([])
    setNewDate('')
    setError(null)
    setCreationResults([])
    setShowResults(false)
    setModoSeleccion('manual')
    setDiasSemana([])
    setRangoDesde('')
    setRangoHasta('')
    setPatronInfo(null)
    setPatronError(null)
  }

  const loadInitialData = async () => {
    try {
      setLoadingData(true)
      const [labsRes, docentesRes, escuelasRes, ciclosRes] = await Promise.all([
        laboratorioService.getAll(),
        docenteService.getAll(),
        escuelaService.getAll(),
        horarioService.getCiclos()
      ])

      if (labsRes.data) {
        const sortedLabs = [...(labsRes.data || [])].sort((a, b) => a.nombre.localeCompare(b.nombre))
        setLaboratorios(sortedLabs)
      }
      if (docentesRes.data) {
        const sortedDocentes = [...(docentesRes.data || [])].sort((a, b) => a.nombre.localeCompare(b.nombre))
        setDocentes(sortedDocentes)
      }
      if (escuelasRes.data) {
        const sortedEscuelas = [...(escuelasRes.data || [])].sort((a, b) => a.nombre.localeCompare(b.nombre))
        setEscuelas(sortedEscuelas)
      }
      setCiclos(ciclosRes.data || [])
    } catch (error: any) {
      setError('Error al cargar datos iniciales')
    } finally {
      setLoadingData(false)
    }
  }

  // Manejo de cambios en escuela/ciclo
  const handleEscuelaChange = (escuela_id: number) => {
    setFormData(prev => ({ ...prev, escuela_id: escuela_id, ciclo_id: 0 }))
  }

  const handleCicloChange = (ciclo_id: number) => {
    setFormData(prev => ({ ...prev, ciclo_id: ciclo_id }))
  }

  // Agregar fecha a la lista
  const addDate = () => {
    if (newDate && !selectedDates.includes(newDate)) {
      const newDates = [...selectedDates, newDate].sort()
      setSelectedDates(newDates)
      setNewDate('')
    }
  }

  // Remover fecha de la lista
  const removeDate = (dateToRemove: string) => {
    const newDates = selectedDates.filter(date => date !== dateToRemove)
    setSelectedDates(newDates)
  }

  // Toggle de día de la semana (0=Dom, 1=Lun, ..., 6=Sáb)
  const toggleDiaSemana = (dia: number) => {
    setDiasSemana(prev =>
      prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia].sort()
    )
    setPatronInfo(null)
    setPatronError(null)
  }

  // Generar fechas a partir del patrón semanal
  const generarFechasPorPatron = () => {
    setPatronInfo(null)
    setPatronError(null)

    if (diasSemana.length === 0) {
      setPatronError('Seleccioná al menos un día de la semana')
      return
    }
    if (!rangoDesde || !rangoHasta) {
      setPatronError('Definí fecha "Desde" y "Hasta"')
      return
    }

    const desde = new Date(rangoDesde + 'T00:00:00')
    const hasta = new Date(rangoHasta + 'T00:00:00')

    if (isNaN(desde.getTime()) || isNaN(hasta.getTime())) {
      setPatronError('Las fechas ingresadas no son válidas')
      return
    }
    if (desde > hasta) {
      setPatronError('La fecha "Desde" debe ser menor o igual a la fecha "Hasta"')
      return
    }

    const diffDias = Math.floor((hasta.getTime() - desde.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDias > 365) {
      setPatronError('El rango máximo permitido es de 365 días')
      return
    }

    const generadas: string[] = []
    const cursor = new Date(desde)
    while (cursor <= hasta) {
      if (diasSemana.includes(cursor.getDay())) {
        const yyyy = cursor.getFullYear()
        const mm = String(cursor.getMonth() + 1).padStart(2, '0')
        const dd = String(cursor.getDate()).padStart(2, '0')
        generadas.push(`${yyyy}-${mm}-${dd}`)
      }
      cursor.setDate(cursor.getDate() + 1)
    }

    if (generadas.length === 0) {
      setPatronError('No se encontraron fechas que coincidan con los días seleccionados en ese rango')
      return
    }

    const nuevasFechas = generadas.filter(f => !selectedDates.includes(f))
    if (nuevasFechas.length === 0) {
      setPatronInfo('Todas las fechas generadas ya están en la lista')
      return
    }

    const totalProyectado = selectedDates.length + nuevasFechas.length
    if (totalProyectado > 30) {
      const confirmar = window.confirm(
        `Vas a agregar ${nuevasFechas.length} fechas (total: ${totalProyectado}). ¿Continuar?`
      )
      if (!confirmar) return
    }

    setSelectedDates([...selectedDates, ...nuevasFechas].sort())
    setPatronInfo(`Se agregaron ${nuevasFechas.length} fecha${nuevasFechas.length !== 1 ? 's' : ''} a la lista`)
  }

  // Validación del formulario
  const canSubmit = () => {
    return (
      formData.laboratorio_id > 0 &&
      formData.docente_id > 0 &&
      formData.escuela_id > 0 &&
      formData.ciclo_id > 0 &&
      formData.descripcion.trim() &&
      formData.cantidad_alumnos > 0 &&
      formData.start_time &&
      formData.end_time &&
      selectedDates.length > 0 &&
      formData.color
    )
  }

  // Submit del formulario
  const handleSubmit = async () => {
    if (!canSubmit()) {
      setError('Por favor completa todos los campos requeridos')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const results: CreationResult[] = []

      // Crear un horario para cada fecha seleccionada
      for (const dateStr of selectedDates) {
        try {
          const fechaInicio = `${dateStr} ${formData.start_time}:00`
          const fechaFin = `${dateStr} ${formData.end_time}:00`

          const horarioData: CreateHorarioData = {
            laboratorio_id: formData.laboratorio_id,
            docente_id: formData.docente_id,
            escuela_id: formData.escuela_id,
            ciclo_id: formData.ciclo_id,
            descripcion: formData.descripcion.trim(),
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            cantidad_alumnos: formData.cantidad_alumnos,
            color: formData.color,
            insumos: [] // Sin insumos por defecto en horarios recurrentes
          }

          const result = await horarioService.create(horarioData)
          
          results.push({
            date: dateStr,
            success: true,
            horario_id: result.id
          })
        } catch (error: any) {
          results.push({
            date: dateStr,
            success: false,
            error: error.response?.data?.message || error.message || 'Error desconocido'
          })
        }
      }

      setCreationResults(results)
      setShowResults(true)

      // Si al menos uno fue exitoso, consideramos éxito
      const successCount = results.filter(r => r.success).length
      if (successCount > 0) {
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 3000) // Mostrar resultados por 3 segundos
      }

    } catch (error: any) {
      setError(error.message || 'Error al crear horarios')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  // Función para formatear fecha
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + 'T00:00:00')
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      return dateStr
    }
  }

  // Obtener fecha mínima (hoy)
  const getMinDate = () => {
    return new Date().toISOString().split('T')[0]
  }

  if (showResults) {
    const successCount = creationResults.filter(r => r.success).length
    const errorCount = creationResults.filter(r => !r.success).length

    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle color="success" />
            Resultados de Creación de Horarios
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Alert severity={errorCount > 0 ? 'warning' : 'success'} sx={{ mb: 2 }}>
              {successCount > 0 && (
                <Typography>
                  ✅ <strong>{successCount}</strong> horario{successCount !== 1 ? 's' : ''} creado{successCount !== 1 ? 's' : ''} exitosamente
                </Typography>
              )}
              {errorCount > 0 && (
                <Typography>
                  ❌ <strong>{errorCount}</strong> horario{errorCount !== 1 ? 's' : ''} con errores
                </Typography>
              )}
            </Alert>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {creationResults.map((result, index) => (
                <Paper 
                  key={index}
                  sx={{ 
                    p: 1, 
                    backgroundColor: result.success ? 'success.light' : 'error.light',
                    color: result.success ? 'success.contrastText' : 'error.contrastText',
                    minWidth: 200
                  }}
                >
                  <Typography variant="body2" fontWeight="bold">
                    {formatDate(result.date)}
                  </Typography>
                  <Typography variant="caption">
                    {result.success ? '✅ Creado' : `❌ ${result.error}`}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="contained">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, md: 2 },
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Repeat color="primary" />
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              Crear Horarios Recurrentes
            </Typography>
          </Box>
          <IconButton onClick={handleClose} disabled={loading} sx={{ color: 'grey.500' }}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 2 }}>
        {loadingData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Cargando datos...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Información del curso y grupo */}
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 3 }}>
                Información del Curso
              </Typography>

              {/* Descripción y cantidad de alumnos */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <TextField
                  sx={{ flex: 1, minWidth: 250 }}
                  required
                  label="Descripción del Curso"
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Ej.: Algoritmos y Estructuras de Datos"
                />

                <TextField
                  sx={{ minWidth: 160 }}
                  required
                  type="number"
                  label="Cantidad de Alumnos"
                  value={formData.cantidad_alumnos}
                  onChange={(e) => setFormData(prev => ({ ...prev, cantidad_alumnos: Number(e.target.value) }))}
                  inputProps={{ min: 1, max: 50 }}
                />
              </Box>

              {/* Selección de escuela y ciclo */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <FormControl sx={{ minWidth: 180, flex: 1 }} required>
                  <InputLabel>Escuela</InputLabel>
                  <Select
                    value={formData.escuela_id}
                    onChange={(e) => handleEscuelaChange(Number(e.target.value))}
                    label="Escuela"
                  >
                    <MenuItem value={0} disabled>Seleccionar escuela</MenuItem>
                    {escuelas.map(escuela => (
                      <MenuItem key={escuela.id} value={escuela.id}>
                        {escuela.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 140 }} required>
                  <InputLabel>Ciclo</InputLabel>
                  <Select
                    value={formData.ciclo_id}
                    onChange={(e) => handleCicloChange(Number(e.target.value))}
                    label="Ciclo"
                    disabled={!formData.escuela_id || formData.escuela_id === 0}
                  >
                    <MenuItem value={0} disabled>Seleccionar ciclo</MenuItem>
                    {[...ciclos]
                      .sort((a, b) => {
                        const numA = parseInt(a.nombre.replace(/[^\d]/g, '')) || 0;
                        const numB = parseInt(b.nombre.replace(/[^\d]/g, '')) || 0;
                        return numA - numB;
                      })
                      .map(ciclo => (
                        <MenuItem key={ciclo.id} value={ciclo.id}>
                          {ciclo.nombre}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Laboratorio y docente */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 220, flex: 1 }} required>
                  <InputLabel>Laboratorio</InputLabel>
                  <Select
                    value={formData.laboratorio_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, laboratorio_id: Number(e.target.value) }))}
                    label="Laboratorio"
                  >
                    {laboratorios.map(lab => (
                      <MenuItem key={lab.id} value={lab.id}>
                        {lab.nombre} - {lab.ubicacion}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 220, flex: 1 }} required>
                  <InputLabel>Docente</InputLabel>
                  <Select
                    value={formData.docente_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, docente_id: Number(e.target.value) }))}
                    label="Docente"
                  >
                    {docentes.map(docente => (
                      <MenuItem key={docente.id} value={docente.id}>
                        {docente.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Paper>

            {/* Horarios y color */}
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 3 }}>
                Horario y Color
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <FormControl sx={{ minWidth: 180, flex: 1 }} required>
                  <InputLabel>Hora de Inicio</InputLabel>
                  <Select
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value, end_time: '' }))}
                    label="Hora de Inicio"
                  >
                    {TIME_BLOCKS.map(block => (
                      <MenuItem key={block.id} value={block.start}>
                        {block.label} - {block.start}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 180, flex: 1 }} required disabled={!formData.start_time}>
                  <InputLabel>Hora de Fin</InputLabel>
                  <Select
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    label="Hora de Fin"
                  >
                    {TIME_BLOCKS.map((block, index) => {
                      // Encontrar el índice del bloque de inicio
                      const startIndex = TIME_BLOCKS.findIndex(b => b.start === formData.start_time)
                      // Deshabilitar bloques anteriores al de inicio
                      const isDisabled = Boolean(formData.start_time && index < startIndex)
                      
                      return (
                        <MenuItem key={block.id} value={block.end} disabled={isDisabled}>
                          {block.label} - {block.end}
                        </MenuItem>
                      )
                    })}
                  </Select>
                </FormControl>

                {/* Selector de color */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      component="button"
                      onClick={(e) => setColorAnchorEl(e.currentTarget)}
                      sx={{
                        width: 47,
                        height: 47,
                        backgroundColor: formData.color,
                        borderRadius: '50%',
                        border: '2px solid',
                        borderColor: 'divider',
                        boxShadow: 2,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'scale(1.05)',
                          boxShadow: 4,
                          borderColor: 'primary.main',
                        },
                        '&:focus': {
                          outline: 'none',
                          borderColor: 'primary.main',
                        }
                      }}
                    />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Seleccione un color
                    </Typography>
                  </Box>
                  
                  <Popover
                    open={colorPopoverOpen}
                    anchorEl={colorAnchorEl}
                    onClose={() => setColorAnchorEl(null)}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'left',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'left',
                    }}
                    PaperProps={{
                      sx: {
                        p: 2,
                        mt: 1,
                        minWidth: 280,
                      }
                    }}
                  >
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(6, 1fr)', 
                      gap: 1,
                    }}>
                      {COLOR_PALETTE.map((colorOption) => (
                        <Box
                          key={colorOption.color}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, color: colorOption.color }))
                            setColorAnchorEl(null)
                          }}
                          sx={{
                            width: 36,
                            height: 36,
                            backgroundColor: colorOption.color,
                            borderRadius: '50%',
                            cursor: 'pointer',
                            border: formData.color === colorOption.color ? '3px solid #000' : '2px solid #ddd',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            '&:hover': {
                              transform: 'scale(1.1)',
                              boxShadow: 3
                            }
                          }}
                          title={colorOption.name}
                        >
                          {formData.color === colorOption.color && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                backgroundColor: 'white',
                                borderRadius: '50%',
                                boxShadow: 1
                              }}
                            />
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Popover>
                </Box>
              </Box>
            </Paper>

            {/* Selección de fechas */}
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Seleccionar Fechas
              </Typography>

              {/* Toggle de modo */}
              <ToggleButtonGroup
                value={modoSeleccion}
                exclusive
                onChange={(_e, val) => {
                  if (val) {
                    setModoSeleccion(val)
                    setPatronInfo(null)
                    setPatronError(null)
                  }
                }}
                size="small"
                sx={{ mb: 3 }}
                color="primary"
              >
                <ToggleButton value="manual" sx={{ textTransform: 'none', px: 2 }}>
                  <Event fontSize="small" sx={{ mr: 1 }} />
                  Fecha por fecha
                </ToggleButton>
                <ToggleButton value="patron" sx={{ textTransform: 'none', px: 2 }}>
                  <CalendarMonth fontSize="small" sx={{ mr: 1 }} />
                  Patrón semanal
                </ToggleButton>
              </ToggleButtonGroup>

            {modoSeleccion === 'manual' && (
              <>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Info fontSize="small" />
                    Selecciona una fecha y haz clic en "Agregar" para añadirla a la lista.
                  </Box>
                </Alert>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
                  <TextField
                    type="date"
                    label="Nueva Fecha"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: getMinDate() }}
                    sx={{ minWidth: 200 }}
                  />

                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={addDate}
                    disabled={!newDate || selectedDates.includes(newDate)}
                  >
                    Agregar Fecha
                  </Button>
                </Box>
              </>
            )}

            {modoSeleccion === 'patron' && (
              <Box sx={{ mb: 3 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Info fontSize="small" />
                    Elegí los días de la semana y un rango. Las fechas generadas se agregan a la lista; podés eliminar feriados manualmente con el botón ❌.
                  </Box>
                </Alert>

                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  Días de la semana
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {[
                    { d: 1, label: 'Lun' },
                    { d: 2, label: 'Mar' },
                    { d: 3, label: 'Mié' },
                    { d: 4, label: 'Jue' },
                    { d: 5, label: 'Vie' },
                    { d: 6, label: 'Sáb' },
                    { d: 0, label: 'Dom' },
                  ].map(({ d, label }) => {
                    const selected = diasSemana.includes(d)
                    return (
                      <Chip
                        key={d}
                        label={label}
                        clickable
                        onClick={() => toggleDiaSemana(d)}
                        color={selected ? 'primary' : 'default'}
                        variant={selected ? 'filled' : 'outlined'}
                        sx={{ minWidth: 60, fontWeight: 500 }}
                      />
                    )
                  })}
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                  <TextField
                    type="date"
                    label="Desde"
                    value={rangoDesde}
                    onChange={(e) => {
                      setRangoDesde(e.target.value)
                      setPatronInfo(null)
                      setPatronError(null)
                    }}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: getMinDate() }}
                    sx={{ minWidth: 180 }}
                  />
                  <TextField
                    type="date"
                    label="Hasta"
                    value={rangoHasta}
                    onChange={(e) => {
                      setRangoHasta(e.target.value)
                      setPatronInfo(null)
                      setPatronError(null)
                    }}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: rangoDesde || getMinDate() }}
                    sx={{ minWidth: 180 }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AutoAwesome />}
                    onClick={generarFechasPorPatron}
                    disabled={diasSemana.length === 0 || !rangoDesde || !rangoHasta}
                  >
                    Generar fechas
                  </Button>
                </Box>

                {patronError && (
                  <Alert severity="error" sx={{ mb: 1 }}>{patronError}</Alert>
                )}
                {patronInfo && (
                  <Alert severity="success" sx={{ mb: 1 }}>{patronInfo}</Alert>
                )}
              </Box>
            )}

            <Paper variant="outlined" sx={{ p: 2.5, minHeight: 200, maxHeight: 300, overflowY: 'auto', bgcolor: 'background.paper' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Fechas Seleccionadas ({selectedDates.length})
              </Typography>
              {selectedDates.length === 0 ? (
                <Alert severity="warning" sx={{ borderRadius: 1 }}>
                  No has seleccionado ninguna fecha. Agrega fechas usando el selector de arriba.
                </Alert>
              ) : (
                <List dense sx={{ pt: 1 }}>
                  {selectedDates.map((date, index) => (
                    <ListItem 
                      key={index}
                      sx={{ 
                        bgcolor: 'action.hover',
                        borderRadius: 1,
                        mb: 1,
                        px: 2,
                        py: 1
                      }}
                    >
                      <ListItemText
                        primary={formatDate(date)}
                        secondary={date}
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => removeDate(date)}
                          color="error"
                          size="small"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
            </Paper>

            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          variant="outlined"
          sx={{ minWidth: 100 }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || !canSubmit()}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Schedule />}
          sx={{ minWidth: 150 }}
        >
          {loading ? 'Creando...' : `Crear ${selectedDates.length} Horario${selectedDates.length !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
