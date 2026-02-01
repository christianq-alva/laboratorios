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
import { laboratorioService } from '../../../services/laboratorioService'
import type { Laboratorio, CreateLaboratorioData, Escuela } from '../../../services/laboratorioService'
import { escuelaService } from '../../../services/escuelaService'
import { useApi } from '../../../hooks/useApi'

interface LaboratorioFormProps {
  open: boolean
  onClose: () => void
  onSuccess: (message?: string) => void
  laboratorio?: Laboratorio | null
}

export const LaboratorioForm: React.FC<LaboratorioFormProps> = ({ open, onClose, onSuccess, laboratorio }) => {
  const { execute } = useApi()
  // Estado del formulario incluyendo código, piso y estado
  const [formData, setFormData] = useState<CreateLaboratorioData>({
    codigo: '',
    nombre: '',
    ubicacion: '',
    escuela_id: 0,
    piso: '',
    estado: 'Activo'
  })

  const [escuelas, setEscuelas] = useState<Escuela[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingEscuelas, setLoadingEscuelas] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = Boolean(laboratorio)

  // Función para obtener escuelas
  const fetchEscuelas = async () => {
    setLoadingEscuelas(true)
    const result = await execute(() => escuelaService.getAll())
    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      const sortedEscuelas = [...result.data.data].sort((a, b) => a.nombre.localeCompare(b.nombre))
      setEscuelas(sortedEscuelas)
    }
    setLoadingEscuelas(false)
  }

  // Effect para cargar datos cuando se abre el modal
  useEffect(() => {
    if (open) {
      fetchEscuelas()

      if (laboratorio) {
        // Modo edición - cargar datos del laboratorio incluyendo código, piso y estado
        setFormData({
          codigo: laboratorio.codigo || '',
          nombre: laboratorio.nombre,
          ubicacion: laboratorio.ubicacion,
          escuela_id: laboratorio.escuela_id,
          piso: laboratorio.piso?.toString() || '',
          estado: laboratorio.estado || 'Activo'
        })
      } else {
        // Modo creación - resetear formulario
        setFormData({
          codigo: '',
          nombre: '',
          ubicacion: '',
          escuela_id: 0,
          piso: '',
          estado: 'Activo'
        })
      }

      setError(null)
    }
  }, [laboratorio, open])

  // Manejar cambios en campos de texto
  const handleChange = (field: keyof CreateLaboratorioData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    let value: string | number = event.target.value

    if (field === 'escuela_id') {
      value = parseInt(value) || 0
    }

    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Manejar cambios en select
  const handleSelectChange = (event: any) => {
    setFormData(prev => ({ ...prev, escuela_id: event.target.value }))
  }

  // Validar formulario
  const validateForm = () => {
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido')
      return false
    }
    if (!formData.codigo?.trim()) {
      setError('El código es requerido')
      return false
    }
    if (!formData.ubicacion?.trim()) {
      setError('La ubicación es requerida')
      return false
    }
    if (!formData.piso?.toString().trim()) {
      setError('El piso es requerido')
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
    if (isEditing && laboratorio) {
      result = await execute(() => laboratorioService.update(laboratorio.id, formData))
    } else {
      result = await execute(() => laboratorioService.create(formData))
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
            label="Código del Laboratorio"
            value={formData.codigo}
            onChange={handleChange('codigo')}
            required
            disabled={loading}
            sx={{ mb: 2 }}
            placeholder="Ej.: LAB-001"
          />

          <TextField
            fullWidth
            label="Nombre del Laboratorio"
            value={formData.nombre}
            onChange={handleChange('nombre')}
            required
            disabled={loading}
            sx={{ mb: 2 }}
            placeholder="Ej.: Laboratorio de Cómputo 1"
          />

          <TextField
            fullWidth
            label="Ubicación"
            value={formData.ubicacion}
            onChange={handleChange('ubicacion')}
            required
            disabled={loading}
            sx={{ mb: 2 }}
            placeholder="Ej.: Pabellón A"
          />

          <TextField
            fullWidth
            label="Piso"
            value={formData.piso}
            onChange={handleChange('piso')}
            required
            disabled={loading}
            sx={{ mb: 2 }}
            placeholder="Ej.: 1"
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
                {loadingEscuelas ? 'Cargando escuelas...' : 'Seleccionar escuela'}
              </MenuItem>
              {escuelas.map((escuela) => (
                <MenuItem key={escuela.id} value={escuela.id}>
                  {escuela.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Estado del Laboratorio</InputLabel>
            <Select
              value={formData.estado}
              label="Estado del Laboratorio"
              onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value as any }))}
              required
              disabled={loading}
            >
              <MenuItem value="Activo">Activo</MenuItem>
              <MenuItem value="En Mantenimiento">En Mantenimiento</MenuItem>
              <MenuItem value="Inhabilitado">Inhabilitado</MenuItem>
              <MenuItem value="Baja">Baja</MenuItem>
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