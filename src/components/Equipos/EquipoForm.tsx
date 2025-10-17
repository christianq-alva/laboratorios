import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper
} from '@mui/material'
import { Close, Build } from '@mui/icons-material'
import { equipoService, type Equipo } from '../../services/equipoService'
import { tipoEquipoService, type TipoEquipo } from '../../services/tipoEquipoService'

interface EquipoFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  equipo?: Equipo | null
}

export const EquipoForm: React.FC<EquipoFormProps> = ({ open, onClose, onSuccess, equipo }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    marca: '',
    modelo: '',
    numero_serie: '',
    estado: 'Operativo' as 'Operativo' | 'En Mantenimiento' | 'Fuera de Servicio',
    fecha_ultimo_mantenimiento: '',
    fecha_proximo_mantenimiento: '',
    comentarios: '',
    condicion: 'Bueno' as 'Excelente' | 'Bueno' | 'Regular' | 'Malo',
    fecha_adquisicion: '',
    tipo_equipo_id: 0
  })
  
  const [tiposEquipo, setTiposEquipo] = useState<TipoEquipo[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = Boolean(equipo)

  // Cargar datos iniciales
  useEffect(() => {
    if (open) {
      loadInitialData()
      if (equipo) {
        loadEquipoData(equipo)
      } else {
        resetForm()
      }
    }
  }, [open, equipo])

  const loadInitialData = async () => {
    try {
      setLoadingData(true)
      const tiposResult = await tipoEquipoService.getActivos()
      if (tiposResult.success) {
        setTiposEquipo(tiposResult.data || [])
      }
    } catch (err) {
      console.error('Error loading initial data:', err)
      setError('Error al cargar tipos de equipo')
    } finally {
      setLoadingData(false)
    }
  }

  const loadEquipoData = (equipoData: Equipo) => {
    // Función para formatear fechas al formato YYYY-MM-DD requerido por input[type="date"]
    const formatDateForInput = (date: string | undefined) => {
      if (!date) return ''
      try {
        return new Date(date).toISOString().split('T')[0]
      } catch (error) {
        console.warn('Error al formatear fecha:', date, error)
        return ''
      }
    }

    setFormData({
      nombre: equipoData.nombre,
      descripcion: equipoData.descripcion || '',
      marca: equipoData.marca || '',
      modelo: equipoData.modelo || '',
      numero_serie: equipoData.numero_serie || '',
      estado: equipoData.estado,
      fecha_ultimo_mantenimiento: formatDateForInput(equipoData.fecha_ultimo_mantenimiento),
      fecha_proximo_mantenimiento: formatDateForInput(equipoData.fecha_proximo_mantenimiento),
      comentarios: equipoData.comentarios || '',
      condicion: equipoData.condicion || 'Bueno',
      fecha_adquisicion: formatDateForInput(equipoData.fecha_adquisicion),
      tipo_equipo_id: equipoData.tipo_equipo_id || 0
    })
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      marca: '',
      modelo: '',
      numero_serie: '',
      estado: 'Operativo',
      fecha_ultimo_mantenimiento: '',
      fecha_proximo_mantenimiento: '',
      comentarios: '',
      condicion: 'Bueno',
      fecha_adquisicion: '',
      tipo_equipo_id: 0
    })
    setError(null)
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)

      // Validaciones
      if (!formData.nombre.trim()) {
        setError('El nombre es requerido')
        return
      }

      // Preparar datos
      const equipoData = {
        ...formData,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        marca: formData.marca.trim(),
        modelo: formData.modelo.trim(),
        numero_serie: formData.numero_serie.trim(),
        comentarios: formData.comentarios.trim(),
        fecha_adquisicion: formData.fecha_adquisicion && formData.fecha_adquisicion.trim() ? formData.fecha_adquisicion : null,
        tipo_equipo_id: formData.tipo_equipo_id > 0 ? formData.tipo_equipo_id : null
      }

      let result
      if (isEditing && equipo) {
        result = await equipoService.update(equipo.id, equipoData)
      } else {
        result = await equipoService.create(equipoData)
      }

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.message || 'Error al guardar el equipo')
      }
    } catch (err: any) {
      console.error('Error al enviar equipo:', err)
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
          <Typography variant="h6" component="div" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Build color="primary" />
            {isEditing ? 'Editar Equipo' : 'Nuevo Equipo'}
          </Typography>
          <IconButton onClick={handleClose} disabled={loading} sx={{ color: 'grey.500' }}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {loadingData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Cargando datos...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {/* Información básica del equipo */}
            <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                Información del Equipo
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {isEditing && equipo?.codigo && (
                  <TextField
                    fullWidth
                    label="Código de Activo"
                    value={equipo.codigo}
                    disabled
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1, color: 'primary.main', fontWeight: 600 }}>
                          EQP-
                        </Box>
                      )
                    }}
                    sx={{
                      '& .MuiInputBase-input': {
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        color: 'primary.main'
                      }
                    }}
                  />
                )}
                
                <TextField
                  fullWidth
                  label="Nombre del equipo"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Microscopio Óptico, Balanza Analítica..."
                  disabled={loading}
                  required
                />

                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Descripción"
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Descripción detallada del equipo..."
                  disabled={loading}
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Marca"
                    value={formData.marca}
                    onChange={(e) => setFormData(prev => ({ ...prev, marca: e.target.value }))}
                    placeholder="Ej: Olympus, Mettler Toledo..."
                    disabled={loading}
                  />

                  <TextField
                    fullWidth
                    label="Modelo"
                    value={formData.modelo}
                    onChange={(e) => setFormData(prev => ({ ...prev, modelo: e.target.value }))}
                    placeholder="Ej: CX23, ML204..."
                    disabled={loading}
                  />
                </Box>

                <TextField
                  fullWidth
                  label="Número de serie"
                  value={formData.numero_serie}
                  onChange={(e) => setFormData(prev => ({ ...prev, numero_serie: e.target.value }))}
                  placeholder="Número de serie único"
                  disabled={loading}
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth required>
                    <InputLabel>Tipo de Equipo</InputLabel>
                    <Select
                      value={formData.tipo_equipo_id}
                      label="Tipo de Equipo"
                      onChange={(e) => setFormData(prev => ({ ...prev, tipo_equipo_id: e.target.value as number }))}
                      disabled={loading}
                    >
                      <MenuItem value={0} disabled>Seleccionar tipo</MenuItem>
                      {tiposEquipo.map((tipo) => (
                        <MenuItem key={tipo.id} value={tipo.id}>
                          {tipo.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Estado</InputLabel>
                    <Select
                      value={formData.estado}
                      label="Estado"
                      onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value as any }))}
                      disabled={loading}
                    >
                      <MenuItem value="Operativo">Operativo</MenuItem>
                      <MenuItem value="En Mantenimiento">En Mantenimiento</MenuItem>
                      <MenuItem value="Fuera de Servicio">Fuera de Servicio</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha último mantenimiento"
                    value={formData.fecha_ultimo_mantenimiento}
                    onChange={(e) => setFormData(prev => ({ ...prev, fecha_ultimo_mantenimiento: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    disabled={loading}
                  />

                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha próximo mantenimiento"
                    value={formData.fecha_proximo_mantenimiento}
                    onChange={(e) => setFormData(prev => ({ ...prev, fecha_proximo_mantenimiento: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    disabled={loading}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Condición</InputLabel>
                    <Select
                      value={formData.condicion}
                      label="Condición"
                      onChange={(e) => setFormData(prev => ({ ...prev, condicion: e.target.value as any }))}
                      disabled={loading}
                    >
                      <MenuItem value="Excelente">Excelente</MenuItem>
                      <MenuItem value="Bueno">Bueno</MenuItem>
                      <MenuItem value="Regular">Regular</MenuItem>
                      <MenuItem value="Malo">Malo</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha de adquisición"
                    value={formData.fecha_adquisicion}
                    onChange={(e) => setFormData(prev => ({ ...prev, fecha_adquisicion: e.target.value }))}
                    disabled={loading}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Comentarios"
                  value={formData.comentarios}
                  onChange={(e) => setFormData(prev => ({ ...prev, comentarios: e.target.value }))}
                  placeholder="Comentarios adicionales sobre el equipo..."
                  disabled={loading}
                />
              </Box>
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
          disabled={loading || !formData.nombre.trim()}
          variant="contained"
          sx={{ borderRadius: 2, px: 3 }}
        >
          {loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            isEditing ? 'Actualizar Equipo' : 'Crear Equipo'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
