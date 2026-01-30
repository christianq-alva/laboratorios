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
  Typography,
} from '@mui/material'
import { Close } from '@mui/icons-material'
import { escuelaService, type Escuela, type CreateEscuelaData } from '../../../services/escuelaService'
import { useApi } from '../../../hooks/useApi'

interface EscuelaFormProps {
  open: boolean
  onClose: () => void
  onSuccess: (message?: string) => void
  escuela?: Escuela | null
}

export const EscuelaForm: React.FC<EscuelaFormProps> = ({ open, onClose, onSuccess, escuela }) => {
  const { execute } = useApi()
  const [formData, setFormData] = useState<CreateEscuelaData>({
    nombre: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = Boolean(escuela)

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (open) {
      if (escuela) {
        // Modo edición
        setFormData({
          nombre: escuela.nombre
        })
      } else {
        // Modo creación
        setFormData({
          nombre: ''
        })
      }
      setError(null)
    }
  }, [escuela, open])

  const handleChange = (field: keyof CreateEscuelaData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }))
  }
  // Validar formulario
  const validateForm = () => {
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido')
      return false
    }
    return true
  } 
  // Submit del formulario
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setError(null)

    let result
    if (isEditing && escuela) {
      result = await execute(() => escuelaService.update(escuela.id, formData))
    } else {
      result = await execute(() => escuelaService.create(formData))
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
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {isEditing ? 'Editar Escuela' : 'Nueva Escuela'}
          <IconButton onClick={handleClose} disabled={loading}>
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
            label="Nombre de la Escuela"
            value={formData.nombre}
            onChange={handleChange('nombre')}
            required
            disabled={loading}
            sx={{ mb: 2 }}
            placeholder="Ej.: Escuela Profesional de Ingeniería de Sistemas"
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
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            {loading ? (
              <CircularProgress size={20} />
            ) : (
              isEditing ? 'Actualizar' : 'Crear'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

