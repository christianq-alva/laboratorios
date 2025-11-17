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
import { docenteService } from '../../../services/docenteService'
import type { Docente, DocenteData } from '../../../services/docenteService'
import { escuelaService, type Escuela } from '../../../services/escuelaService'
import { useApi } from '../../../hooks/useApi'

interface DocenteFormProps {
  open: boolean
  onClose: () => void
  onSuccess: (message?: string) => void
  docente?: Docente | null
}

export const DocenteForm: React.FC<DocenteFormProps> = ({
  open,
  onClose,
  onSuccess,
  docente,
}) => {
  const { execute } = useApi()
  const [formData, setFormData] = useState<DocenteData>({
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
    setLoadingEscuelas(true)
    const result = await execute(() => escuelaService.getAll())
    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setEscuelas(result.data.data)
    }
    setLoadingEscuelas(false)
  }

  // Cargar escuelas cuando se abre el modal
  useEffect(() => {
    if (open) {
      fetchEscuelas()
    }
  }, [open])

  // Cargar datos del docente para edición después de que las escuelas estén cargadas
  useEffect(() => {
    if (open && escuelas.length > 0) {
      if (docente) {
        // Asegurar que escuela_id sea un número
        const escuelaIdNumber = typeof docente.escuela_id === 'string'
          ? parseInt(docente.escuela_id)
          : docente.escuela_id || 0

        console.log('📝 Cargando datos del docente para edición:', {
          nombre: docente.nombre,
          escuela_id_original: docente.escuela_id,
          escuela_id_parseado: escuelaIdNumber,
          tipo_original: typeof docente.escuela_id,
          escuela: docente.escuela,
          escuelas_disponibles: escuelas.length
        })

        setFormData({
          nombre: docente.nombre,
          correo: docente.correo || '',
          escuela_id: escuelaIdNumber,
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
  }, [docente, open, escuelas])

  const handleChange = (field: keyof DocenteData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'escuela_id' ? parseInt(event.target.value) || 0 : event.target.value
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSelectChange = (event: any) => {
    console.log('🔄 Cambiando escuela:', {
      nuevo_valor: event.target.value,
      tipo: typeof event.target.value
    })
    setFormData(prev => ({
      ...prev,
      escuela_id: event.target.value
    }))
  }

  // Log para monitorear cambios en formData
  useEffect(() => {
    if (open) {
      console.log('📊 FormData actual:', formData)
    }
  }, [formData, open])

  // Validar formulario
  const validateForm = () => {
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido')
      return false
    }
    if (formData.correo && formData.correo.trim() && !formData.correo.includes('@')) {
      setError('El correo debe tener un formato válido')
      return false
    }
    if (formData.escuela_id <= 0) {
      setError('Debe seleccionar una escuela')
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
    if (isEditing && docente) {
      result = await execute(() => docenteService.update(docente.id, formData))
    } else {
      result = await execute(() => docenteService.create(formData))
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
            label="Correo Electrónico (Opcional)"
            type="email"
            value={formData.correo}
            onChange={handleChange('correo')}
            disabled={loading}
            sx={{ mb: 2 }}
            placeholder="Ej: juan.perez@universidad.edu"
            helperText="El correo es opcional. Déjalo vacío si no está disponible."
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
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
            {formData.escuela_id > 0 && (
              <Box sx={{ mt: 1, fontSize: '0.75rem', color: 'text.secondary' }}>
                Escuela seleccionada: ID {formData.escuela_id} - {escuelas.find(e => e.id === formData.escuela_id)?.nombre || 'Cargando...'}
              </Box>
            )}
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