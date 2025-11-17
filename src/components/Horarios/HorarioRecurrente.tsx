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
  IconButton
} from '@mui/material'
import {
  Schedule,
  Delete,
  Info,
  CheckCircle,
  Add,
  Repeat,
  Close
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

interface Grupo {
  id: number
  nombre: string
  escuela_id: number
  ciclo_id: number
}

interface CreationResult {
  date: string
  success: boolean
  error?: string
  horario_id?: number
}

export const HorarioRecurrente: React.FC<HorarioRecurrenteProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  // Estados del formulario
  const [formData, setFormData] = useState({
    laboratorio_id: 0,
    docente_id: 0,
    grupo_id: 0,
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
  const [grupos, setGrupos] = useState<Grupo[]>([])

  // Estados de selección en cascada
  const [selectedEscuela, setSelectedEscuela] = useState<number>(0)
  const [selectedCiclo, setSelectedCiclo] = useState<number>(0)

  // Estados de fechas
  const [newDate, setNewDate] = useState<string>('')
  const [selectedDates, setSelectedDates] = useState<string[]>([])

  // Estados de carga y errores
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creationResults, setCreationResults] = useState<CreationResult[]>([])
  const [showResults, setShowResults] = useState(false)

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
      grupo_id: 0,
      descripcion: '',
      cantidad_alumnos: 1,
      color: '#4ecdc4',
      start_time: '',
      end_time: ''
    })
    setSelectedDates([])
    setNewDate('')
    setSelectedEscuela(0)
    setSelectedCiclo(0)
    setError(null)
    setCreationResults([])
    setShowResults(false)
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

      setLaboratorios(labsRes.data || [])
      setDocentes(docentesRes.data || [])
      setEscuelas(escuelasRes.data || [])
      setCiclos(ciclosRes.data || [])
    } catch (error: any) {
      setError('Error al cargar datos iniciales')
      console.error('Error:', error)
    } finally {
      setLoadingData(false)
    }
  }

  // Cargar grupos cuando cambian escuela o ciclo
  useEffect(() => {
    if (selectedEscuela && selectedCiclo) {
      loadGrupos()
    } else {
      setGrupos([])
      setFormData(prev => ({ ...prev, grupo_id: 0 }))
    }
  }, [selectedEscuela, selectedCiclo])

  const loadGrupos = async () => {
    try {
      const response = await horarioService.getGrupos(selectedEscuela, selectedCiclo)
      setGrupos(response.data || [])
    } catch (error) {
      console.error('Error al cargar grupos:', error)
      setGrupos([])
    }
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

  // Validación del formulario
  const canSubmit = () => {
    return (
      formData.laboratorio_id > 0 &&
      formData.docente_id > 0 &&
      formData.grupo_id > 0 &&
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
            grupo_id: formData.grupo_id,
            descripcion: formData.descripcion.trim(),
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            cantidad_alumnos: formData.cantidad_alumnos,
            color: formData.color,
            insumos: [] // Sin insumos por defecto en horarios recurrentes
          }

          console.log(`📅 Creando horario para ${dateStr}:`, horarioData)
          const result = await horarioService.create(horarioData)
          
          results.push({
            date: dateStr,
            success: true,
            horario_id: result.id
          })
        } catch (error: any) {
          console.error(`❌ Error creando horario para ${dateStr}:`, error)
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

              {/* Selección de grupo académico */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <FormControl sx={{ minWidth: 180, flex: 1 }} required>
                  <InputLabel>Escuela</InputLabel>
                  <Select
                    value={selectedEscuela}
                    onChange={(e) => setSelectedEscuela(Number(e.target.value))}
                    label="Escuela"
                  >
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
                    value={selectedCiclo}
                    onChange={(e) => setSelectedCiclo(Number(e.target.value))}
                    label="Ciclo"
                    disabled={!selectedEscuela}
                  >
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

                <FormControl sx={{ minWidth: 140 }} required>
                  <InputLabel>Grupo</InputLabel>
                  <Select
                    value={formData.grupo_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, grupo_id: Number(e.target.value) }))}
                    label="Grupo"
                    disabled={!selectedEscuela || !selectedCiclo}
                  >
                    {grupos.map(grupo => (
                      <MenuItem key={grupo.id} value={grupo.id}>
                        {grupo.nombre}
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

                <TextField
                  sx={{ minWidth: 120 }}
                  type="color"
                  label="Color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  helperText="Color del horario en el calendario"
                />
              </Box>
            </Paper>

            {/* Selección de fechas */}
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 3 }}>
                Seleccionar Fechas
              </Typography>
            
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
