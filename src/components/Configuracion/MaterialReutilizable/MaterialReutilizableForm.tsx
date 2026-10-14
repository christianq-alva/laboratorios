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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  InputAdornment,
  FormHelperText,
  Typography
} from '@mui/material'
import { Close, Science, TrendingDown } from '@mui/icons-material'
import {
  materialReutilizableService,
  type MaterialReutilizable
} from '../../../services/materialReutilizableService'
import { laboratorioService, type Laboratorio } from '../../../services/laboratorioService'
import {
  depreciacionCategoriaService,
  formatPorcentaje,
  type DepreciacionCategoria
} from '../../../services/depreciacionCategoriaService'
import { useApi } from '../../../hooks/useApi'

interface MaterialReutilizableFormProps {
  open: boolean
  onClose: () => void
  onSuccess: (message?: string) => void
  material?: MaterialReutilizable | null
}

export const MaterialReutilizableForm: React.FC<MaterialReutilizableFormProps> = ({
  open,
  onClose,
  onSuccess,
  material
}) => {
  const { execute } = useApi()
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    laboratorio_id: 0,
    cantidad_total: '0',
    valor_unitario: '',
    depreciacion_categoria_id: 0,
    activo: true
  })

  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [categorias, setCategorias] = useState<DepreciacionCategoria[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = Boolean(material)

  useEffect(() => {
    if (open) {
      loadInitialData()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    if (material) {
      setFormData({
        codigo: material.codigo,
        nombre: material.nombre,
        descripcion: material.descripcion || '',
        laboratorio_id: material.laboratorio_id || 0,
        cantidad_total: String(material.cantidad_total ?? 0),
        valor_unitario: material.valor_unitario === null || material.valor_unitario === undefined
          ? ''
          : String(Number(material.valor_unitario)),
        depreciacion_categoria_id: material.depreciacion_categoria_id || 0,
        activo: Boolean(Number(material.activo))
      })
    } else {
      setFormData({
        codigo: '',
        nombre: '',
        descripcion: '',
        laboratorio_id: 0,
        cantidad_total: '0',
        valor_unitario: '',
        depreciacion_categoria_id: 0,
        activo: true
      })
    }
    setError(null)
  }, [open, material])

  const loadInitialData = async () => {
    setLoadingData(true)
    const [labsResult, categoriasResult] = await Promise.all([
      execute(() => laboratorioService.getAll()),
      execute(() => depreciacionCategoriaService.getActivas())
    ])
    if (labsResult.error) {
      setError(labsResult.error)
    } else if (labsResult.data) {
      const sorted = [...(labsResult.data.data || [])].sort((a, b) => a.nombre.localeCompare(b.nombre))
      setLaboratorios(sorted)
    }
    if (categoriasResult.data) {
      setCategorias(categoriasResult.data.data || [])
    }
    setLoadingData(false)
  }

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Validaciones espejo del schema zod del backend
  const validateForm = () => {
    if (!formData.codigo.trim()) {
      setError('El código es obligatorio')
      return false
    }
    if (formData.codigo.length > 50) {
      setError('El código no puede exceder 50 caracteres')
      return false
    }
    if (!formData.nombre.trim()) {
      setError('El nombre es obligatorio')
      return false
    }
    if (formData.nombre.length > 255) {
      setError('El nombre no puede exceder 255 caracteres')
      return false
    }
    if (!formData.laboratorio_id) {
      setError('Debes seleccionar un laboratorio')
      return false
    }
    const cantidad = Number(formData.cantidad_total)
    if (!Number.isInteger(cantidad) || cantidad < 0) {
      setError('La cantidad total debe ser un número entero mayor o igual a 0')
      return false
    }
    if (formData.valor_unitario.trim() !== '') {
      const valor = Number(formData.valor_unitario)
      if (!Number.isFinite(valor) || valor < 0) {
        setError('El valor unitario debe ser un número mayor o igual a 0')
        return false
      }
      if (Number(valor.toFixed(2)) !== valor) {
        setError('El valor unitario no puede tener más de 2 decimales')
        return false
      }
    }
    if (formData.descripcion.length > 1000) {
      setError('La descripción no puede exceder 1000 caracteres')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    setError(null)

    const data = {
      codigo: formData.codigo.trim(),
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim() || null,
      laboratorio_id: formData.laboratorio_id,
      cantidad_total: Number(formData.cantidad_total),
      valor_unitario: formData.valor_unitario.trim() === '' ? null : Number(formData.valor_unitario),
      depreciacion_categoria_id: formData.depreciacion_categoria_id > 0 ? formData.depreciacion_categoria_id : null,
      activo: formData.activo
    }

    const result = material
      ? await execute(() => materialReutilizableService.update(material.id, data))
      : await execute(() => materialReutilizableService.create(data))

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      onSuccess(result.data.message)
      onClose()
    }

    setLoading(false)
  }

  const handleClose = () => {
    if (!loading) onClose()
  }

  // Costo de depreciación por práctica de UNA unidad
  const costoUnitario = (() => {
    const valor = Number(formData.valor_unitario)
    if (formData.valor_unitario.trim() === '' || !Number.isFinite(valor) || valor <= 0) return null
    const categoria = categorias.find(c => c.id === formData.depreciacion_categoria_id)
    if (!categoria) return null
    return valor * (Number(categoria.porcentaje) / 100)
  })()

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Science color="primary" />
            {isEditing ? 'Editar Material Reutilizable' : 'Nuevo Material Reutilizable'}
          </Box>
          <IconButton onClick={handleClose} disabled={loading}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loadingData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Código"
                value={formData.codigo}
                onChange={(e) => handleChange('codigo', e.target.value)}
                sx={{ flex: 1 }}
                required
                disabled={loading}
                placeholder="Ej.: CRI-0001"
              />
              <TextField
                label="Nombre"
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                sx={{ flex: 2 }}
                required
                disabled={loading}
                placeholder="Ej.: Vaso precipitado 250 ml"
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl sx={{ flex: 2 }} required>
                <InputLabel>Laboratorio</InputLabel>
                <Select
                  value={formData.laboratorio_id}
                  label="Laboratorio"
                  onChange={(e) => handleChange('laboratorio_id', e.target.value as number)}
                  disabled={loading}
                >
                  <MenuItem value={0} disabled>Seleccionar laboratorio</MenuItem>
                  {laboratorios.map((lab) => (
                    <MenuItem key={lab.id} value={lab.id}>
                      {lab.nombre} - {lab.ubicacion}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Cantidad total"
                value={formData.cantidad_total}
                onChange={(e) => handleChange('cantidad_total', e.target.value)}
                sx={{ flex: 1 }}
                type="number"
                disabled={loading}
                slotProps={{ htmlInput: { step: 1, min: 0 } }}
                helperText="Unidades en el laboratorio"
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Valor unitario (opcional)"
                value={formData.valor_unitario}
                onChange={(e) => handleChange('valor_unitario', e.target.value)}
                sx={{ flex: 1 }}
                type="number"
                disabled={loading}
                slotProps={{
                  htmlInput: { step: 0.01, min: 0 },
                  input: { startAdornment: <InputAdornment position="start">S/</InputAdornment> }
                }}
                helperText="Valor de UNA unidad"
              />
              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Categoría de depreciación</InputLabel>
                <Select
                  value={formData.depreciacion_categoria_id}
                  label="Categoría de depreciación"
                  onChange={(e) => handleChange('depreciacion_categoria_id', e.target.value as number)}
                  disabled={loading}
                >
                  <MenuItem value={0}>Sin categoría</MenuItem>
                  {categorias.map((categoria) => (
                    <MenuItem key={categoria.id} value={categoria.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingDown fontSize="small" />
                        {categoria.nombre} ({formatPorcentaje(categoria.porcentaje)})
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  {costoUnitario !== null
                    ? `S/ ${costoUnitario.toFixed(4)} por práctica, por unidad`
                    : 'Define valor y categoría para cobrar depreciación'}
                </FormHelperText>
              </FormControl>
            </Box>

            <TextField
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              fullWidth
              multiline
              rows={2}
              disabled={loading}
              placeholder="Detalle, capacidad, material, etc."
            />

            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.activo}
                    onChange={(e) => handleChange('activo', e.target.checked)}
                    disabled={loading}
                  />
                }
                label="Activo"
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Los materiales inactivos no se ofrecen al crear un horario, pero conservan el
                historial de costos de los horarios donde ya se usaron.
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={loading} color="inherit">Cancelar</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || loadingData}
          sx={{ minWidth: 120 }}
        >
          {loading ? <CircularProgress size={20} /> : isEditing ? 'Actualizar' : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
