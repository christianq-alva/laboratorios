import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Divider,
  Grid,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Stepper,
  Step,
  StepLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import {
  Close,
  Schedule,
  Person,
  LocationOn,
  School,
  Group,
  Inventory,
  Add,
  Remove,
  Warning,
  CheckCircle,
  ExpandMore,
} from '@mui/icons-material'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { horarioService } from '../../services/horarioService'
import { laboratorioService } from '../../services/laboratorioService'
import type { 
  Horario, 
  CreateHorarioData, 
  Docente, 
  Escuela, 
  Ciclo, 
  Grupo, 
  Insumo,
  ConflictoHorario
} from '../../services/horarioService'
import type { Laboratorio } from '../../services/laboratorioService'

interface HorarioFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  horario?: Horario | null
}

interface InsumoSeleccionado {
  insumo_id: number
  nombre: string
  cantidad: number
  stock_disponible: number
}

const steps = ['Básico', 'Fechas', 'Insumos', 'Confirmación']

export const HorarioForm: React.FC<HorarioFormProps> = ({ open, onClose, onSuccess, horario }) => {
  // Estados del formulario
  const [activeStep, setActiveStep] = useState(0)
  const [formData, setFormData] = useState<CreateHorarioData>({
    laboratorio_id: 0,
    docente_id: 0,
    grupo_id: 0,
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    insumos: []
  })

  // Estados para opciones de formulario
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [escuelas, setEscuelas] = useState<Escuela[]>([])
  const [ciclos, setCiclos] = useState<Ciclo[]>([])
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [insumosDisponibles, setInsumosDisponibles] = useState<Insumo[]>([])
  const [insumosSeleccionados, setInsumosSeleccionados] = useState<InsumoSeleccionado[]>([])

  // Estados de selección en cascada
  const [selectedEscuela, setSelectedEscuela] = useState<number>(0)
  const [selectedCiclo, setSelectedCiclo] = useState<number>(0)

  // Estados de carga y errores
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflictos, setConflictos] = useState<ConflictoHorario[]>([])
  const [verificandoDisponibilidad, setVerificandoDisponibilidad] = useState(false)

  const isEditing = Boolean(horario)

  // Cargar datos iniciales
  useEffect(() => {
    if (open) {
      loadInitialData()
      if (horario) {
        loadHorarioData(horario)
      } else {
        resetForm()
      }
    }
  }, [horario, open])

  const loadInitialData = async () => {
    try {
      setLoadingData(true)
      
      const [labsResult, docentesResult, escuelasResult, ciclosResult] = await Promise.all([
        laboratorioService.getAll(),
        horarioService.getDocentes(),
        horarioService.getEscuelas(),
        horarioService.getCiclos()
      ])

      if (labsResult.success) setLaboratorios(labsResult.data || [])
      if (docentesResult.success) setDocentes(docentesResult.data || [])
      if (escuelasResult.success) setEscuelas(escuelasResult.data || [])
      if (ciclosResult.success) setCiclos(ciclosResult.data || [])

      // Cargar todos los grupos inicialmente para facilitar la selección
      const gruposResult = await horarioService.getGrupos()
      if (gruposResult.success) {
        setGrupos(gruposResult.data || [])
      }

    } catch (err) {
      console.error('Error loading initial data:', err)
      setError('Error al cargar datos iniciales')
    } finally {
      setLoadingData(false)
    }
  }

  const loadHorarioData = async (horarioData: Horario) => {
    setFormData({
      laboratorio_id: horarioData.laboratorio_id,
      docente_id: horarioData.docente_id,
      grupo_id: horarioData.grupo_id,
      descripcion: horarioData.descripcion,
      fecha_inicio: horarioData.fecha_inicio,
      fecha_fin: horarioData.fecha_fin,
      insumos: horarioData.insumos?.map(i => ({
        insumo_id: i.id,
        cantidad: i.cantidad_usada
      })) || []
    })

    // Si estamos editando, encontrar la escuela y ciclo del grupo seleccionado
    if (horarioData.grupo_id) {
      try {
        const gruposResult = await horarioService.getGrupos()
        if (gruposResult.success) {
          const grupos = gruposResult.data || []
          setGrupos(grupos)
          
          const grupoSeleccionado = grupos.find((g: Grupo) => g.id === horarioData.grupo_id)
          if (grupoSeleccionado) {
            setSelectedEscuela(grupoSeleccionado.escuela_id)
            setSelectedCiclo(grupoSeleccionado.ciclo_id)
          }
        }
      } catch (err) {
        console.error('Error loading grupo data for editing:', err)
      }
    }

    // Cargar insumos seleccionados
    if (horarioData.insumos) {
      setInsumosSeleccionados(horarioData.insumos.map(i => ({
        insumo_id: i.id,
        nombre: i.nombre,
        cantidad: i.cantidad_usada,
        stock_disponible: i.stock_disponible || 0
      })))
    }

    // Cargar insumos del laboratorio si ya está seleccionado
    if (horarioData.laboratorio_id) {
      try {
        const result = await horarioService.getInsumosByLaboratorio(horarioData.laboratorio_id)
        if (result.success) {
          setInsumosDisponibles(result.data || [])
        }
      } catch (err) {
        console.error('Error loading insumos for editing:', err)
      }
    }
  }

  const resetForm = () => {
    setActiveStep(0)
    setFormData({
      laboratorio_id: 0,
      docente_id: 0,
      grupo_id: 0,
      descripcion: '',
      fecha_inicio: '',
      fecha_fin: '',
      insumos: []
    })
    setSelectedEscuela(0)
    setSelectedCiclo(0)
    setInsumosSeleccionados([])
    setConflictos([])
    setError(null)
  }

  // Manejo de cambios en escuela/ciclo/grupo
  const handleEscuelaChange = async (escuela_id: number) => {
    setSelectedEscuela(escuela_id)
    setSelectedCiclo(0)
    setFormData(prev => ({ ...prev, grupo_id: 0 }))
    
    if (escuela_id > 0) {
      try {
        const result = await horarioService.getGrupos(escuela_id)
        if (result.success) {
          setGrupos(result.data || [])
        }
      } catch (err) {
        console.error('Error loading grupos:', err)
        setGrupos([])
      }
    } else {
      // Si no hay escuela seleccionada, mostrar todos los grupos
      try {
        const result = await horarioService.getGrupos()
        if (result.success) {
          setGrupos(result.data || [])
        }
      } catch (err) {
        console.error('Error loading all grupos:', err)
        setGrupos([])
      }
    }
  }

  const handleCicloChange = async (ciclo_id: number) => {
    setSelectedCiclo(ciclo_id)
    setFormData(prev => ({ ...prev, grupo_id: 0 }))
    
    if (selectedEscuela > 0 && ciclo_id > 0) {
      try {
        const result = await horarioService.getGrupos(selectedEscuela, ciclo_id)
        if (result.success) {
          setGrupos(result.data || [])
        }
      } catch (err) {
        console.error('Error loading grupos:', err)
        setGrupos([])
      }
    } else if (selectedEscuela > 0) {
      // Si hay escuela pero no ciclo, cargar grupos de esa escuela
      try {
        const result = await horarioService.getGrupos(selectedEscuela)
        if (result.success) {
          setGrupos(result.data || [])
        }
      } catch (err) {
        console.error('Error loading grupos by escuela:', err)
        setGrupos([])
      }
    } else {
      // Si no hay escuela, mostrar todos los grupos
      try {
        const result = await horarioService.getGrupos()
        if (result.success) {
          setGrupos(result.data || [])
        }
      } catch (err) {
        console.error('Error loading all grupos:', err)
        setGrupos([])
      }
    }
  }

  // Cargar insumos cuando se selecciona laboratorio
  const handleLaboratorioChange = async (laboratorio_id: number) => {
    setFormData(prev => ({ ...prev, laboratorio_id }))
    
    if (laboratorio_id > 0) {
      try {
        const result = await horarioService.getInsumosByLaboratorio(laboratorio_id)
        if (result.success) {
          setInsumosDisponibles(result.data || [])
        }
      } catch (err) {
        console.error('Error loading insumos:', err)
      }
    } else {
      setInsumosDisponibles([])
    }
  }

  // Verificar disponibilidad de horario
  const verificarDisponibilidad = async () => {
    if (formData.laboratorio_id && formData.docente_id && formData.fecha_inicio && formData.fecha_fin) {
      try {
        setVerificandoDisponibilidad(true)
        const result = await horarioService.verificarDisponibilidad({
          laboratorio_id: formData.laboratorio_id,
          docente_id: formData.docente_id,
          fecha_inicio: formData.fecha_inicio,
          fecha_fin: formData.fecha_fin,
          horario_id: horario?.id
        })
        
        if (result.success) {
          setConflictos(result.conflictos || [])
        } else {
          setError(result.message || 'Error al verificar disponibilidad')
        }
      } catch (err) {
        console.error('Error verificando disponibilidad:', err)
        setError('Error al verificar disponibilidad')
      } finally {
        setVerificandoDisponibilidad(false)
      }
    }
  }

  // Manejo de insumos
  const agregarInsumo = (insumo: Insumo) => {
    const yaSeleccionado = insumosSeleccionados.find(i => i.insumo_id === insumo.id)
    if (!yaSeleccionado) {
      const nuevoInsumo: InsumoSeleccionado = {
        insumo_id: insumo.id,
        nombre: insumo.nombre,
        cantidad: 1,
        stock_disponible: insumo.stock_disponible || 0
      }
      setInsumosSeleccionados(prev => [...prev, nuevoInsumo])
    }
  }

  const actualizarCantidadInsumo = (insumo_id: number, cantidad: number) => {
    if (cantidad <= 0) {
      setInsumosSeleccionados(prev => prev.filter(i => i.insumo_id !== insumo_id))
    } else {
      setInsumosSeleccionados(prev => 
        prev.map(i => i.insumo_id === insumo_id ? { ...i, cantidad } : i)
      )
    }
  }

  // Navegación entre pasos
  const handleNext = () => {
    if (activeStep === 1) {
      verificarDisponibilidad()
    }
    setActiveStep(prev => Math.min(prev + 1, steps.length - 1))
  }

  const handleBack = () => {
    setActiveStep(prev => Math.max(prev - 1, 0))
  }

  // Submit del formulario
  const handleSubmit = async () => {
    if (conflictos.length > 0) {
      setError('No se puede crear el horario debido a conflictos de disponibilidad')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Preparar datos finales
      const finalData: CreateHorarioData = {
        ...formData,
        insumos: insumosSeleccionados.map(i => ({
          insumo_id: i.insumo_id,
          cantidad: i.cantidad
        }))
      }

      let result
      if (isEditing && horario) {
        result = await horarioService.update(horario.id, finalData)
      } else {
        result = await horarioService.create(finalData)
      }

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.message || 'Error al guardar el horario')
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  const canProceedToNext = () => {
    switch (activeStep) {
      case 0:
        return formData.laboratorio_id > 0 && formData.docente_id > 0 && formData.grupo_id > 0 && formData.descripcion.trim()
      case 1:
        return formData.fecha_inicio && formData.fecha_fin
      case 2:
        return true // Los insumos son opcionales
      case 3:
        return conflictos.length === 0
      default:
        return false
    }
  }

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Grid container spacing={3}>
            {/* Laboratorio */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Laboratorio</InputLabel>
                <Select
                  value={formData.laboratorio_id}
                  label="Laboratorio"
                  onChange={(e) => handleLaboratorioChange(e.target.value as number)}
                  disabled={loadingData}
                >
                  <MenuItem value={0} disabled>Seleccionar laboratorio</MenuItem>
                  {laboratorios.map((lab) => (
                    <MenuItem key={lab.id} value={lab.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOn fontSize="small" />
                        {lab.nombre} - {lab.ubicacion}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Docente */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Docente</InputLabel>
                <Select
                  value={formData.docente_id}
                  label="Docente"
                  onChange={(e) => setFormData(prev => ({ ...prev, docente_id: e.target.value as number }))}
                  disabled={loadingData}
                >
                  <MenuItem value={0} disabled>Seleccionar docente</MenuItem>
                  {docentes.map((docente) => (
                    <MenuItem key={docente.id} value={docente.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person fontSize="small" />
                        {docente.nombre}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Escuela */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Escuela</InputLabel>
                <Select
                  value={selectedEscuela}
                  label="Escuela"
                  onChange={(e) => handleEscuelaChange(e.target.value as number)}
                  disabled={loadingData}
                >
                  <MenuItem value={0} disabled>Seleccionar escuela</MenuItem>
                  {escuelas.map((escuela) => (
                    <MenuItem key={escuela.id} value={escuela.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <School fontSize="small" />
                        {escuela.nombre}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Ciclo */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Ciclo</InputLabel>
                <Select
                  value={selectedCiclo}
                  label="Ciclo"
                  onChange={(e) => handleCicloChange(e.target.value as number)}
                  disabled={loadingData || selectedEscuela === 0}
                >
                  <MenuItem value={0} disabled>Seleccionar ciclo</MenuItem>
                  {ciclos.map((ciclo) => (
                    <MenuItem key={ciclo.id} value={ciclo.id}>
                      {ciclo.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Grupo */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Grupo</InputLabel>
                <Select
                  value={formData.grupo_id}
                  label="Grupo"
                  onChange={(e) => setFormData(prev => ({ ...prev, grupo_id: e.target.value as number }))}
                  disabled={loadingData || grupos.length === 0}
                >
                  <MenuItem value={0} disabled>Seleccionar grupo</MenuItem>
                  {grupos.map((grupo) => (
                    <MenuItem key={grupo.id} value={grupo.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Group fontSize="small" />
                        {grupo.nombre}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Descripción */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descripción de la actividad"
                value={formData.descripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Describe la actividad o clase que se realizará..."
              />
            </Grid>
          </Grid>
        )

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Schedule />
                Programación de Fechas y Horas
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Selecciona el rango de fecha y hora para la reserva del laboratorio
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <DateTimePicker
                label="Fecha y hora de inicio"
                value={formData.fecha_inicio ? new Date(formData.fecha_inicio) : null}
                onChange={(date) => setFormData(prev => ({ 
                  ...prev, 
                  fecha_inicio: date ? date.toISOString() : '' 
                }))}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true
                  }
                }}
                minDateTime={new Date()}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DateTimePicker
                label="Fecha y hora de fin"
                value={formData.fecha_fin ? new Date(formData.fecha_fin) : null}
                onChange={(date) => setFormData(prev => ({ 
                  ...prev, 
                  fecha_fin: date ? date.toISOString() : '' 
                }))}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true
                  }
                }}
                minDateTime={formData.fecha_inicio ? new Date(formData.fecha_inicio) : new Date()}
              />
            </Grid>

            {/* Verificación de disponibilidad */}
            {formData.fecha_inicio && formData.fecha_fin && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle1">
                      Verificación de Disponibilidad
                    </Typography>
                    {verificandoDisponibilidad && <CircularProgress size={20} />}
                  </Box>
                  
                  {conflictos.length === 0 && !verificandoDisponibilidad && (
                    <Alert severity="success" icon={<CheckCircle />}>
                      ✅ El laboratorio y docente están disponibles en el horario seleccionado
                    </Alert>
                  )}
                  
                  {conflictos.length > 0 && (
                    <Alert severity="error" icon={<Warning />}>
                      <Typography variant="body2" gutterBottom>
                        <strong>Se encontraron conflictos de horario:</strong>
                      </Typography>
                      {conflictos.map((conflicto, index) => (
                        <Typography key={index} variant="body2" sx={{ ml: 2 }}>
                          • {conflicto.mensaje}
                        </Typography>
                      ))}
                    </Alert>
                  )}
                </Paper>
              </Grid>
            )}
          </Grid>
        )

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Inventory />
                Selección de Insumos (Opcional)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Selecciona los insumos que se utilizarán durante la clase
              </Typography>
            </Grid>

            {/* Insumos disponibles */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Insumos Disponibles
              </Typography>
              <Paper sx={{ maxHeight: 300, overflow: 'auto' }}>
                <List dense>
                  {insumosDisponibles.map((insumo) => (
                    <ListItem 
                      key={insumo.id}
                      button
                      onClick={() => agregarInsumo(insumo)}
                      disabled={insumosSeleccionados.some(i => i.insumo_id === insumo.id)}
                    >
                      <ListItemText
                        primary={insumo.nombre}
                        secondary={`Stock disponible: ${insumo.stock_disponible || 0}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => agregarInsumo(insumo)}
                          disabled={insumosSeleccionados.some(i => i.insumo_id === insumo.id)}
                        >
                          <Add />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>

            {/* Insumos seleccionados */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Insumos Seleccionados ({insumosSeleccionados.length})
              </Typography>
              <Paper sx={{ maxHeight: 300, overflow: 'auto' }}>
                <List dense>
                  {insumosSeleccionados.map((insumo) => (
                    <ListItem key={insumo.insumo_id}>
                      <ListItemText
                        primary={insumo.nombre}
                        secondary={`Stock: ${insumo.stock_disponible}`}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => actualizarCantidadInsumo(insumo.insumo_id, insumo.cantidad - 1)}
                        >
                          <Remove />
                        </IconButton>
                        <Typography variant="body2" sx={{ minWidth: 30, textAlign: 'center' }}>
                          {insumo.cantidad}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => actualizarCantidadInsumo(insumo.insumo_id, insumo.cantidad + 1)}
                          disabled={insumo.cantidad >= insumo.stock_disponible}
                        >
                          <Add />
                        </IconButton>
                      </Box>
                    </ListItem>
                  ))}
                  {insumosSeleccionados.length === 0 && (
                    <ListItem>
                      <ListItemText 
                        primary="No hay insumos seleccionados"
                        secondary="Los insumos son opcionales para crear un horario"
                      />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </Grid>
          </Grid>
        )

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Confirmación de Horario
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Revisa los datos antes de {isEditing ? 'actualizar' : 'crear'} el horario
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>Información Básica</Typography>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Laboratorio:</Typography>
                    <Typography variant="body1">{laboratorios.find(l => l.id === formData.laboratorio_id)?.nombre}</Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Docente:</Typography>
                    <Typography variant="body1">{docentes.find(d => d.id === formData.docente_id)?.nombre}</Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Grupo:</Typography>
                    <Typography variant="body1">{grupos.find(g => g.id === formData.grupo_id)?.nombre}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Descripción:</Typography>
                    <Typography variant="body1">{formData.descripcion}</Typography>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>Horario</Typography>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Inicio:</Typography>
                    <Typography variant="body1">
                      {formData.fecha_inicio ? new Date(formData.fecha_inicio).toLocaleString('es-ES') : ''}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Fin:</Typography>
                    <Typography variant="body1">
                      {formData.fecha_fin ? new Date(formData.fecha_fin).toLocaleString('es-ES') : ''}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {insumosSeleccionados.length > 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Insumos Seleccionados ({insumosSeleccionados.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {insumosSeleccionados.map((insumo) => (
                        <Chip
                          key={insumo.insumo_id}
                          label={`${insumo.nombre} (${insumo.cantidad})`}
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Box>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Box>
        )

      default:
        return null
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, minHeight: '80vh' } }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {isEditing ? 'Editar Horario' : 'Nuevo Horario'}
          </Typography>
          <IconButton onClick={handleClose} disabled={loading} sx={{ color: 'grey.500' }}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loadingData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Cargando datos...
            </Typography>
          </Box>
        ) : (
          <>
            {/* Stepper */}
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Error general */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Contenido del paso actual */}
            {renderStepContent()}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          Cancelar
        </Button>
        
        {activeStep > 0 && (
          <Button
            onClick={handleBack}
            disabled={loading}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Anterior
          </Button>
        )}
        
        {activeStep < steps.length - 1 ? (
          <Button
            onClick={handleNext}
            disabled={loading || !canProceedToNext()}
            variant="contained"
            sx={{ borderRadius: 2, px: 3 }}
          >
            Siguiente
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={loading || !canProceedToNext()}
            variant="contained"
            sx={{ borderRadius: 2, px: 3 }}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              isEditing ? 'Actualizar Horario' : 'Crear Horario'
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
} 