import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  IconButton,
  Alert
} from '@mui/material'
import { Close, Category } from '@mui/icons-material'
import { tipoEquipoService, type TipoEquipo } from '../../../services/tipoEquipoService'

interface TipoEquipoFormProps {
  open: boolean
  onClose: () => void
  onSuccess: (message?: string) => void
  tipoEquipo?: TipoEquipo | null
}

export const TipoEquipoForm: React.FC<TipoEquipoFormProps> = ({
  open,
  onClose,
  onSuccess,
  tipoEquipo
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Resetear formulario cuando se abre/cierra
  useEffect(() => {
    if (open) {
      if (tipoEquipo) {
        setFormData({
          nombre: tipoEquipo.nombre,
          descripcion: tipoEquipo.descripcion || ''
        })
      } else {
        setFormData({
          nombre: '',
          descripcion: ''
        })
      }
      setError(null)
    }
  }, [open, tipoEquipo])

  // Manejar cambios en el formulario
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Validar formulario
  const validateForm = () => {
    if (!formData.nombre.trim()) {
      setError('El nombre es obligatorio')
      return false
    }
    if (formData.nombre.length > 100) {
      setError('El nombre no puede exceder 100 caracteres')
      return false
    }
    if (formData.descripcion && formData.descripcion.length > 255) {
      setError('La descripción no puede exceder 255 caracteres')
      return false
    }
    return true
  }

  // Enviar formulario
  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    setError(null)

    const data = {
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim() || undefined
    }

    let result
    if (tipoEquipo) {
      // Editar
      result = await tipoEquipoService.update(tipoEquipo.id, data)
    } else {
      // Crear
      result = await tipoEquipoService.create(data)
    }

    if (result.success) {
      onSuccess(result.message)
      onClose()
    } else {
      setError(result.message || 'Error al guardar tipo de equipo')
    }
    
    setLoading(false)
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        bgcolor: 'primary.main',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Category />
          {tipoEquipo ? 'Editar Tipo de Equipo' : 'Nuevo Tipo de Equipo'}
        </Box>
        <IconButton 
          onClick={onClose} 
          size="small"
          sx={{ color: 'white' }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Nombre */}
          <TextField
            label="Nombre"
            value={formData.nombre}
            onChange={(e) => handleInputChange('nombre', e.target.value)}
            fullWidth
            required
            helperText="Ejemplo: Monitor, Microscopio, Centrífuga"
            inputProps={{ maxLength: 100 }}
          />

          {/* Descripción */}
          <TextField
            label="Descripción"
            value={formData.descripcion}
            onChange={(e) => handleInputChange('descripcion', e.target.value)}
            fullWidth
            multiline
            rows={3}
            helperText="Descripción breve del tipo de equipo"
            inputProps={{ maxLength: 255 }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Guardando...' : tipoEquipo ? 'Actualizar' : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

