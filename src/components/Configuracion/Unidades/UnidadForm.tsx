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
  Alert,
  CircularProgress
} from '@mui/material'
import { Close, Straighten } from '@mui/icons-material'
import { unidadService, type Unidad } from '../../../services/unidadService'
import { useApi } from '../../../hooks/useApi'

interface UnidadFormProps {
  open: boolean
  onClose: () => void
  onSuccess: (message?: string) => void
  unidad?: Unidad | null
}

export const UnidadForm: React.FC<UnidadFormProps> = ({
  open,
  onClose,
  onSuccess,
  unidad
}) => {
  const { execute } = useApi()
  const [formData, setFormData] = useState({
    simbolo: '',
    nombre: '',
    descripcion: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Resetear formulario cuando se abre/cierra
  useEffect(() => {
    if (open) {
      if (unidad) {
        setFormData({
          simbolo: unidad.simbolo,
          nombre: unidad.nombre,
          descripcion: unidad.descripcion || ''
        })
      } else {
        setFormData({
          simbolo: '',
          nombre: '',
          descripcion: ''
        })
      }
      setError(null)
    }
  }, [open, unidad])

  // Manejar cambios en el formulario
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Validar formulario
  const validateForm = () => {
    if (!formData.simbolo.trim()) {
      setError('El símbolo es obligatorio')
      return false
    }
    if (formData.simbolo.length > 10) {
      setError('El símbolo no puede exceder 10 caracteres')
      return false
    }
    if (!formData.nombre.trim()) {
      setError('El nombre es obligatorio')
      return false
    }
    if (formData.nombre.length > 120) {
      setError('El nombre no puede exceder 120 caracteres')
      return false
    }
    if (formData.descripcion && formData.descripcion.length > 250) {
      setError('La descripción no puede exceder 250 caracteres')
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
      simbolo: formData.simbolo.trim(),
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim() || undefined
    }

    let result
    if (unidad) {
      // Editar
      result = await execute(() => unidadService.update(unidad.id, data))
    } else {
      // Crear
      result = await execute(() => unidadService.create(data))
    }

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      onSuccess(result.data.message)
      onClose()
    }

    setLoading(false)
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
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {unidad ? 'Editar Unidad' : 'Nueva Unidad'}
          <IconButton onClick={handleClose} disabled={loading}>
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

        <TextField
          label="Símbolo"
          value={formData.simbolo}
          onChange={(e) => handleInputChange('simbolo', e.target.value)}
          fullWidth
          required
          disabled={loading}
          sx={{ mb: 2 }}
          placeholder="Ej.: kg"
        />

        <TextField
          label="Nombre"
          value={formData.nombre}
          onChange={(e) => handleInputChange('nombre', e.target.value)}
          fullWidth
          required
          disabled={loading}
          sx={{ mb: 2 }}
          placeholder="Ej.: Kilogramos"
        />

        <TextField
          label="Descripción"
          value={formData.descripcion}
          onChange={(e) => handleInputChange('descripcion', e.target.value)}
          fullWidth
          multiline
          rows={3}
          disabled={loading}
          placeholder="Descripción opcional de la unidad de medida"
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          color="inherit"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{ minWidth: 120 }}
        >
          {loading ? (
            <CircularProgress size={20} />
          ) : (
            unidad ? 'Actualizar' : 'Crear'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

