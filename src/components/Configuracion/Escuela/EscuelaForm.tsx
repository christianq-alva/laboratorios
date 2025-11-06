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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    // Validaciones
    if (!formData.nombre?.trim()) {
      throw new Error('El nombre es requerido')
    }

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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {isEditing ? 'Editar Escuela' : 'Nueva Escuela'}
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
            label="Nombre de la Escuela"
            value={formData.nombre}
            onChange={handleChange('nombre')}
            required
            disabled={loading}
            autoFocus
            placeholder="Ej: Escuela Profesional de Ingeniería de Sistemas"
            helperText="Ingrese el nombre completo de la escuela profesional"
          />
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
              isEditing ? 'Actualizar' : 'Crear Escuela'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

