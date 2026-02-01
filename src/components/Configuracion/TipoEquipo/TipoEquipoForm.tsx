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
import { Close} from '@mui/icons-material'
import { tipoEquipoService, type TipoEquipo } from '../../../services/tipoEquipoService'
import { useApi } from '../../../hooks/useApi'

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
  const { execute } = useApi()
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
      result = await execute(() => tipoEquipoService.update(tipoEquipo.id, data))
    } else {
      // Crear
      result = await execute(() => tipoEquipoService.create(data))
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
          {tipoEquipo ? 'Editar Tipo de Equipo' : 'Nuevo Tipo de Equipo'}
          <IconButton onClick={handleClose} disabled={loading}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label="Nombre"
          value={formData.nombre}
          onChange={(e) => handleInputChange('nombre', e.target.value)}
          fullWidth
          required
          disabled={loading}
          sx={{ mb: 2, mt: 2 }}
          placeholder="Ej.: Microscopio"
        />

        <TextField
          label="Descripción"
          value={formData.descripcion}
          onChange={(e) => handleInputChange('descripcion', e.target.value)}
          fullWidth
          multiline
          rows={3}
          disabled={loading}
          placeholder="Descripción breve del tipo de equipo"
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
            tipoEquipo ? 'Actualizar' : 'Crear'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

