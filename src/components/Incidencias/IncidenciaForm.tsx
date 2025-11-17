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
  CalendarToday,
  FilterList,
  Clear,
  Search
} from '@mui/icons-material'
import { incidenciaService, type HorarioParaIncidencia } from '../../services/incidenciaService'
import { useApi } from '../../hooks/useApi'

interface IncidenciaFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export const IncidenciaForm: React.FC<IncidenciaFormProps> = ({ open, onClose, onSuccess }) => {
  const { execute } = useApi()
  const [horarios, setHorarios] = useState<HorarioParaIncidencia[]>([])
  const [filteredHorarios, setFilteredHorarios] = useState<HorarioParaIncidencia[]>([])
  const [selectedHorario, setSelectedHorario] = useState<number | ''>('')
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [filtroFecha, setFiltroFecha] = useState('')
  const [filtroLaboratorio, setFiltroLaboratorio] = useState('')
  const [filtroDocente, setFiltroDocente] = useState('')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  // Cargar horarios disponibles
  const loadHorarios = async () => {
    setLoading(true)
    setError(null)

    const response = await execute(() => incidenciaService.getHorariosDisponibles())
    if (response.error) {
      setError(response.error)
    } else if (response.data) {
      setHorarios(response.data.data)
      setFilteredHorarios(response.data.data)
    }
    setLoading(false)
  }

  // Efecto para cargar horarios cuando se abre el formulario
  useEffect(() => {
    if (open) {
      loadHorarios()
    }
  }, [open])

  // Efecto para aplicar filtros
  useEffect(() => {
    let filtered = horarios

    if (filtroFecha) {
      filtered = filtered.filter(h => h.fecha_clase.includes(filtroFecha))
    }
    if (filtroLaboratorio) {
      filtered = filtered.filter(h => h.laboratorio.toLowerCase().includes(filtroLaboratorio.toLowerCase()))
    }
    if (filtroDocente) {
      filtered = filtered.filter(h => h.docente.toLowerCase().includes(filtroDocente.toLowerCase()))
    }

    setFilteredHorarios(filtered)
  }, [horarios, filtroFecha, filtroLaboratorio, filtroDocente])

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setFiltroFecha('')
    setFiltroLaboratorio('')
    setFiltroDocente('')
    setFilteredHorarios(horarios)
  }

  // Función para limpiar el formulario
  const handleClose = () => {
    setSelectedHorario('')
    setTitulo('')
    setDescripcion('')
    setError(null)
    limpiarFiltros()
    setMostrarFiltros(false)
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
    if (titulo.trim().length < 30) {
      setError('El título debe tener al menos 30 caracteres')
      return false
    }
    if (descripcion.trim().length < 50) {
      setError('La descripción debe tener al menos 50 caracteres')
      return false
    }
    return true
  }

  // Función para enviar el formulario
  const handleSubmit = async () => {
    if (!validateForm()) return

    setSubmitting(true)
    setError(null)

    const incidenciaData = {
      reserva_id: selectedHorario as number,
      titulo: titulo.trim(),
      descripcion: descripcion.trim()
    }

    const response = await execute(() => incidenciaService.create(incidenciaData))

    if (response.error) {
      setError(response.error)
    } else if (response.data) {
      onSuccess()
      handleClose()
    }
    setSubmitting(false)
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Seleccionar Horario
            </Typography>
            {horarios.length > 10 && (
              <Button
                size="small"
                startIcon={<FilterList />}
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                variant="outlined"
              >
                {mostrarFiltros ? 'Ocultar Filtros' : 'Filtrar'}
              </Button>
            )}
          </Box>

          {/* Filtros */}
          {mostrarFiltros && (
            <Box sx={{
              p: 2,
              mb: 2,
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              backgroundColor: '#f5f5f5'
            }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Search fontSize="small" />
                Filtrar horarios ({filteredHorarios.length} de {horarios.length})
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                  size="small"
                  label="Fecha (DD/MM/YYYY)"
                  value={filtroFecha}
                  onChange={(e) => setFiltroFecha(e.target.value)}
                  placeholder="Ej.: 15/12/2024"
                  sx={{ minWidth: 150 }}
                />

                <TextField
                  size="small"
                  label="Laboratorio"
                  value={filtroLaboratorio}
                  onChange={(e) => setFiltroLaboratorio(e.target.value)}
                  placeholder="Nombre del laboratorio"
                  sx={{ minWidth: 150 }}
                />

                <TextField
                  size="small"
                  label="Docente"
                  value={filtroDocente}
                  onChange={(e) => setFiltroDocente(e.target.value)}
                  placeholder="Nombre del docente"
                  sx={{ minWidth: 150 }}
                />

                <Button
                  size="small"
                  startIcon={<Clear />}
                  onClick={limpiarFiltros}
                  variant="outlined"
                  color="secondary"
                >
                  Limpiar
                </Button>
              </Box>
            </Box>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress />
            </Box>
          ) : horarios.length === 0 ? (
            <Alert severity="info">
              No hay horarios disponibles para reportar incidencias.
              Solo se pueden reportar incidencias para clases que ya han terminado.
            </Alert>
          ) : filteredHorarios.length === 0 ? (
            <Alert severity="warning">
              No se encontraron horarios con los filtros aplicados.
              <Button size="small" onClick={limpiarFiltros} sx={{ ml: 1 }}>
                Limpiar filtros
              </Button>
            </Alert>
          ) : (
            <FormControl fullWidth size="small">
              <InputLabel>Seleccionar horario</InputLabel>
              <Select
                value={selectedHorario}
                label="Seleccionar horario"
                onChange={(e) => setSelectedHorario(e.target.value as number | '')}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300, // Limitar altura del dropdown
                    },
                  },
                }}
              >
                {filteredHorarios.slice(0, 50).map((horario) => ( // Mostrar máximo 50 resultados
                  <MenuItem key={horario.id} value={horario.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <Schedule fontSize="small" color="primary" />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {horario.fecha_clase}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {horario.laboratorio} - {horario.docente}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
                {filteredHorarios.length > 50 && (
                  <MenuItem disabled>
                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', width: '100%' }}>
                      ... y {filteredHorarios.length - 50} más. Usa los filtros para reducir resultados.
                    </Typography>
                  </MenuItem>
                )}
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
            placeholder="Ej.: Equipo de computación no funciona"
            helperText={
              titulo.length === 0
                ? "Describe brevemente el problema (mínimo 30 caracteres)"
                : titulo.trim().length < 30
                  ? `Faltan ${30 - titulo.trim().length} caracteres para alcanzar el mínimo (${titulo.trim().length}/30)`
                  : `${titulo.trim().length} caracteres ✓`
            }
            error={titulo.length > 0 && titulo.trim().length < 30}
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
            helperText={
              descripcion.length === 0
                ? "Proporciona todos los detalles relevantes (mínimo 50 caracteres)"
                : descripcion.trim().length < 50
                  ? `Faltan ${50 - descripcion.trim().length} caracteres para alcanzar el mínimo (${descripcion.trim().length}/50)`
                  : `${descripcion.trim().length} caracteres ✓`
            }
            error={descripcion.length > 0 && descripcion.trim().length < 50}
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