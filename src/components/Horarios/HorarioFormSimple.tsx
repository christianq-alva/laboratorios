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
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
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

export const HorarioFormSimple: React.FC<HorarioFormProps> = ({ open, onClose, onSuccess, horario }) => {
  // Estados del formulario
  const [formData, setFormData] = useState<CreateHorarioData>({
    laboratorio_id: 0,
    docente_id: 0,
    grupo_id: 0,
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    cantidad_alumnos: 1,
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
  const [showInsumos, setShowInsumos] = useState(false)

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
      
      const [labsResult, docentesResult, escuelasResult, ciclosResult, gruposResult] = await Promise.all([
        laboratorioService.getAll(),
        horarioService.getDocentes(),
        horarioService.getEscuelas(),
        horarioService.getCiclos(),
        horarioService.getGrupos()
      ])

      if (labsResult.success) setLaboratorios(labsResult.data || [])
      if (docentesResult.success) setDocentes(docentesResult.data || [])
      if (escuelasResult.success) setEscuelas(escuelasResult.data || [])
      if (ciclosResult.success) setCiclos(ciclosResult.data || [])
      if (gruposResult.success) setGrupos(gruposResult.data || [])

    } catch (err) {
      console.error('Error loading initial data:', err)
      setError('Error al cargar datos iniciales')
    } finally {
      setLoadingData(false)
    }
  }

  const loadHorarioData = async (horarioData: Horario) => {
    // Convertir fechas ISO a formato datetime-local
    const formatDateTimeLocal = (isoString: string) => {
      const date = new Date(isoString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}`
    }

    setFormData({
      laboratorio_id: horarioData.laboratorio_id,
      docente_id: horarioData.docente_id,
      grupo_id: horarioData.grupo_id,
      descripcion: horarioData.descripcion,
      fecha_inicio: formatDateTimeLocal(horarioData.fecha_inicio),
      fecha_fin: formatDateTimeLocal(horarioData.fecha_fin),
      cantidad_alumnos: horarioData.cantidad_alumnos || 1,
      insumos: horarioData.insumos?.map(i => ({
        insumo_id: i.id,
        cantidad: i.cantidad_usada
      })) || []
    })

    // Si estamos editando, encontrar la escuela y ciclo del grupo seleccionado
    if (horarioData.grupo_id && grupos.length > 0) {
      const grupoSeleccionado = grupos.find((g: Grupo) => g.id === horarioData.grupo_id)
      if (grupoSeleccionado) {
        setSelectedEscuela(grupoSeleccionado.escuela_id)
        setSelectedCiclo(grupoSeleccionado.ciclo_id)
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
      await loadInsumosByLaboratorio(horarioData.laboratorio_id)
    }
  }

  const resetForm = () => {
    setFormData({
      laboratorio_id: 0,
      docente_id: 0,
      grupo_id: 0,
      descripcion: '',
      fecha_inicio: '',
      fecha_fin: '',
      cantidad_alumnos: 1,
      insumos: []
    })
    setSelectedEscuela(0)
    setSelectedCiclo(0)
    setInsumosSeleccionados([])
    setConflictos([])
    setError(null)
    setShowInsumos(false)
  }

  // Manejo de cambios en escuela/ciclo/grupo
  const handleEscuelaChange = async (escuela_id: number) => {
    setSelectedEscuela(escuela_id)
    setSelectedCiclo(0)
    setFormData(prev => ({ ...prev, grupo_id: 0 }))
  }

  const handleCicloChange = async (ciclo_id: number) => {
    setSelectedCiclo(ciclo_id)
    setFormData(prev => ({ ...prev, grupo_id: 0 }))
  }

  // Filtrar grupos según escuela y ciclo seleccionados
  const getGruposFiltrados = () => {
    let gruposFiltrados = grupos

    if (selectedEscuela > 0) {
      gruposFiltrados = gruposFiltrados.filter(g => g.escuela_id === selectedEscuela)
    }

    if (selectedCiclo > 0) {
      gruposFiltrados = gruposFiltrados.filter(g => g.ciclo_id === selectedCiclo)
    }

    return gruposFiltrados
  }

  // Cargar insumos cuando se selecciona laboratorio
  const loadInsumosByLaboratorio = async (laboratorio_id: number) => {
    try {
      console.log('🔍 Cargando insumos para laboratorio:', laboratorio_id)
      const result = await horarioService.getInsumosByLaboratorio(laboratorio_id)
      console.log('📦 Resultado de insumos:', result)
      
      if (result.success) {
        const insumos = result.data || []
        console.log('✅ Insumos cargados:', insumos.length)
        setInsumosDisponibles(insumos)
        
        // Si no hay insumos, mostrar mensaje informativo
        if (insumos.length === 0) {
          console.log('ℹ️ No hay insumos disponibles para este laboratorio')
        }
      } else {
        console.error('❌ Error al cargar insumos:', result.message)
        setInsumosDisponibles([])
        // No mostrar error, solo log - los insumos son opcionales
      }
    } catch (err) {
      console.error('❌ Excepción al cargar insumos:', err)
      setInsumosDisponibles([])
    }
  }

  const handleLaboratorioChange = async (laboratorio_id: number) => {
    setFormData(prev => ({ ...prev, laboratorio_id }))
    
    if (laboratorio_id > 0) {
      await loadInsumosByLaboratorio(laboratorio_id)
    } else {
      setInsumosDisponibles([])
    }
  }

  // Verificar disponibilidad de horario
  const verificarDisponibilidad = async () => {
    if (formData.laboratorio_id && formData.docente_id && formData.fecha_inicio && formData.fecha_fin) {
      try {
        // Convertir datetime-local a ISO string
        const fechaInicio = new Date(formData.fecha_inicio).toISOString()
        const fechaFin = new Date(formData.fecha_fin).toISOString()

        const result = await horarioService.verificarDisponibilidad({
          laboratorio_id: formData.laboratorio_id,
          docente_id: formData.docente_id,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
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
      }
    }
  }

  // Verificar disponibilidad cada vez que cambien las fechas o selecciones
  useEffect(() => {
    if (formData.laboratorio_id && formData.docente_id && formData.fecha_inicio && formData.fecha_fin) {
      const timer = setTimeout(() => {
        verificarDisponibilidad()
      }, 500) // Debounce de 500ms

      return () => clearTimeout(timer)
    }
  }, [formData.laboratorio_id, formData.docente_id, formData.fecha_inicio, formData.fecha_fin])

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

  // Submit del formulario
  const handleSubmit = async () => {
    if (conflictos.length > 0) {
      setError('No se puede crear el horario debido a conflictos de disponibilidad')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Convertir datetime-local a ISO string
      const fechaInicio = new Date(formData.fecha_inicio).toISOString()
      const fechaFin = new Date(formData.fecha_fin).toISOString()

      // Preparar datos finales - SOLO los campos que necesita el backend
      const finalData: CreateHorarioData = {
        laboratorio_id: formData.laboratorio_id,
        docente_id: formData.docente_id,
        grupo_id: formData.grupo_id,
        descripcion: formData.descripcion.trim(),
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        cantidad_alumnos: formData.cantidad_alumnos || 1, // Asegurar valor por defecto
        insumos: insumosSeleccionados.map(i => ({
          insumo_id: i.insumo_id,
          cantidad: i.cantidad
        }))
      }

      console.log('📤 Enviando datos al backend:', finalData)

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
      console.error('❌ Error al enviar horario:', err)
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

  const canSubmit = () => {
    return (
      formData.laboratorio_id > 0 &&
      formData.docente_id > 0 &&
      formData.grupo_id > 0 &&
      formData.descripcion.trim() &&
      formData.cantidad_alumnos && formData.cantidad_alumnos > 0 &&
      formData.fecha_inicio &&
      formData.fecha_fin &&
      conflictos.length === 0
    )
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Error general */}
            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}

            {/* Información básica */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Schedule />
                Información Básica
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Laboratorio */}
                <FormControl fullWidth>
                  <InputLabel>Laboratorio</InputLabel>
                  <Select
                    value={formData.laboratorio_id}
                    label="Laboratorio"
                    onChange={(e) => handleLaboratorioChange(e.target.value as number)}
                    disabled={loading}
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

                {/* Docente */}
                <FormControl fullWidth>
                  <InputLabel>Docente</InputLabel>
                  <Select
                    value={formData.docente_id}
                    label="Docente"
                    onChange={(e) => setFormData(prev => ({ ...prev, docente_id: e.target.value as number }))}
                    disabled={loading}
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

                {/* Fila de Escuela, Ciclo, Grupo */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl sx={{ flex: 1 }}>
                    <InputLabel>Escuela</InputLabel>
                    <Select
                      value={selectedEscuela}
                      label="Escuela"
                      onChange={(e) => handleEscuelaChange(e.target.value as number)}
                      disabled={loading}
                    >
                      <MenuItem value={0}>Todas las escuelas</MenuItem>
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

                  <FormControl sx={{ flex: 1 }}>
                    <InputLabel>Ciclo</InputLabel>
                    <Select
                      value={selectedCiclo}
                      label="Ciclo"
                      onChange={(e) => handleCicloChange(e.target.value as number)}
                      disabled={loading}
                    >
                      <MenuItem value={0}>Todos los ciclos</MenuItem>
                      {ciclos.map((ciclo) => (
                        <MenuItem key={ciclo.id} value={ciclo.id}>
                          {ciclo.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl sx={{ flex: 1 }}>
                    <InputLabel>Grupo</InputLabel>
                    <Select
                      value={formData.grupo_id}
                      label="Grupo"
                      onChange={(e) => setFormData(prev => ({ ...prev, grupo_id: e.target.value as number }))}
                      disabled={loading}
                    >
                      <MenuItem value={0} disabled>Seleccionar grupo</MenuItem>
                      {getGruposFiltrados().map((grupo) => (
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

                {/* Descripción */}
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Descripción de la actividad"
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Describe la actividad o clase que se realizará..."
                  disabled={loading}
                />

                {/* Cantidad de alumnos */}
                <TextField
                  type="number"
                  label="Cantidad de alumnos"
                  value={formData.cantidad_alumnos}
                  onChange={(e) => setFormData(prev => ({ ...prev, cantidad_alumnos: parseInt(e.target.value) || 1 }))}
                  disabled={loading}
                  inputProps={{ min: 1, max: 100 }}
                  helperText="Número estimado de estudiantes que participarán"
                />
              </Box>
            </Paper>

            {/* Fechas y horas */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Schedule />
                Fechas y Horas
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  type="datetime-local"
                  label="Fecha y hora de inicio"
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                  fullWidth
                  disabled={loading}
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  type="datetime-local"
                  label="Fecha y hora de fin"
                  value={formData.fecha_fin}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha_fin: e.target.value }))}
                  fullWidth
                  disabled={loading}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>

              {/* Verificación de disponibilidad */}
              {formData.fecha_inicio && formData.fecha_fin && formData.laboratorio_id && formData.docente_id && (
                <Box sx={{ mt: 2 }}>
                  {conflictos.length === 0 ? (
                    <Alert severity="success" icon={<CheckCircle />}>
                      ✅ El laboratorio y docente están disponibles en el horario seleccionado
                    </Alert>
                  ) : (
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
                </Box>
              )}
            </Paper>

            {/* Insumos (opcional) */}
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Inventory />
                  Insumos (Opcional)
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={() => setShowInsumos(!showInsumos)}
                  disabled={!formData.laboratorio_id}
                >
                  {showInsumos ? 'Ocultar' : 'Gestionar'} Insumos
                </Button>
              </Box>

              {showInsumos && (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {/* Insumos disponibles */}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Disponibles
                    </Typography>
                    <Paper sx={{ maxHeight: 200, overflow: 'auto', p: 1 }}>
                      {insumosDisponibles.length > 0 ? (
                        <List dense>
                          {insumosDisponibles.map((insumo) => {
                            const yaSeleccionado = insumosSeleccionados.some(i => i.insumo_id === insumo.id)
                            return (
                              <Box
                                key={insumo.id}
                                onClick={() => !yaSeleccionado && agregarInsumo(insumo)}
                                sx={{ 
                                  p: 1,
                                  cursor: yaSeleccionado ? 'not-allowed' : 'pointer',
                                  '&:hover': { bgcolor: yaSeleccionado ? 'none' : 'action.hover' },
                                  opacity: yaSeleccionado ? 0.5 : 1,
                                  borderRadius: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between'
                                }}
                              >
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {insumo.nombre}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Stock disponible: {insumo.stock_disponible || 0}
                                  </Typography>
                                </Box>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (!yaSeleccionado) agregarInsumo(insumo)
                                  }}
                                  disabled={yaSeleccionado}
                                >
                                  <Add />
                                </IconButton>
                              </Box>
                            )
                          })}
                        </List>
                      ) : (
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                          <Inventory sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            No hay insumos disponibles para este laboratorio
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Contacta al administrador para agregar insumos
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Box>

                  {/* Insumos seleccionados */}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Seleccionados ({insumosSeleccionados.length})
                    </Typography>
                    <Paper sx={{ maxHeight: 200, overflow: 'auto', p: 1 }}>
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
                              secondary="Los insumos son opcionales"
                            />
                          </ListItem>
                        )}
                      </List>
                    </Paper>
                  </Box>
                </Box>
              )}

              {/* Resumen de insumos seleccionados */}
              {insumosSeleccionados.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Insumos a utilizar:</strong>
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
                </Box>
              )}
            </Paper>
          </Box>
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
        
        <Button
          onClick={handleSubmit}
          disabled={loading || !canSubmit()}
          variant="contained"
          sx={{ borderRadius: 2, px: 3 }}
        >
          {loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            isEditing ? 'Actualizar Horario' : 'Crear Horario'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
} 