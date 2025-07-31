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
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Stepper,
  Step,
  StepLabel,
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
  const [verificandoDisponibilidad, setVerificandoDisponibilidad] = useState(false)
  const [conflictos, setConflictos] = useState<ConflictoHorario[]>([])

  // Estados de edición
  const isEditing = !!horario

  // Cargar datos iniciales
  useEffect(() => {
    if (open) {
      loadInitialData()
      if (horario) {
        loadHorarioData(horario)
      }
    }
  }, [open, horario])

  const loadInitialData = async () => {
    try {
      setLoadingData(true)
      const [laboratoriosData, docentesData, escuelasData] = await Promise.all([
        laboratorioService.getAll(),
        horarioService.getDocentes(),
        horarioService.getEscuelas()
      ])
      
      setLaboratorios(laboratoriosData)
      setDocentes(docentesData)
      setEscuelas(escuelasData)
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos')
    } finally {
      setLoadingData(false)
    }
  }

  const loadHorarioData = async (horarioData: Horario) => {
    try {
      setLoadingData(true)
      
      // Cargar datos relacionados
      const [escuelasData, ciclosData] = await Promise.all([
        horarioService.getEscuelas(),
        horarioService.getCiclos()
      ])
      
      setEscuelas(escuelasData)
      setCiclos(ciclosData)
      
      // Establecer valores del formulario
      setFormData({
        laboratorio_id: horarioData.laboratorio_id,
        docente_id: horarioData.docente_id,
        grupo_id: horarioData.grupo_id,
        descripcion: horarioData.descripcion,
        fecha_inicio: horarioData.fecha_inicio,
        fecha_fin: horarioData.fecha_fin,
        insumos: []
      })
      
             // Cargar datos en cascada
       if (horarioData.escuela) {
         const escuela = escuelasData.find((e: Escuela) => e.nombre === horarioData.escuela)
         if (escuela) {
           setSelectedEscuela(escuela.id)
           await handleEscuelaChange(escuela.id)
         }
       }
       
       if (horarioData.ciclo) {
         const ciclo = ciclosData.find((c: Ciclo) => c.nombre === horarioData.ciclo)
         if (ciclo) {
           setSelectedCiclo(ciclo.id)
           await handleCicloChange(ciclo.id)
         }
       }
      
      // Cargar insumos del laboratorio
      if (horarioData.laboratorio_id) {
        await handleLaboratorioChange(horarioData.laboratorio_id)
      }
      
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos del horario')
    } finally {
      setLoadingData(false)
    }
  }

  // Manejo de selección en cascada
  const handleEscuelaChange = async (escuela_id: number) => {
    setSelectedEscuela(escuela_id)
    setSelectedCiclo(0)
    setFormData(prev => ({ ...prev, grupo_id: 0 }))
    setGrupos([])
    
    if (escuela_id > 0) {
      try {
        const ciclosData = await horarioService.getCiclos()
        setCiclos(ciclosData)
      } catch (err: any) {
        setError(err.message || 'Error al cargar ciclos')
      }
    }
  }

  const handleCicloChange = async (ciclo_id: number) => {
    setSelectedCiclo(ciclo_id)
    setFormData(prev => ({ ...prev, grupo_id: 0 }))
    
    if (ciclo_id > 0 && selectedEscuela > 0) {
      try {
        const gruposData = await horarioService.getGrupos(selectedEscuela, ciclo_id)
        setGrupos(gruposData)
      } catch (err: any) {
        setError(err.message || 'Error al cargar grupos')
      }
    }
  }

  const handleLaboratorioChange = async (laboratorio_id: number) => {
    setFormData(prev => ({ ...prev, laboratorio_id }))
    setInsumosSeleccionados([])
    
    if (laboratorio_id > 0) {
      try {
        const insumosData = await horarioService.getInsumosByLaboratorio(laboratorio_id)
        setInsumosDisponibles(insumosData)
      } catch (err: any) {
        console.error('Error al cargar insumos:', err)
      }
    }
  }

  // Verificación de disponibilidad
  const verificarDisponibilidad = async () => {
    if (!formData.laboratorio_id || !formData.docente_id || !formData.fecha_inicio || !formData.fecha_fin) {
      return
    }

    try {
      setVerificandoDisponibilidad(true)
      setError(null)
      
      const result = await horarioService.verificarDisponibilidad({
        laboratorio_id: formData.laboratorio_id,
        docente_id: formData.docente_id,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        horario_id: horario?.id
      })
      
      if (result.disponible) {
        setConflictos([])
      } else {
        setConflictos([{
          tipo: result.tipo_conflicto || 'laboratorio',
          mensaje: result.motivo || 'Conflicto de disponibilidad',
          horario_conflicto: result.conflicto_detalle
        }])
      }
    } catch (err) {
      console.error('Error verificando disponibilidad:', err)
      setError('Error al verificar disponibilidad')
    } finally {
      setVerificandoDisponibilidad(false)
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

      if (result.id) {
        onSuccess()
        onClose()
      } else {
        setError('Error al guardar el horario')
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
        return formData.laboratorio_id > 0 && formData.docente_id > 0 && formData.grupo_id > 0
      case 1:
        return formData.fecha_inicio && formData.fecha_fin
      case 2:
        return true // Los insumos son opcionales
      default:
        return true
    }
  }

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Laboratorio y Docente */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              {/* Laboratorio */}
              <Box>
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
              </Box>

              {/* Docente */}
              <Box>
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
              </Box>
            </Box>

            {/* Escuela, Ciclo, Grupo */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
              {/* Escuela */}
              <Box>
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
              </Box>

              {/* Ciclo */}
              <Box>
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
              </Box>

              {/* Grupo */}
              <Box>
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
              </Box>
            </Box>

            {/* Descripción */}
            <Box>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descripción de la actividad"
                value={formData.descripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Describe la actividad o clase que se realizará..."
              />
            </Box>
          </Box>
        )

      case 1:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Schedule />
                Programación de Fechas y Horas
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Selecciona el rango de fecha y hora para la reserva del laboratorio
              </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <Box>
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
              </Box>

              <Box>
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
              </Box>
            </Box>

            {/* Verificación de disponibilidad */}
            {formData.fecha_inicio && formData.fecha_fin && (
              <Box>
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
              </Box>
            )}
          </Box>
        )

      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Inventory />
                Selección de Insumos (Opcional)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Selecciona los insumos que se utilizarán durante la clase
              </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              {/* Insumos disponibles */}
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Insumos Disponibles
                </Typography>
                <Paper sx={{ maxHeight: 300, overflow: 'auto' }}>
                  <List dense>
                    {insumosDisponibles.map((insumo) => (
                      <ListItem 
                        key={insumo.id}
                        onClick={() => agregarInsumo(insumo)}
                        sx={{ 
                          cursor: 'pointer',
                          opacity: insumosSeleccionados.some(i => i.insumo_id === insumo.id) ? 0.5 : 1,
                          pointerEvents: insumosSeleccionados.some(i => i.insumo_id === insumo.id) ? 'none' : 'auto'
                        }}
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
              </Box>

              {/* Insumos seleccionados */}
              <Box>
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
              </Box>
            </Box>
          </Box>
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

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <Box>
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
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Descripción:</Typography>
                    <Typography variant="body1">{formData.descripcion || 'Sin descripción'}</Typography>
                  </Box>
                </Paper>
              </Box>

              <Box>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>Horario</Typography>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Inicio:</Typography>
                    <Typography variant="body1">
                      {formData.fecha_inicio ? new Date(formData.fecha_inicio).toLocaleString() : 'No definido'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Fin:</Typography>
                    <Typography variant="body1">
                      {formData.fecha_fin ? new Date(formData.fecha_fin).toLocaleString() : 'No definido'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Insumos:</Typography>
                    <Typography variant="body1">
                      {insumosSeleccionados.length > 0 
                        ? `${insumosSeleccionados.length} insumo(s) seleccionado(s)`
                        : 'Sin insumos'
                      }
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            </Box>

            {/* Conflictos */}
            {conflictos.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="warning">
                  <Typography variant="body2">
                    <strong>⚠️ Advertencia:</strong> Hay conflictos de disponibilidad que deben resolverse antes de continuar.
                  </Typography>
                </Alert>
              </Box>
            )}
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
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">
          {isEditing ? 'Editar Horario' : 'Nuevo Horario'}
        </Typography>
        <IconButton onClick={handleClose} disabled={loading}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          onClick={handleBack} 
          disabled={activeStep === 0 || loading}
        >
          Atrás
        </Button>
        
        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || conflictos.length > 0}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!canProceedToNext() || loading}
          >
            Siguiente
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
} 