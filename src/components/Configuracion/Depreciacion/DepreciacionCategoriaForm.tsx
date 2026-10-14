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
  CircularProgress,
  FormControlLabel,
  Switch,
  InputAdornment,
  Typography
} from '@mui/material'
import { Close } from '@mui/icons-material'
import {
  depreciacionCategoriaService,
  type DepreciacionCategoria
} from '../../../services/depreciacionCategoriaService'
import { useApi } from '../../../hooks/useApi'

interface DepreciacionCategoriaFormProps {
  open: boolean
  onClose: () => void
  onSuccess: (message?: string) => void
  categoria?: DepreciacionCategoria | null
}

export const DepreciacionCategoriaForm: React.FC<DepreciacionCategoriaFormProps> = ({
  open,
  onClose,
  onSuccess,
  categoria
}) => {
  const { execute } = useApi()
  const [formData, setFormData] = useState({
    nombre: '',
    porcentaje: '',
    descripcion: '',
    activo: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Resetear formulario cuando se abre/cierra
  useEffect(() => {
    if (open) {
      if (categoria) {
        setFormData({
          nombre: categoria.nombre,
          porcentaje: String(parseFloat(Number(categoria.porcentaje).toFixed(4))),
          descripcion: categoria.descripcion || '',
          activo: Boolean(Number(categoria.activo))
        })
      } else {
        setFormData({
          nombre: '',
          porcentaje: '',
          descripcion: '',
          activo: true
        })
      }
      setError(null)
    }
  }, [open, categoria])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Validar formulario (mismas reglas que el schema zod del backend)
  const validateForm = () => {
    if (!formData.nombre.trim()) {
      setError('El nombre es obligatorio')
      return false
    }
    if (formData.nombre.length > 50) {
      setError('El nombre no puede exceder 50 caracteres')
      return false
    }
    if (formData.porcentaje.trim() === '') {
      setError('El porcentaje es obligatorio')
      return false
    }
    const porcentaje = Number(formData.porcentaje)
    if (!Number.isFinite(porcentaje)) {
      setError('El porcentaje debe ser un número')
      return false
    }
    if (porcentaje < 0) {
      setError('El porcentaje no puede ser negativo')
      return false
    }
    if (porcentaje > 100) {
      setError('El porcentaje no puede exceder 100')
      return false
    }
    if (Number(porcentaje.toFixed(4)) !== porcentaje) {
      setError('El porcentaje no puede tener más de 4 decimales')
      return false
    }
    if (formData.descripcion && formData.descripcion.length > 500) {
      setError('La descripción no puede exceder 500 caracteres')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    setError(null)

    const data = {
      nombre: formData.nombre.trim(),
      porcentaje: Number(formData.porcentaje),
      descripcion: formData.descripcion.trim() || null,
      activo: formData.activo
    }

    const result = categoria
      ? await execute(() => depreciacionCategoriaService.update(categoria.id, data))
      : await execute(() => depreciacionCategoriaService.create(data))

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

  // Previsualización: cuánto se cobraría por un bien de S/ 1 000 con este porcentaje
  const porcentajeNum = Number(formData.porcentaje)
  const previewValido = formData.porcentaje.trim() !== '' && Number.isFinite(porcentajeNum) && porcentajeNum >= 0

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
          {categoria ? 'Editar Categoría de Depreciación' : 'Nueva Categoría de Depreciación'}
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
          placeholder="Ej.: Pequeño, Mediano, Grande"
        />

        <TextField
          label="Porcentaje por práctica"
          value={formData.porcentaje}
          onChange={(e) => handleInputChange('porcentaje', e.target.value)}
          fullWidth
          required
          disabled={loading}
          type="number"
          slotProps={{
            htmlInput: { step: 0.0001, min: 0, max: 100 },
            input: {
              endAdornment: <InputAdornment position="end">%</InputAdornment>
            }
          }}
          helperText="Porcentaje del valor del bien que se cobra en cada práctica. Hasta 4 decimales (ej. 1 o 0.05)."
          sx={{ mb: previewValido ? 1 : 2 }}
        />

        {previewValido && (
          <Alert severity="info" icon={false} sx={{ mb: 2, py: 0.5 }}>
            <Typography variant="caption">
              Un bien de <strong>S/ 1 000.00</strong> en esta categoría costaría{' '}
              <strong>S/ {(1000 * porcentajeNum / 100).toFixed(4)}</strong> por práctica
              {porcentajeNum > 0 && (
                <> · se recupera su valor en <strong>{Math.round(100 / porcentajeNum)}</strong> prácticas</>
              )}
            </Typography>
          </Alert>
        )}

        <TextField
          label="Descripción"
          value={formData.descripcion}
          onChange={(e) => handleInputChange('descripcion', e.target.value)}
          fullWidth
          multiline
          rows={3}
          disabled={loading}
          placeholder="Ej.: Vaso precipitado, probeta, fiola, materiales afines a cristalería"
          sx={{ mb: 1 }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={formData.activo}
              onChange={(e) => handleInputChange('activo', e.target.checked)}
              disabled={loading}
            />
          }
          label="Activa"
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          Las categorías inactivas no aparecen al configurar equipos ni materiales, pero siguen
          aplicando a los bienes que ya las tienen asignadas.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={loading} color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{ minWidth: 120 }}
        >
          {loading ? <CircularProgress size={20} /> : categoria ? 'Actualizar' : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
