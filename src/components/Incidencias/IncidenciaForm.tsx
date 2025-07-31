import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  IconButton,
  Divider
} from '@mui/material'
import {
  Close,
  ReportProblem,
  Schedule,
  Person,
  LocationOn,
  Group,
  CalendarToday
} from '@mui/icons-material'
import { incidenciaService, type HorarioParaIncidencia } from '../../services/incidenciaService'

interface IncidenciaFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export const IncidenciaForm: React.FC<IncidenciaFormProps> = ({ open, onClose, onSuccess }) => {
  const [horarios, setHorarios] = useState<HorarioParaIncidencia[]>([])
  const [selectedHorario, setSelectedHorario] = useState<number | ''>('')
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar horarios disponibles
  const loadHorarios = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await incidenciaService.getHorariosDisponibles()
      if (response.success) {
        setHorarios(response.data)
      } else {
        setError(response.message || 'Error al cargar horarios')
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión')
      console.error('Error al cargar horarios:', err)
    } finally {
      setLoading(false)
    }
  }

  // Efecto para cargar horarios cuando se abre el formulario
  useEffect(() => {
    if (open) {
      loadHorarios()
    }
  }, [open])

  // Función para limpiar el formulario
  const handleClose = () => {
    setSelectedHorario('')
    setTitulo('')
    setDescripcion('')
    setError(null)
    onClose()
  }

  // Función para validar el formulario
  const validateForm = () => {
    if (!selectedHorario) {
      setError('Debes seleccionar un horario')
      return false
    }
    if (!titulo.trim()) {
      setError('El título es obligatorio')
      return false
    }
    if (!descripcion.trim()) {
      setError('La descripción es obligatoria')
      return false
    }
    if (titulo.trim().length < 5) {
      setError('El título debe tener al menos 5 caracteres')
      return false
    }
    if (descripcion.trim().length < 10) {
      setError('La descripción debe tener al menos 10 caracteres')
      return false
    }
    return true
  }

  // Función para enviar el formulario
  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      setSubmitting(true)
      setError(null)

      const incidenciaData = {
        reserva_id: selectedHorario as number,
        titulo: titulo.trim(),
        descripcion: descripcion.trim()
      }

      const response = await incidenciaService.create(incidenciaData)
      
      if (response.success) {
        onSuccess()
        handleClose()
      } else {
        setError(response.message || 'Error al crear incidencia')
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión')
      console.error('Error al crear incidencia:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // Obtener el horario seleccionado
  const selectedHorarioData = horarios.find(h => h.id === selectedHorario)

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReportProblem color="error" />
            Reportar Nueva Incidencia
          </Typography>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Selección de horario */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Seleccionar Horario
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress />
            </Box>
          ) : horarios.length === 0 ? (
            <Alert severity="info">
              No hay horarios disponibles para reportar incidencias. 
              Solo se pueden reportar incidencias para clases que ya han terminado.
            </Alert>
          ) : (
            <FormControl fullWidth size="small">
              <InputLabel>Seleccionar horario</InputLabel>
              <Select
                value={selectedHorario}
                label="Seleccionar horario"
                onChange={(e) => setSelectedHorario(e.target.value as number | '')}
              >
                {horarios.map((horario) => (
                  <MenuItem key={horario.id} value={horario.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Schedule fontSize="small" />
                      <Typography variant="body2">
                        {horario.fecha_clase} - {horario.laboratorio}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        {/* Información del horario seleccionado */}
        {selectedHorarioData && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Información del Horario Seleccionado
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarToday fontSize="small" color="action" />
                <Typography variant="body2">
                  <strong>Fecha:</strong> {selectedHorarioData.fecha_clase}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn fontSize="small" color="action" />
                <Typography variant="body2">
                  <strong>Laboratorio:</strong> {selectedHorarioData.laboratorio}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person fontSize="small" color="action" />
                <Typography variant="body2">
                  <strong>Docente:</strong> {selectedHorarioData.docente}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Group fontSize="small" color="action" />
                <Typography variant="body2">
                  <strong>Alumnos:</strong> {selectedHorarioData.cantidad_alumnos}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Formulario de incidencia */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Detalles de la Incidencia
          </Typography>
          
          <TextField
            label="Título de la incidencia"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            placeholder="Ej: Equipo de computación no funciona"
            helperText="Describe brevemente el problema"
            error={titulo.length > 0 && titulo.trim().length < 5}
          />
          
          <TextField
            label="Descripción detallada"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            fullWidth
            multiline
            rows={4}
            size="small"
            placeholder="Describe en detalle qué sucedió, qué equipos están afectados, etc."
            helperText="Proporciona todos los detalles relevantes para resolver el problema"
            error={descripcion.length > 0 && descripcion.trim().length < 10}
          />
        </Box>

        {/* Información adicional */}
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Importante:</strong> Las incidencias se reportan para clases que ya han terminado. 
            Esta información ayudará a mejorar el mantenimiento y la gestión de los laboratorios.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} variant="outlined">
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="error"
          disabled={submitting || !selectedHorario || !titulo.trim() || !descripcion.trim()}
          startIcon={submitting ? <CircularProgress size={16} /> : <ReportProblem />}
        >
          {submitting ? 'Creando...' : 'Reportar Incidencia'}
        </Button>
      </DialogActions>
    </Dialog>
  )
} 