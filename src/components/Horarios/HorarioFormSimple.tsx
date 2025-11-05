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
  Chip,
  Tooltip,
} from '@mui/material'
import {
  Close,
  Schedule,
  Person,
  LocationOn,
  School,
  Group,
  Inventory,
  Build,
  Add,
  Remove,
  Warning,
  CheckCircle,
  Delete,
} from '@mui/icons-material'
import { horarioService } from '../../services/horarioService'
import { laboratorioService } from '../../services/laboratorioService'
import { equipoService, type Equipo } from '../../services/equipoService'
import type { 
  Horario, 
  CreateHorarioData, 
  Ciclo, 
  Grupo, 
  Insumo,
  ConflictoHorario
} from '../../services/horarioService'
import type { Laboratorio } from '../../services/laboratorioService'
import { TIME_BLOCKS, getBlockLabel, combineDateWithTime } from '../../utils/timeBlocks'
import { insumoService, type InsumoSaldo } from '../../services/insumoService'
import { escuelaService, type Escuela } from '../../services/escuelaService'
import { docenteService, type Docente } from '../../services/docenteService'

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

interface EquipoSeleccionado {
  equipo_id: number
  nombre: string
  cantidad: number
  cantidad_disponible: number
}

// Paleta de colores disponibles
const COLOR_PALETTE = [
  { color: '#ff6b6b', name: 'Rojo' },
  { color: '#4ecdc4', name: 'Turquesa' },
  { color: '#ffa726', name: 'Naranja' },
  { color: '#ab47bc', name: 'Púrpura' },
  { color: '#26a69a', name: 'Verde' },
  { color: '#66bb6a', name: 'Verde Claro' },
  { color: '#42a5f5', name: 'Azul' },
  { color: '#ef5350', name: 'Rojo Claro' },
  { color: '#ffeb3b', name: 'Amarillo' },
  { color: '#95a5a6', name: 'Gris' }
]

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
    color: '#4ecdc4',
    insumos: []
  })
  
  // Estados para los selectores de bloques de tiempo
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [startBlockId, setStartBlockId] = useState<string>('')
  const [endBlockId, setEndBlockId] = useState<string>('')

  // Estados para opciones de formulario
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [escuelas, setEscuelas] = useState<Escuela[]>([])
  const [ciclos, setCiclos] = useState<Ciclo[]>([])
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [insumosDisponibles, setInsumosDisponibles] = useState<InsumoSaldo[]>([])
  const [insumosSeleccionados, setInsumosSeleccionados] = useState<InsumoSeleccionado[]>([])
  const [equiposDisponibles, setEquiposDisponibles] = useState<Equipo[]>([])
  const [equiposSeleccionados, setEquiposSeleccionados] = useState<EquipoSeleccionado[]>([])

  // Estados de selección en cascada
  const [selectedEscuela, setSelectedEscuela] = useState<number>(0)
  const [selectedCiclo, setSelectedCiclo] = useState<number>(0)

  // Estados de carga y errores
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflictos, setConflictos] = useState<ConflictoHorario[]>([])

  const [laboratorioChangeMessage, setLaboratorioChangeMessage] = useState<string | null>(null)

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
        docenteService.getAll(),
        escuelaService.getAll(),
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
    // Extraer fecha y hora de los datos del horario
    const fechaInicio = new Date(horarioData.fecha_inicio)
    const fechaFin = new Date(horarioData.fecha_fin)
    
    // Obtener la fecha (YYYY-MM-DD)
    const year = fechaInicio.getFullYear()
    const month = String(fechaInicio.getMonth() + 1).padStart(2, '0')
    const day = String(fechaInicio.getDate()).padStart(2, '0')
    const fecha = `${year}-${month}-${day}`
    
    // Obtener las horas
    const horaInicio = `${String(fechaInicio.getHours()).padStart(2, '0')}:${String(fechaInicio.getMinutes()).padStart(2, '0')}`
    const horaFin = `${String(fechaFin.getHours()).padStart(2, '0')}:${String(fechaFin.getMinutes()).padStart(2, '0')}`
    
    // Encontrar los bloques correspondientes
    const startBlock = TIME_BLOCKS.find(b => b.start === horaInicio)
    const endBlock = TIME_BLOCKS.find(b => b.end === horaFin)
    
    setSelectedDate(fecha)
    setStartBlockId(startBlock?.id || '')
    setEndBlockId(endBlock?.id || '')
    
    // Mantener las fechas completas en formData para compatibilidad
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
      color: horarioData.color || '#4ecdc4',
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

    // Cargar insumos y equipos del laboratorio si ya está seleccionado
    if (horarioData.laboratorio_id) {
      await Promise.all([
        loadInsumosByLaboratorio(horarioData.laboratorio_id),
        loadEquiposByLaboratorio(horarioData.laboratorio_id)
      ])
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
      color: '#4ecdc4',
      insumos: []
    })
    setSelectedDate('')
    setStartBlockId('')
    setEndBlockId('')
    setSelectedEscuela(0)
    setSelectedCiclo(0)
    setInsumosSeleccionados([])
    setEquiposSeleccionados([])
    setConflictos([])
    setError(null)

    setLaboratorioChangeMessage(null)
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
      
      // Mostrar loading en la sección de insumos
      setInsumosDisponibles([])
      
      const result = await insumoService.getWithStock(laboratorio_id)
      console.log('📦 Resultado de insumos:', result)
      
      if (result.data) {
        const insumos = result.data || []
        console.log('✅ Insumos cargados:', insumos.length)
        setInsumosDisponibles(insumos)
        
        // Si no hay insumos, mostrar mensaje informativo
        if (insumos.length === 0) {
          console.log('ℹ️ No hay insumos disponibles para este laboratorio')
        }
      } else {
        console.error('❌ Error al cargar insumos:', error)
        setInsumosDisponibles([])
        // No mostrar error, solo log - los insumos son opcionales
      }
    } catch (err) {
      console.error('❌ Excepción al cargar insumos:', err)
      setInsumosDisponibles([])
    }
  }

  // Cargar equipos cuando se selecciona laboratorio
  const loadEquiposByLaboratorio = async (laboratorio_id: number) => {
      
      const result = await equipoService.getByLaboratorio(laboratorio_id)
      if (result.success && result.data) {
        setEquiposDisponibles(result.data)
      } else {
        setError(result.message || 'Error al cargar equipos')
      }
  }

  const handleLaboratorioChange = async (laboratorio_id: number) => {
    const laboratorioAnterior = formData.laboratorio_id
    
    setFormData(prev => ({ ...prev, laboratorio_id }))
    
    // Limpiar insumos y equipos seleccionados cuando se cambia el laboratorio
    if (laboratorioAnterior > 0 && laboratorioAnterior !== laboratorio_id) {
      const insumosAnteriores = insumosSeleccionados.length
      const equiposAnteriores = equiposSeleccionados.length
      setInsumosSeleccionados([])
      setEquiposSeleccionados([])
      
      // Mostrar mensaje temporal si había insumos o equipos seleccionados
      if (insumosAnteriores > 0 || equiposAnteriores > 0) {
        setLaboratorioChangeMessage(`Se han limpiado ${insumosAnteriores} insumo(s) y ${equiposAnteriores} equipo(s) seleccionado(s) del laboratorio anterior`)
        setTimeout(() => setLaboratorioChangeMessage(null), 3000)
      }
    }
    
    if (laboratorio_id > 0) {
      await Promise.all([
        loadInsumosByLaboratorio(laboratorio_id),
        loadEquiposByLaboratorio(laboratorio_id)
      ])
    } else {
      setInsumosDisponibles([])
      setEquiposDisponibles([])
    }
  }

  // Verificar disponibilidad de horario
  const verificarDisponibilidad = async () => {
    if (formData.laboratorio_id && formData.docente_id && formData.fecha_inicio && formData.fecha_fin) {
      try {
        // Mantener las fechas en formato local sin conversión a UTC
        const fechaInicio = formData.fecha_inicio + ':00'
        const fechaFin = formData.fecha_fin + ':00'

        const result = await horarioService.verificarDisponibilidad({
          laboratorio_id: formData.laboratorio_id,
          docente_id: formData.docente_id,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          horario_id: horario?.id
        })
        
        if (result.disponible) {
          setConflictos([])
          setError(null)
        } else {
          // Convertir el resultado del backend al formato esperado por el frontend
          const conflicto: ConflictoHorario = {
            tipo: result.tipo_conflicto || 'laboratorio',
            mensaje: result.motivo || 'Conflicto de horario',
            detalles: (result as any).detalles,
            horario_conflicto: result.conflicto_detalle
          }
          setConflictos([conflicto])
          setError(result.motivo || 'Conflicto de horario')
        }
      } catch (err: any) {
        console.error('Error verificando disponibilidad:', err)
        setError(err.message || 'Error al verificar disponibilidad')
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
  }, [formData.laboratorio_id, formData.docente_id, formData.fecha_inicio, formData.fecha_fin, selectedDate, startBlockId, endBlockId])

  // Manejo de insumos
  const agregarInsumo = (insumo: Insumo) => {
    const yaSeleccionado = insumosSeleccionados.find(i => i.insumo_id === insumo.id)
    if (!yaSeleccionado && (insumo.stock_disponible || 0) > 0) {
      const nuevoInsumo: InsumoSeleccionado = {
        insumo_id: insumo.id,
        nombre: insumo.nombre,
        cantidad: 1,
        stock_disponible: insumo.stock_disponible || 0
      }
      setInsumosSeleccionados(prev => [...prev, nuevoInsumo])
    }
  }

  const eliminarInsumo = (insumo_id: number) => {
    setInsumosSeleccionados(prev => prev.filter(i => i.insumo_id !== insumo_id))
  }

  const actualizarCantidadInsumo = (insumo_id: number, cantidad: number) => {
    const insumo = insumosSeleccionados.find(i => i.insumo_id === insumo_id)
    if (!insumo) return

    // Validar límites
    if (cantidad <= 0) {
      eliminarInsumo(insumo_id)
    } else if (cantidad <= insumo.stock_disponible) {
      setInsumosSeleccionados(prev => 
        prev.map(i => i.insumo_id === insumo_id ? { ...i, cantidad } : i)
      )
    }
    // Si la cantidad excede el stock, no hacer nada
  }

  // Manejo de equipos
  const agregarEquipo = (equipo: Equipo) => {
    const yaSeleccionado = equiposSeleccionados.find(e => e.equipo_id === equipo.id)
    if (!yaSeleccionado) {
      const nuevoEquipo: EquipoSeleccionado = {
        equipo_id: equipo.id,
        nombre: equipo.nombre,
        cantidad: 1,
        cantidad_disponible: 1 // Valor fijo ya que los equipos no manejan cantidad
      }
      setEquiposSeleccionados(prev => [...prev, nuevoEquipo])
    }
  }

  const eliminarEquipo = (equipo_id: number) => {
    setEquiposSeleccionados(prev => prev.filter(e => e.equipo_id !== equipo_id))
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

      // Mantener las fechas en formato local sin conversión a UTC
      // Las fechas ya vienen con segundos desde combineDateWithTime
      const fechaInicio = formData.fecha_inicio
      const fechaFin = formData.fecha_fin

      // Preparar datos finales - SOLO los campos que necesita el backend
      const finalData: CreateHorarioData = {
        laboratorio_id: formData.laboratorio_id,
        docente_id: formData.docente_id,
        grupo_id: formData.grupo_id,
        descripcion: formData.descripcion.trim(),
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        cantidad_alumnos: formData.cantidad_alumnos || 1, // Asegurar valor por defecto
        color: formData.color || '#4ecdc4', // Incluir color seleccionado
        insumos: insumosSeleccionados.map(i => ({
          insumo_id: i.insumo_id,
          cantidad: i.cantidad
        })),
        equipos: equiposSeleccionados.map(e => ({
          equipo_id: e.equipo_id,
          cantidad: e.cantidad
        }))
      }

      console.log('📤 Enviando datos al backend:', finalData)
      console.log('🎨 Color seleccionado en formulario:', formData.color)

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
      
      // Mostrar información detallada del error
      let errorMessage = 'Error de conexión'
      
      if (err.response) {
        // Error de respuesta del servidor
        const status = err.response.status
        const data = err.response.data
        
        console.log('🚨 Error detallado:', {
          status,
          data,
          message: data?.message,
          url: err.config?.url
        })
        
        if (status === 400) {
          errorMessage = data?.message || 'Datos inválidos. Verifica que todos los campos sean correctos.'
        } else if (status === 401) {
          errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.'
        } else if (status === 403) {
          errorMessage = 'No tienes permisos para realizar esta acción.'
        } else if (status === 409) {
          errorMessage = data?.message || 'Conflicto de horario.'
        } else {
          errorMessage = data?.message || `Error del servidor (${status})`
        }
      } else if (err.request) {
        // Error de red
        errorMessage = 'Error de conexión. Verifica tu conexión a internet.'
      } else {
        // Otro tipo de error
        errorMessage = err.message || 'Error inesperado'
      }
      
      setError(errorMessage)
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
    const isValid = (
      formData.laboratorio_id > 0 &&
      formData.docente_id > 0 &&
      formData.grupo_id > 0 &&
      formData.descripcion.trim() &&
      formData.cantidad_alumnos && formData.cantidad_alumnos > 0 &&
      selectedDate &&
      startBlockId &&
      endBlockId &&
      formData.fecha_inicio &&
      formData.fecha_fin &&
      formData.color &&
      conflictos.length === 0
    )
    
    console.log('🔍 Validación formulario:', {
      laboratorio_id: formData.laboratorio_id > 0,
      docente_id: formData.docente_id > 0,
      grupo_id: formData.grupo_id > 0,
      descripcion: !!formData.descripcion.trim(),
      cantidad_alumnos: !!(formData.cantidad_alumnos && formData.cantidad_alumnos > 0),
      selectedDate: !!selectedDate,
      startBlockId: !!startBlockId,
      endBlockId: !!endBlockId,
      fecha_inicio: !!formData.fecha_inicio,
      fecha_fin: !!formData.fecha_fin,
      color: !!formData.color,
      conflictos: conflictos.length === 0,
      canSubmit: isValid
    })
    
    return isValid
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth={false}
      fullWidth
      PaperProps={{ 
        sx: { 
          borderRadius: { xs: 0, md: 1 },
          width: { xs: '100vw', md: '95vw' },
          maxWidth: '1600px',
          height: { xs: '100vh', md: '90vh' },
          maxHeight: { xs: '100vh', md: '90vh' },
          m: { xs: 0, md: 'auto' }
        } 
      }}
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

      <DialogContent sx={{ p: 0 }}>
        {loadingData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Cargando datos...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            height: { xs: 'calc(100vh - 140px)', md: 'calc(90vh - 140px)' }, 
            p: 2,
            flexDirection: { xs: 'column', lg: 'row' }
          }}>
            {/* Panel izquierdo - Formulario principal */}
            <Box sx={{ 
              flex: { xs: 1, lg: 2 }, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 2,
              overflowY: 'auto',
              pr: { xs: 0, lg: 1 }
            }}>
              {/* Error general */}
              {error && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

            {/* Información básica */}
            <Paper sx={{ 
              p: 3, 
              borderRadius: 1.5,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e8e8e8'
            }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
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
                      {[...ciclos]
                        .sort((a, b) => {
                          const numA = parseInt(a.nombre.replace(/[^\d]/g, '')) || 0;
                          const numB = parseInt(b.nombre.replace(/[^\d]/g, '')) || 0;
                          return numA - numB;
                        })
                        .map((ciclo) => (
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

                {/* Fila con cantidad de alumnos y color */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  type="number"
                  label="Cantidad de alumnos"
                  value={formData.cantidad_alumnos}
                  onChange={(e) => setFormData(prev => ({ ...prev, cantidad_alumnos: parseInt(e.target.value) || 1 }))}
                  disabled={loading}
                  inputProps={{ min: 1, max: 100 }}
                    helperText="Número estimado de estudiantes"
                    sx={{ flex: 1 }}
                  />
                  
                  {/* Selector de color */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="body2">
                        Color del horario
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                        ({formData.color})
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                      {COLOR_PALETTE.map((colorOption) => (
                        <Box
                          key={colorOption.color}
                          onClick={() => {
                            console.log('🎨 Color seleccionado:', colorOption.color)
                            console.log('🎨 FormData antes:', formData.color)
                            setFormData(prev => {
                              const newData = { ...prev, color: colorOption.color }
                              console.log('🎨 FormData después:', newData.color)
                              return newData
                            })
                          }}
                          sx={{
                            width: 36,
                            height: 36,
                            backgroundColor: colorOption.color,
                            borderRadius: 1,
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Color seleccionado:
                      </Typography>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          backgroundColor: formData.color,
                          borderRadius: 1,
                          border: '1px solid #ddd'
                        }}
                      />
                      <Typography variant="caption" sx={{ fontWeight: 500 }}>
                        {COLOR_PALETTE.find(c => c.color === formData.color)?.name || 'Personalizado'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Paper>

            {/* Fechas y horas */}
            <Paper sx={{ 
              p: 3, 
              borderRadius: 1.5,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e8e8e8'
            }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                <Schedule />
                Fecha y Horario Académico
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Selector de fecha */}
                <TextField
                  type="date"
                  label="Fecha de la clase"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value)
                    // Actualizar formData cuando cambian fecha y bloques
                    if (e.target.value && startBlockId && endBlockId) {
                      const startBlock = TIME_BLOCKS.find(b => b.id === startBlockId)
                      const endBlock = TIME_BLOCKS.find(b => b.id === endBlockId)
                      if (startBlock && endBlock) {
                        setFormData(prev => ({
                          ...prev,
                          fecha_inicio: combineDateWithTime(e.target.value, startBlock.start),
                          fecha_fin: combineDateWithTime(e.target.value, endBlock.end)
                        }))
                      }
                    }
                  }}
                  fullWidth
                  disabled={loading}
                  InputLabelProps={{ shrink: true }}
                  helperText="Selecciona el día en que se realizará la actividad"
                />
                
                {/* Selectores de bloques de tiempo */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Hora de inicio</InputLabel>
                    <Select
                      value={startBlockId}
                      label="Hora de inicio"
                      onChange={(e) => {
                        const blockId = e.target.value as string
                        setStartBlockId(blockId)
                        
                        // Si no hay bloque final seleccionado, poner el mismo
                        if (!endBlockId) {
                          setEndBlockId(blockId)
                        }
                        
                        // Actualizar formData
                        if (selectedDate && blockId) {
                          const startBlock = TIME_BLOCKS.find(b => b.id === blockId)
                          const endB = endBlockId ? TIME_BLOCKS.find(b => b.id === endBlockId) : startBlock
                          if (startBlock && endB) {
                            setFormData(prev => ({
                              ...prev,
                              fecha_inicio: combineDateWithTime(selectedDate, startBlock.start),
                              fecha_fin: combineDateWithTime(selectedDate, endB.end)
                            }))
                          }
                        }
                      }}
                      disabled={loading || !selectedDate}
                    >
                      {TIME_BLOCKS.map((block) => (
                        <MenuItem key={block.id} value={block.id}>
                          {getBlockLabel(block)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth>
                    <InputLabel>Hora de fin</InputLabel>
                    <Select
                      value={endBlockId}
                      label="Hora de fin"
                      onChange={(e) => {
                        const blockId = e.target.value as string
                        setEndBlockId(blockId)
                        
                        // Actualizar formData
                        if (selectedDate && startBlockId && blockId) {
                          const startBlock = TIME_BLOCKS.find(b => b.id === startBlockId)
                          const endBlock = TIME_BLOCKS.find(b => b.id === blockId)
                          if (startBlock && endBlock) {
                            setFormData(prev => ({
                              ...prev,
                              fecha_inicio: combineDateWithTime(selectedDate, startBlock.start),
                              fecha_fin: combineDateWithTime(selectedDate, endBlock.end)
                            }))
                          }
                        }
                      }}
                      disabled={loading || !selectedDate || !startBlockId}
                    >
                      {TIME_BLOCKS.map((block, index) => {
                        // Solo mostrar bloques desde el bloque de inicio en adelante
                        const startIndex = TIME_BLOCKS.findIndex(b => b.id === startBlockId)
                        const isDisabled = Boolean(startBlockId && index < startIndex)
                        
                        return (
                          <MenuItem 
                            key={block.id} 
                            value={block.id}
                            disabled={isDisabled}
                          >
                            {getBlockLabel(block)}
                          </MenuItem>
                        )
                      })}
                    </Select>
                  </FormControl>
                </Box>
                
                {/* Mostrar resumen del horario seleccionado */}
                {selectedDate && startBlockId && endBlockId && (
                  <Alert severity="info" icon={<Schedule />}>
                    <Typography variant="body2">
                      <strong>Horario seleccionado:</strong> {new Date(selectedDate).toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </Typography>
                    <Typography variant="body2">
                      {(() => {
                        const startBlock = TIME_BLOCKS.find(b => b.id === startBlockId)
                        const endBlock = TIME_BLOCKS.find(b => b.id === endBlockId)
                        const startIndex = TIME_BLOCKS.findIndex(b => b.id === startBlockId)
                        const endIndex = TIME_BLOCKS.findIndex(b => b.id === endBlockId)
                        const numBlocks = endIndex - startIndex + 1
                        
                        if (startBlock && endBlock) {
                          return `De ${startBlock.start} a ${endBlock.end} (${numBlocks} ${numBlocks === 1 ? 'hora académica' : 'horas académicas'})`
                        }
                        return ''
                      })()}
                    </Typography>
                  </Alert>
                )}
              </Box>

              {/* Verificación de disponibilidad */}
              {formData.fecha_inicio && formData.fecha_fin && formData.laboratorio_id && formData.docente_id && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Verificación de Disponibilidad
                    </Typography>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={verificarDisponibilidad}
                      disabled={!formData.laboratorio_id || !formData.docente_id || !formData.fecha_inicio || !formData.fecha_fin}
                    >
                      Verificar Ahora
                    </Button>
                  </Box>
                  
                  {conflictos.length === 0 ? (
                    <Alert severity="success" icon={<CheckCircle />}>
                      ✅ El laboratorio y docente están disponibles en el horario seleccionado
                    </Alert>
                  ) : (
                    <Alert 
                      severity="error" 
                      icon={<Warning />}
                      sx={{ 
                        borderRadius: 1.5,
                        border: '1px solid #f44336',
                        backgroundColor: '#fef2f2'
                      }}
                    >
                      <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
                        ⚠️ Conflicto de Horario Detectado
                      </Typography>
                      
                      {conflictos.map((conflicto, index) => (
                        <Box key={index} sx={{ mt: 2 }}>
                          {/* Tipo de conflicto */}
                          <Box sx={{ 
                            p: 2, 
                            backgroundColor: 'white', 
                            borderRadius: 1,
                            border: '1px solid #ffcdd2',
                            mb: 2
                          }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'error.main', mb: 1 }}>
                              {conflicto.tipo === 'laboratorio' ? '🏢 Laboratorio Ocupado' : '👨‍🏫 Docente Ocupado'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.primary' }}>
                              {conflicto.mensaje}
                            </Typography>
                          </Box>

                          {/* Detalles del conflicto */}
                          {conflicto.detalles && (
                            <Box sx={{ 
                              p: 2, 
                              backgroundColor: 'white', 
                              borderRadius: 1,
                              border: '1px solid #ffcdd2'
                            }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'error.main' }}>
                                📋 Detalles del Horario en Conflicto:
                              </Typography>
                              
                              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Laboratorio:
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {conflicto.detalles.laboratorio}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    📍 {conflicto.detalles.ubicacion}
                                  </Typography>
                                </Box>
                                
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Docente:
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {conflicto.detalles.docente}
                                  </Typography>
                                </Box>
                                
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Grupo:
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {conflicto.detalles.grupo}
                                  </Typography>
                                  {conflicto.detalles.escuela && (
                                    <Typography variant="caption" color="text.secondary">
                                      {conflicto.detalles.escuela} • {conflicto.detalles.ciclo}
                                    </Typography>
                                  )}
                                </Box>
                                
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Horario:
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {new Date(conflicto.detalles.fecha_inicio).toLocaleString('es-ES', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    hasta {new Date(conflicto.detalles.fecha_fin).toLocaleString('es-ES', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </Typography>
                                </Box>
                              </Box>
                              
                              {conflicto.detalles.descripcion && (
                                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid #ffcdd2' }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Actividad:
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                    {conflicto.detalles.descripcion}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          )}
                        </Box>
                      ))}
                      
                      <Box sx={{ mt: 2, p: 1.5, backgroundColor: '#fff3e0', borderRadius: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 500, color: 'warning.dark' }}>
                          💡 Sugerencia: Cambia la fecha/hora o selecciona otro laboratorio/docente
                        </Typography>
                      </Box>
                    </Alert>
                  )}
                </Box>
              )}
            </Paper>
            </Box>

            {/* Panel derecho - Gestión de Insumos */}
            <Box sx={{ 
              flex: { xs: 1, lg: 1 }, 
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              pl: { xs: 0, lg: 1 }
            }}>
              {/* Header del panel de insumos */}
              <Paper sx={{ 
                p: 2, 
                borderRadius: 1.5,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e8e8e8',
                backgroundColor: '#f8f9fa'
              }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'secondary.main' }}>
                  <Inventory />
                  Insumos (Opcional)
                </Typography>
              </Paper>

              {!formData.laboratorio_id ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Selecciona un laboratorio para ver los insumos disponibles
                </Alert>
              ) : (
                <>
                  {laboratorioChangeMessage && (
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>
                      {laboratorioChangeMessage}
                    </Alert>
                  )}

                  {/* Insumos disponibles */}
                  <Paper sx={{ 
                    flex: 1,
                    borderRadius: 1.5,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '1px solid #e8e8e8',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ p: 2, backgroundColor: '#f0f7ff', borderBottom: '1px solid #e0e0e0' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        Disponibles ({insumosDisponibles.length})
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
                      {insumosDisponibles.length > 0 ? (
                        <List dense>
                          {insumosDisponibles.map((insumo) => {
                            const yaSeleccionado = insumosSeleccionados.some(i => i.insumo_id === insumo.id)
                            const stockColor = (insumo.stock_disponible || 0) === 0 ? 'error' : 
                                             (insumo.stock_disponible || 0) < 10 ? 'warning' : 'success'
                            return (
                              <Box
                                key={insumo.id}
                                onClick={() => !yaSeleccionado && agregarInsumo(insumo)}
                                sx={{ 
                                  p: 1.5,
                                  cursor: yaSeleccionado ? 'not-allowed' : 'pointer',
                                  '&:hover': { 
                                    bgcolor: yaSeleccionado ? 'none' : 'primary.light',
                                    transform: yaSeleccionado ? 'none' : 'translateY(-1px)',
                                    boxShadow: yaSeleccionado ? 'none' : '0 4px 12px rgba(0,0,0,0.15)'
                                  },
                                  opacity: yaSeleccionado ? 0.5 : 1,
                                  borderRadius: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  border: yaSeleccionado ? '1px solid #e0e0e0' : '1px solid #f0f0f0',
                                  mb: 1,
                                  backgroundColor: yaSeleccionado ? '#f5f5f5' : 'white',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {insumo.nombre}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                      Stock:
                                    </Typography>
                                    <Chip 
                                      label={insumo.stock_disponible || 0} 
                                      size="small" 
                                      color={stockColor}
                                      variant="outlined"
                                    />
                                  </Box>
                                </Box>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (!yaSeleccionado) agregarInsumo(insumo)
                                  }}
                                  disabled={yaSeleccionado}
                                  color="primary"
                                >
                                  <Add />
                                </IconButton>
                              </Box>
                            )
                          })}
                        </List>
                      ) : (
                        <Box sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <Inventory sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            No hay insumos disponibles
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Contacta al administrador
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>

                  {/* Insumos seleccionados */}
                  <Paper sx={{ 
                    flex: 1,
                    borderRadius: 1.5,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '1px solid #e8e8e8',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ p: 2, backgroundColor: '#f0fff4', borderBottom: '1px solid #e0e0e0' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'success.main' }}>
                        Seleccionados ({insumosSeleccionados.length})
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
                      <List dense>
                        {insumosSeleccionados.map((insumo) => {
                          const stockRestante = insumo.stock_disponible - insumo.cantidad
                          const stockColor = stockRestante === 0 ? 'error' : 
                                           stockRestante < 5 ? 'warning' : 'success'
                          return (
                            <ListItem key={insumo.insumo_id}>
                              <ListItemText
                                primary={insumo.nombre}
                                secondary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                      Restante:
                                    </Typography>
                                    <Chip 
                                      label={stockRestante} 
                                      size="small" 
                                      color={stockColor}
                                      variant="outlined"
                                    />
                                  </Box>
                                }
                              />
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Tooltip title="Eliminar insumo">
                                  <IconButton
                                    size="small"
                                    onClick={() => eliminarInsumo(insumo.insumo_id)}
                                    color="error"
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                                  <IconButton
                                    size="small"
                                    onClick={() => actualizarCantidadInsumo(insumo.insumo_id, insumo.cantidad - 1)}
                                    color="error"
                                  >
                                    <Remove />
                                  </IconButton>
                                  <Typography variant="body2" sx={{ minWidth: 30, textAlign: 'center', fontWeight: 500 }}>
                                    {insumo.cantidad}
                                  </Typography>
                                  <IconButton
                                    size="small"
                                    onClick={() => actualizarCantidadInsumo(insumo.insumo_id, insumo.cantidad + 1)}
                                    disabled={insumo.cantidad >= insumo.stock_disponible}
                                    color="primary"
                                  >
                                    <Add />
                                  </IconButton>
                                </Box>
                              </Box>
                            </ListItem>
                          )
                        })}
                        {insumosSeleccionados.length === 0 && (
                          <ListItem>
                            <ListItemText 
                              primary="Sin insumos seleccionados"
                              secondary="Haz clic arriba para agregar"
                            />
                          </ListItem>
                        )}
                      </List>
                    </Box>
                  </Paper>

                  {/* Resumen compacto */}
                  {insumosSeleccionados.length > 0 && (
                    <Paper sx={{ 
                      p: 2, 
                      borderRadius: 1.5,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      border: '1px solid #e8e8e8',
                      backgroundColor: '#fff8e1'
                    }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'warning.main', mb: 1 }}>
                        Resumen de Insumos
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {insumosSeleccionados.map((insumo) => (
                          <Chip
                            key={insumo.insumo_id}
                            label={`${insumo.nombre} (${insumo.cantidad})`}
                            variant="outlined"
                            size="small"
                            sx={{ borderRadius: 1 }}
                          />
                        ))}
                      </Box>
                    </Paper>
                  )}
                </>
              )}
            </Box>

            {/* Panel derecho - Gestión de Equipos */}
            <Box sx={{ 
              flex: { xs: 1, lg: 1 }, 
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              minHeight: 0,
            }}>
              {/* Título de la sección */}
              <Paper sx={{ 
                p: 2, 
                borderRadius: 1.5,
                background: 'linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%)',
                border: '1px solid #e0e0e0'
              }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'secondary.main' }}>
                  <Build />
                  Equipos (Opcional)
                </Typography>
              </Paper>

              {/* Contenido de equipos */}
              {formData.laboratorio_id > 0 ? (
                <>
                  {/* Mensaje de cambio de laboratorio */}
                  {laboratorioChangeMessage && (
                    <Alert severity="warning" sx={{ borderRadius: 1.5 }}>
                      {laboratorioChangeMessage}
                    </Alert>
                  )}

                  {/* Equipos disponibles */}
                  <Paper sx={{ 
                    flex: 1,
                    borderRadius: 1.5,
                    border: '1px solid #e0e0e0',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 250,
                    maxHeight: 300
                  }}>
                    <Box sx={{ p: 2, backgroundColor: '#f0f7ff', borderBottom: '1px solid #e0e0e0' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        Disponibles ({equiposDisponibles.length})
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
                      {equiposDisponibles.length > 0 ? (
                        <List dense>
                          {equiposDisponibles.map((equipo) => {
                            const yaSeleccionado = equiposSeleccionados.some(e => e.equipo_id === equipo.id)
                            return (
                              <ListItem
                                key={equipo.id}
                                sx={{
                                  border: '1px solid #f0f0f0',
                                  borderRadius: 1,
                                  mb: 1,
                                  backgroundColor: yaSeleccionado ? '#e8f5e8' : 'transparent',
                                  '&:hover': {
                                    backgroundColor: yaSeleccionado ? '#e8f5e8' : '#f5f5f5'
                                  }
                                }}
                              >
                                <ListItemText
                                  primary={
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {equipo.nombre}
                                    </Typography>
                                  }
                                  secondary={
                                    <Typography variant="caption" color="text.secondary">
                                      {equipo.marca} {equipo.modelo} - {equipo.codigo}
                                    </Typography>
                                  }
                                />
                                <IconButton
                                  size="small"
                                  onClick={() => agregarEquipo(equipo)}
                                  disabled={yaSeleccionado}
                                  color="primary"
                                  sx={{ ml: 1 }}
                                >
                                  <Add />
                                </IconButton>
                              </ListItem>
                            )
                          })}
                        </List>
                      ) : (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                          <Build sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            No hay equipos disponibles en este laboratorio
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>

                  {/* Equipos seleccionados */}
                  <Paper sx={{ 
                    flex: 1,
                    borderRadius: 1.5,
                    border: '1px solid #e0e0e0',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 200,
                    maxHeight: 250
                  }}>
                    <Box sx={{ p: 2, backgroundColor: '#f0fff4', borderBottom: '1px solid #e0e0e0' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'success.main' }}>
                        Seleccionados ({equiposSeleccionados.length})
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
                      <List dense>
                        {equiposSeleccionados.map((equipo) => {
                          return (
                            <ListItem
                              key={equipo.equipo_id}
                              sx={{
                                border: '1px solid #e8f5e8',
                                borderRadius: 1,
                                mb: 1,
                                backgroundColor: '#f9fff9',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              <ListItemText
                                primary={
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {equipo.nombre}
                                  </Typography>
                                }
                                secondary={
                                  <Typography variant="caption" color="text.secondary">
                                    Equipo reservado
                                  </Typography>
                                }
                              />
                              <Tooltip title="Eliminar equipo">
                                <IconButton
                                  size="small"
                                  onClick={() => eliminarEquipo(equipo.equipo_id)}
                                  color="error"
                                  sx={{ ml: 1 }}
                                >
                                  <Delete />
                                </IconButton>
                              </Tooltip>
                            </ListItem>
                          )
                        })}
                        {equiposSeleccionados.length === 0 && (
                          <ListItem>
                            <ListItemText 
                              primary="Sin equipos seleccionados"
                              secondary="Los equipos seleccionados aparecerán aquí"
                              sx={{ textAlign: 'center', color: 'text.secondary' }}
                            />
                          </ListItem>
                        )}
                      </List>
                    </Box>
                  </Paper>

                  {/* Resumen compacto */}
                  {equiposSeleccionados.length > 0 && (
                    <Paper sx={{ 
                      p: 2, 
                      borderRadius: 1.5,
                      border: '1px solid #e0e0e0',
                      backgroundColor: '#fff8e1'
                    }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'warning.main', mb: 1 }}>
                        Resumen de Equipos
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {equiposSeleccionados.map((equipo) => (
                          <Chip
                            key={equipo.equipo_id}
                            label={`${equipo.nombre} (${equipo.cantidad})`}
                            variant="outlined"
                            size="small"
                            sx={{ borderRadius: 1 }}
                          />
                        ))}
                      </Box>
                    </Paper>
                  )}
                </>
              ) : (
                <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 1.5, border: '1px solid #e0e0e0' }}>
                  <Build sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    Selecciona un laboratorio
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Los equipos disponibles se mostrarán aquí
                  </Typography>
                </Paper>
              )}
            </Box>
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