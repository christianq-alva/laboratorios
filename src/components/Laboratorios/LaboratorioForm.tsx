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
} from '@mui/material'
import { Close } from '@mui/icons-material'
import { laboratorioService } from '../../services/laboratorioService'
import type { Laboratorio, CreateLaboratorioData } from '../../services/laboratorioService'

interface LaboratorioFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  laboratorio?: Laboratorio | null
}

export const LaboratorioForm: React.FC<LaboratorioFormProps> = ({
  open,
  onClose,
  onSuccess,
  laboratorio,
}) => {
  const [formData, setFormData] = useState<CreateLaboratorioData>({
    nombre: '',
    ubicacion: '',
    capacidad: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = Boolean(laboratorio)

  // Cargar datos del laboratorio para edición
  useEffect(() => {
    if (laboratorio) {
      setFormData({
        nombre: laboratorio.nombre,
        ubicacion: laboratorio.ubicacion,
        capacidad: laboratorio.capacidad,
      })
    } else {
      setFormData({
        nombre: '',
        ubicacion: '',
        capacidad: 0,
      })
    }
    setError(null)
  }, [laboratorio, open])

  const handleChange = (field: keyof CreateLaboratorioData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'capacidad' ? parseInt(event.target.value) || 0 : event.target.value
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validaciones básicas
      if (!formData.nombre.trim()) {
        throw new Error('El nombre es requerido')
      }
      if (!formData.ubicacion.trim()) {
        throw new Error('La ubicación es requerida')
      }
      if (formData.capacidad <= 0) {
        throw new Error('La capacidad debe ser mayor a 0')
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
          {isEditing ? 'Editar Laboratorio' : 'Nuevo Laboratorio'}
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
            placeholder="Ej: Edificio A - Piso 2 - Aula 201"
          />

          <TextField
            fullWidth
            label="Capacidad"
            type="number"
            value={formData.capacidad}
            onChange={handleChange('capacidad')}
            required
            disabled={loading}
            sx={{ mb: 1 }}
            inputProps={{ min: 1, max: 100 }}
            placeholder="Número de estudiantes"
            helperText="Número máximo de estudiantes"
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