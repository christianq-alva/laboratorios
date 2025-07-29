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
} from '@mui/material'
import { Close } from '@mui/icons-material'
import { docenteService } from '../../services/docenteService'
import type { Docente, CreateDocenteData, Escuela } from '../../services/docenteService'

interface DocenteFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  docente?: Docente | null
}

export const DocenteForm: React.FC<DocenteFormProps> = ({
  open,
  onClose,
  onSuccess,
  docente,
}) => {
  const [formData, setFormData] = useState<CreateDocenteData>({
    nombre: '',
    correo: '',
    escuela_id: 0,
  })
  const [escuelas, setEscuelas] = useState<Escuela[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingEscuelas, setLoadingEscuelas] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = Boolean(docente)

  // Cargar escuelas
  const fetchEscuelas = async () => {
    try {
      setLoadingEscuelas(true)
      const result = await docenteService.getEscuelas()
      if (result.success) {
        setEscuelas(result.data || [])
      }
    } catch (err) {
      console.error('Error loading escuelas:', err)
    } finally {
      setLoadingEscuelas(false)
    }
  }

  // Cargar datos del docente para edición
  useEffect(() => {
    if (open) {
      fetchEscuelas()
      
      if (docente) {
        setFormData({
          nombre: docente.nombre,
          correo: docente.correo,
          escuela_id: docente.escuela_id,
        })
      } else {
        setFormData({
          nombre: '',
          correo: '',
          escuela_id: 0,
        })
      }
      setError(null)
    }
  }, [docente, open])

  const handleChange = (field: keyof CreateDocenteData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'escuela_id' ? parseInt(event.target.value) || 0 : event.target.value
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSelectChange = (event: any) => {
    setFormData(prev => ({
      ...prev,
      escuela_id: event.target.value
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
      if (!formData.correo.trim()) {
        throw new Error('El correo es requerido')
      }
      if (!formData.correo.includes('@')) {
        throw new Error('El correo debe tener un formato válido')
      }
      if (formData.escuela_id <= 0) {
        throw new Error('Debe seleccionar una escuela')
      }

      let result
      if (isEditing && docente) {
        result = await docenteService.update(docente.id, formData)
      } else {
        result = await docenteService.create(formData)
      }

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.message || 'Error al guardar el docente')
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
          {isEditing ? 'Editar Docente' : 'Nuevo Docente'}
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
            label="Nombre Completo"
            value={formData.nombre}
            onChange={handleChange('nombre')}
            required
            disabled={loading}
            sx={{ mb: 2 }}
            placeholder="Ej: Dr. Juan Pérez García"
          />

          <TextField
            fullWidth
            label="Correo Electrónico"
            type="email"
            value={formData.correo}
            onChange={handleChange('correo')}
            required
            disabled={loading}
            sx={{ mb: 2 }}
            placeholder="Ej: juan.perez@universidad.edu"
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
                {loadingEscuelas ? 'Cargando...' : 'Seleccionar escuela'}
              </MenuItem>
              {escuelas.map((escuela) => (
                <MenuItem key={escuela.id} value={escuela.id}>
                  {escuela.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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