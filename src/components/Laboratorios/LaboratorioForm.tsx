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
} from '@mui/material'
import { Close } from '@mui/icons-material'
import { laboratorioService } from '../../services/laboratorioService'
import type { Laboratorio, CreateLaboratorioData, Escuela } from '../../services/laboratorioService'

interface LaboratorioFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  laboratorio?: Laboratorio | null
}

export const LaboratorioForm: React.FC<LaboratorioFormProps> = ({ open, onClose, onSuccess, laboratorio }) => {
  // Estado del formulario incluyendo piso
  const [formData, setFormData] = useState<CreateLaboratorioData>({
    nombre: '',
    ubicacion: '',
    escuela_id: 0,
    piso: ''
  })
  
  const [escuelas, setEscuelas] = useState<Escuela[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingEscuelas, setLoadingEscuelas] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const isEditing = Boolean(laboratorio)

  // Función para obtener escuelas
  const fetchEscuelas = async () => {
    try {
      setLoadingEscuelas(true)
      const result = await laboratorioService.getEscuelas()
      if (result.success) {
        setEscuelas(result.data || [])
      } else {
        console.error('Error al cargar escuelas:', result.message)
        setEscuelas([])
      }
    } catch (err) {
      console.error('Error al cargar escuelas:', err)
      setEscuelas([])
    } finally {
      setLoadingEscuelas(false)
    }
  }

  // Effect para cargar datos cuando se abre el modal
  useEffect(() => {
    if (open) {
      fetchEscuelas()
      
      if (laboratorio) {
        // Modo edición - cargar datos del laboratorio incluyendo piso
        setFormData({
          nombre: laboratorio.nombre,
          ubicacion: laboratorio.ubicacion,
          escuela_id: laboratorio.escuela_id,
          piso: laboratorio.piso
        })
      } else {
        // Modo creación - resetear formulario
        setFormData({
          nombre: '',
          ubicacion: '',
          escuela_id: 0,
          piso: ''
        })
      }
      
      setError(null)
    }
  }, [laboratorio, open])

  // Manejar cambios en campos de texto
  const handleChange = (field: keyof CreateLaboratorioData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'escuela_id' ? parseInt(event.target.value) || 0 : event.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Manejar cambios en select
  const handleSelectChange = (event: any) => {
    setFormData(prev => ({ ...prev, escuela_id: event.target.value }))
  }

  // Submit del formulario
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validaciones
      if (!formData.nombre.trim()) {
        throw new Error('El nombre es requerido')
      }
      if (!formData.ubicacion.trim()) {
        throw new Error('La ubicación es requerida')
      }
      if (!formData.piso.trim()) {
        throw new Error('El piso es requerido')
      }
      if (formData.escuela_id <= 0) {
        throw new Error('Debe seleccionar una escuela')
      }

      let result
      if (isEditing && laboratorio) {
        result = await laboratorioService.update(laboratorio.id, formData)
      } else {
        result = await laboratorioService.create(formData)
      }

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.message || 'Error al guardar el laboratorio')
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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {isEditing ? 'Editar Laboratorio' : 'Nuevo Laboratorio'}
          </Typography>
          <IconButton onClick={handleClose} disabled={loading} sx={{ color: 'grey.500' }}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Nombre del Laboratorio"
            value={formData.nombre}
            onChange={handleChange('nombre')}
            required
            disabled={loading}
            sx={{ mb: 2 }}
            placeholder="Ej: Laboratorio de Cómputo 1"
          />

          <TextField
            fullWidth
            label="Ubicación"
            value={formData.ubicacion}
            onChange={handleChange('ubicacion')}
            required
            disabled={loading}
            sx={{ mb: 2 }}
            placeholder="Ej: Edificio A - Aula 201"
          />

          <TextField
            fullWidth
            label="Piso"
            value={formData.piso}
            onChange={handleChange('piso')}
            required
            disabled={loading}
            sx={{ mb: 2 }}
            placeholder="Ej: Primer piso, Segundo piso, Planta baja"
          />

          <FormControl fullWidth sx={{ mb: 1 }}>
            <InputLabel>Escuela</InputLabel>
            <Select
              value={formData.escuela_id}
              label="Escuela"
              onChange={handleSelectChange}
              required
              disabled={loading || loadingEscuelas}
            >
              <MenuItem value={0} disabled>
                {loadingEscuelas ? 'Cargando escuelas...' : 'Seleccionar escuela'}
              </MenuItem>
              {escuelas.map((escuela) => (
                <MenuItem key={escuela.id} value={escuela.id}>
                  {escuela.nombre}
                </MenuItem>
              ))}
            </Select>
            {escuelas.length === 0 && !loadingEscuelas && (
              <Box sx={{ mt: 1 }}>
                <Alert severity="warning" sx={{ fontSize: '0.875rem' }}>
                  No se encontraron escuelas disponibles. Verifica que existan escuelas en la base de datos.
                </Alert>
              </Box>
            )}
          </FormControl>
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
            type="submit"
            disabled={loading}
            variant="contained"
            sx={{ borderRadius: 2, px: 3 }}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              isEditing ? 'Actualizar' : 'Crear Laboratorio'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
} 