import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material'
import { Close} from '@mui/icons-material'
import { insumoService, type Insumo } from '../../../services/insumoService'
import { unidadService, type Unidad } from '../../../services/unidadService'
import { useApi } from '../../../hooks/useApi'


interface InsumoFormProps {
  open: boolean
  onClose: () => void
  onSuccess: (message?: string) => void
  insumo?: Insumo | null
}

export const InsumoForm: React.FC<InsumoFormProps> = ({
  open,
  onClose,
  onSuccess,
  insumo
}) => {
  const { execute } = useApi()
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    unidad_id: 0,
    categoria: 'Materiales' as 'Reactivos' | 'Materiales' | 'Material_Biologico' | 'Farmacos',
    presentacion: '',
    cantidad_por_presentacion: '1'
  })
  const [unidades, setUnidades] = useState<Unidad[]>([])
  const [loadingUnidades, setLoadingUnidades] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar unidades al abrir el formulario
  useEffect(() => {
    if (open) {
      const loadUnidades = async () => {
        setLoadingUnidades(true)
        const result = await execute(() => unidadService.getAll())
        if (result.data) {
          const sortedUnidades = [...result.data.data].sort((a, b) => a.nombre.localeCompare(b.nombre))
          setUnidades(sortedUnidades)
        }
        setLoadingUnidades(false)
      }
      loadUnidades()
    }
  }, [open, execute])

  // Resetear formulario cuando se abre/cierra
  useEffect(() => {
    if (open) {
      if (insumo) {
        setFormData({
          nombre: insumo.nombre,
          descripcion: insumo.descripcion || '',
          unidad_id: insumo.unidad_id || 0,
          categoria: insumo.categoria || 'Materiales',
          presentacion: insumo.presentacion || '',
          cantidad_por_presentacion: insumo.cantidad_por_presentacion != null
            ? String(Number(insumo.cantidad_por_presentacion))
            : '1'
        })
      } else {
        setFormData({
          nombre: '',
          descripcion: '',
          unidad_id: 0,
          categoria: 'Materiales',
          presentacion: '',
          cantidad_por_presentacion: '1'
        })
      }
      setError(null)
    }
  }, [open, insumo])

  // Manejar cambios en el formulario
  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Validar formulario
  const validateForm = () => {
    if (!formData.nombre.trim()) {
      setError('El nombre del insumo es requerido')
      return false
    }
    if (!formData.unidad_id || formData.unidad_id === 0) {
      setError('La unidad de medida es requerida')
      return false
    }
    const cantidadPresentacion = Number(formData.cantidad_por_presentacion)
    if (!formData.cantidad_por_presentacion.trim() || isNaN(cantidadPresentacion) || cantidadPresentacion <= 0) {
      setError('La cantidad por presentación debe ser un número mayor a 0')
      return false
    }

    setError(null)
    return true
  }

  // Enviar formulario
  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    const insumoData = {
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim(),
      unidad_id: formData.unidad_id,
      categoria: formData.categoria,
      presentacion: formData.presentacion.trim(),
      cantidad_por_presentacion: Number(formData.cantidad_por_presentacion)
    }

    let result
    if (insumo) {
      // Actualizar insumo existente
      result = await execute(() => insumoService.update(insumo.id, insumoData))
    } else {
      // Crear nuevo insumo (solo el maestro, sin stock)
      result = await execute(() => insumoService.create(insumoData))
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
        sx: {
          borderRadius: 2
        }
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {insumo ? 'Editar Insumo' : 'Nuevo Insumo'}
          <IconButton onClick={handleClose} disabled={loading}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={(e) => {
        e.preventDefault()
        handleSubmit()
      }}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Nombre del Insumo"
            value={formData.nombre}
            onChange={(e) => handleInputChange('nombre', e.target.value)}
            required
            disabled={loading}
            sx={{ mb: 2 }}
            placeholder="Ej.: Ácido Sulfúrico"
          />

          <FormControl fullWidth sx={{ mb: 2 }} required>
            <InputLabel>Unidad de Medida</InputLabel>
            <Select
              value={formData.unidad_id}
              label="Unidad de Medida"
              onChange={(e) => handleInputChange('unidad_id', Number(e.target.value))}
              disabled={loadingUnidades || loading}
            >
              {unidades.map((unidad) => (
                <MenuItem key={unidad.id} value={unidad.id}>
                  {unidad.simbolo} - {unidad.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }} required>
            <InputLabel>Categoría del Insumo</InputLabel>
            <Select
              value={formData.categoria}
              label="Categoría del Insumo"
              onChange={(e) => handleInputChange('categoria', e.target.value)}
              disabled={loading}
            >
              <MenuItem value="Reactivos">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ff9800' }} />
                  <Typography>Reactivos</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="Materiales">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#2196f3' }} />
                  <Typography>Materiales</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="Material_Biologico">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#4caf50' }} />
                  <Typography>Material Biológico</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="Farmacos">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#9c27b0' }} />
                  <Typography>Fármacos</Typography>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Presentación"
              value={formData.presentacion}
              onChange={(e) => handleInputChange('presentacion', e.target.value)}
              disabled={loading}
              placeholder="Ej.: Frasco 500ml"
            />
            <TextField
              fullWidth
              label="Cantidad por presentación"
              value={formData.cantidad_por_presentacion}
              onChange={(e) => handleInputChange('cantidad_por_presentacion', e.target.value)}
              required
              disabled={loading}
              type="number"
              inputProps={{ min: 0, step: 'any' }}
              placeholder="Ej.: 500"
              helperText="Contenido en la unidad del insumo (Ej.: 500 si es Frasco 500ml y la unidad es ml)"
            />
          </Box>

          <TextField
            fullWidth
            label="Descripción"
            value={formData.descripcion}
            onChange={(e) => handleInputChange('descripcion', e.target.value)}
            multiline
            rows={3}
            disabled={loading}
            placeholder="Descripción opcional del insumo"
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
              insumo ? 'Actualizar' : 'Crear'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
