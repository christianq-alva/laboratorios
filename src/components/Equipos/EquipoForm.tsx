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
  IconButton,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  InputAdornment,
  FormHelperText
} from '@mui/material'
import { Close, Build, TrendingDown } from '@mui/icons-material'
import { equipoService, type Equipo } from '../../services/equipoService'
import { tipoEquipoService, type TipoEquipo } from '../../services/tipoEquipoService'
import { laboratorioService, type Laboratorio } from '../../services/laboratorioService'
import {
  depreciacionCategoriaService,
  formatPorcentaje,
  type DepreciacionCategoria
} from '../../services/depreciacionCategoriaService'
import { useApi } from '../../hooks/useApi'
interface EquipoFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  equipo?: Equipo | null
}

export const EquipoForm: React.FC<EquipoFormProps> = ({ open, onClose, onSuccess, equipo }) => {
  const { execute } = useApi()
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    marca: '',
    modelo: '',
    numero_serie: '',
    estado: 'Operativo' as 'Operativo' | 'En Mantenimiento' | 'Fuera de Servicio',
    fecha_ultimo_mantenimiento: '',
    fecha_proximo_mantenimiento: '',
    comentarios: '',
    condicion: 'Excelente' as 'Excelente' | 'Bueno' | 'Regular' | 'Malo',
    fecha_adquisicion: '',
    tipo_equipo_id: 0,
    laboratorio_id: 0,
    valor_adquisicion: '',
    depreciacion_categoria_id: 0
  })

  const [tiposEquipo, setTiposEquipo] = useState<TipoEquipo[]>([])
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [depreciacionCategorias, setDepreciacionCategorias] = useState<DepreciacionCategoria[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = Boolean(equipo)

  // Costo de depreciación por práctica de UNA unidad, con el valor y la categoría elegidos
  const costoDepreciacionPreview = (() => {
    const valor = Number(formData.valor_adquisicion)
    if (formData.valor_adquisicion.trim() === '' || !Number.isFinite(valor) || valor <= 0) return null
    const categoria = depreciacionCategorias.find(c => c.id === formData.depreciacion_categoria_id)
    if (!categoria) return null
    return valor * (Number(categoria.porcentaje) / 100)
  })()

  // Cargar datos iniciales (tipos de equipo y laboratorios)
  useEffect(() => {
    if (open) {
      loadInitialData()
    }
  }, [open])

  // Cargar datos del equipo después de que los laboratorios estén cargados
  useEffect(() => {
    if (open && equipo && laboratorios.length > 0) {
      loadEquipoData(equipo)
    } else if (open && !equipo) {
      resetForm()
    }
  }, [open, equipo, laboratorios.length])

  const loadInitialData = async () => {

    setLoadingData(true)
    const [tiposResult, laboratoriosResult, categoriasResult] = await Promise.all([
      execute(() => tipoEquipoService.getActivos()),
      execute(() => laboratorioService.getAll()),
      execute(() => depreciacionCategoriaService.getActivas())
    ])
    if (tiposResult.error) {
      setError(tiposResult.error)
    } else if (tiposResult.data) {
      const sortedTipos = [...(tiposResult.data.data || [])].sort((a, b) => a.nombre.localeCompare(b.nombre))
      setTiposEquipo(sortedTipos)
    }
    if (laboratoriosResult.error) {
      setError(laboratoriosResult.error)
    } else if (laboratoriosResult.data) {
      const sortedLaboratorios = [...(laboratoriosResult.data.data || [])].sort((a, b) => a.nombre.localeCompare(b.nombre))
      setLaboratorios(sortedLaboratorios)
    }
    if (categoriasResult.data) {
      setDepreciacionCategorias(categoriasResult.data.data || [])
    }
    setLoadingData(false)
  }

  const loadEquipoData = (equipoData: Equipo) => {
    // Función para formatear fechas al formato YYYY-MM-DD requerido por input[type="date"]
    const formatDateForInput = (date: string | undefined) => {
      if (!date) return ''
      try {
        return new Date(date).toISOString().split('T')[0]
      } catch (error) {
        return ''
      }
    }

    setFormData({
      codigo: equipoData.codigo,
      nombre: equipoData.nombre,
      descripcion: equipoData.descripcion || '',
      marca: equipoData.marca || '',
      modelo: equipoData.modelo || '',
      numero_serie: equipoData.numero_serie || '',
      estado: equipoData.estado,
      fecha_ultimo_mantenimiento: formatDateForInput(equipoData.fecha_ultimo_mantenimiento),
      fecha_proximo_mantenimiento: formatDateForInput(equipoData.fecha_proximo_mantenimiento),
      comentarios: equipoData.comentarios || '',
      condicion: equipoData.condicion || 'Excelente',
      fecha_adquisicion: formatDateForInput(equipoData.fecha_adquisicion),
      tipo_equipo_id: equipoData.tipo_equipo_id || 0,
      laboratorio_id: equipoData.laboratorio_id || 0,
      valor_adquisicion: equipoData.valor_adquisicion === null || equipoData.valor_adquisicion === undefined
        ? ''
        : String(Number(equipoData.valor_adquisicion)),
      depreciacion_categoria_id: equipoData.depreciacion_categoria_id || 0
    })
  }

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: '',
      marca: '',
      modelo: '',
      numero_serie: '',
      estado: 'Operativo',
      fecha_ultimo_mantenimiento: '',
      fecha_proximo_mantenimiento: '',
      comentarios: '',
      condicion: 'Excelente',
      fecha_adquisicion: '',
      tipo_equipo_id: 0,
      laboratorio_id: 0,
      valor_adquisicion: '',
      depreciacion_categoria_id: 0
    })
    setError(null)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    // Validaciones
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido')
      return
    }

    // Validar fechas de mantenimiento
    if (formData.fecha_ultimo_mantenimiento && formData.fecha_proximo_mantenimiento) {
      const fechaUltimo = new Date(formData.fecha_ultimo_mantenimiento)
      const fechaProximo = new Date(formData.fecha_proximo_mantenimiento)

      if (fechaProximo < fechaUltimo) {
        setError('La fecha del próximo mantenimiento no puede ser anterior a la fecha del último mantenimiento')
        setLoading(false)
        return
      }
    }

    // Validar valor de adquisición (opcional, pero si viene debe ser válido)
    if (formData.valor_adquisicion.trim() !== '') {
      const valor = Number(formData.valor_adquisicion)
      if (!Number.isFinite(valor) || valor < 0) {
        setError('El valor de adquisición debe ser un número mayor o igual a 0')
        setLoading(false)
        return
      }
      if (Number(valor.toFixed(2)) !== valor) {
        setError('El valor de adquisición no puede tener más de 2 decimales')
        setLoading(false)
        return
      }
    }

    // Preparar datos
    const equipoData = {
      ...formData,
      codigo: formData.codigo.trim(),
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim(),
      marca: formData.marca.trim(),
      modelo: formData.modelo.trim(),
      numero_serie: formData.numero_serie.trim(),
      comentarios: formData.comentarios.trim(),
      fecha_adquisicion: formData.fecha_adquisicion && formData.fecha_adquisicion.trim() ? formData.fecha_adquisicion : undefined,
      fecha_ultimo_mantenimiento: formData.fecha_ultimo_mantenimiento && formData.fecha_ultimo_mantenimiento.trim() ? formData.fecha_ultimo_mantenimiento : undefined,
      fecha_proximo_mantenimiento: formData.fecha_proximo_mantenimiento && formData.fecha_proximo_mantenimiento.trim() ? formData.fecha_proximo_mantenimiento : undefined,
      tipo_equipo_id: formData.tipo_equipo_id > 0 ? formData.tipo_equipo_id : undefined,
      laboratorio_id: formData.laboratorio_id > 0 ? formData.laboratorio_id : undefined,
      valor_adquisicion: formData.valor_adquisicion.trim() === '' ? null : Number(formData.valor_adquisicion),
      depreciacion_categoria_id: formData.depreciacion_categoria_id > 0 ? formData.depreciacion_categoria_id : null
    }

    let result
    if (isEditing && equipo) {
      result = await execute(() => equipoService.update(equipo.id, equipoData))
    } else {
      result = await execute(() => equipoService.create(equipoData))
    }

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      onSuccess()
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
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Build color="primary" />
            {isEditing ? 'Editar Equipo' : 'Nuevo Equipo'}
          </Typography>
          <IconButton onClick={handleClose} disabled={loading} sx={{ color: 'grey.500' }}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {loadingData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Cargando datos...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {/* Información básica del equipo */}
            <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                Información del Equipo
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Código de Activo"
                  value={formData.codigo}
                  onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
                  placeholder="Ej.: EQP-0001"
                  disabled={loading}
                  required
                />

                <TextField
                  fullWidth
                  label="Nombre del equipo"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej.: Microscopio Óptico, Balanza Analítica..."
                  disabled={loading}
                  required
                />

                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Descripción"
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Descripción detallada del equipo..."
                  disabled={loading}
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Marca"
                    value={formData.marca}
                    onChange={(e) => setFormData(prev => ({ ...prev, marca: e.target.value }))}
                    placeholder="Ej.: Olympus, Mettler Toledo..."
                    disabled={loading}
                  />

                  <TextField
                    fullWidth
                    label="Modelo"
                    value={formData.modelo}
                    onChange={(e) => setFormData(prev => ({ ...prev, modelo: e.target.value }))}
                    placeholder="Ej.: CX23, ML204..."
                    disabled={loading}
                  />
                </Box>

                <TextField
                  fullWidth
                  label="Número de serie"
                  value={formData.numero_serie}
                  onChange={(e) => setFormData(prev => ({ ...prev, numero_serie: e.target.value }))}
                  placeholder="Número de serie único"
                  disabled={loading}
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth required>
                    <InputLabel>Tipo de Equipo</InputLabel>
                    <Select
                      value={formData.tipo_equipo_id}
                      label="Tipo de Equipo"
                      onChange={(e) => setFormData(prev => ({ ...prev, tipo_equipo_id: e.target.value as number }))}
                      disabled={loading}
                    >
                      <MenuItem value={0} disabled>Seleccionar tipo</MenuItem>
                      {tiposEquipo.map((tipo) => (
                        <MenuItem key={tipo.id} value={tipo.id}>
                          {tipo.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth required>
                    <InputLabel>Laboratorio (Ubicación)</InputLabel>
                    <Select
                      value={formData.laboratorio_id}
                      label="Laboratorio (Ubicación)"
                      onChange={(e) => setFormData(prev => ({ ...prev, laboratorio_id: e.target.value as number }))}
                      disabled={loading}
                    >
                      <MenuItem value={0} disabled>Seleccionar laboratorio</MenuItem>
                      {laboratorios.map((lab) => (
                        <MenuItem key={lab.id} value={lab.id}>
                          {lab.nombre} {lab.codigo && `(${lab.codigo})`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Estado</InputLabel>
                    <Select
                      value={formData.estado}
                      label="Estado"
                      onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value as any }))}
                      disabled={loading}
                    >
                      <MenuItem value="Operativo">Operativo</MenuItem>
                      <MenuItem value="En Mantenimiento">En Mantenimiento</MenuItem>
                      <MenuItem value="Fuera de Servicio">Fuera de Servicio</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha de adquisición"
                    value={formData.fecha_adquisicion}
                    onChange={(e) => setFormData(prev => ({ ...prev, fecha_adquisicion: e.target.value }))}
                    disabled={loading}
                    InputLabelProps={{ shrink: true }}
                    required
                  />

                  <FormControl fullWidth>
                    <InputLabel>Condición</InputLabel>
                    <Select
                      value={formData.condicion}
                      label="Condición"
                      onChange={(e) => setFormData(prev => ({ ...prev, condicion: e.target.value as any }))}
                      disabled={loading}
                    >
                      <MenuItem value="Excelente">Excelente</MenuItem>
                      <MenuItem value="Bueno">Bueno</MenuItem>
                      <MenuItem value="Regular">Regular</MenuItem>
                      <MenuItem value="Malo">Malo</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Depreciación: valor del equipo y categoría (ambos opcionales) */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Valor del equipo (opcional)"
                    value={formData.valor_adquisicion}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor_adquisicion: e.target.value }))}
                    disabled={loading}
                    slotProps={{
                      htmlInput: { step: 0.01, min: 0 },
                      input: {
                        startAdornment: <InputAdornment position="start">S/</InputAdornment>
                      }
                    }}
                    helperText="Base de cálculo de la depreciación por práctica"
                  />

                  <FormControl fullWidth>
                    <InputLabel>Categoría de depreciación (opcional)</InputLabel>
                    <Select
                      value={formData.depreciacion_categoria_id}
                      label="Categoría de depreciación (opcional)"
                      onChange={(e) => setFormData(prev => ({ ...prev, depreciacion_categoria_id: e.target.value as number }))}
                      disabled={loading}
                    >
                      <MenuItem value={0}>Sin categoría</MenuItem>
                      {depreciacionCategorias.map((categoria) => (
                        <MenuItem key={categoria.id} value={categoria.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TrendingDown fontSize="small" />
                            {categoria.nombre} ({formatPorcentaje(categoria.porcentaje)})
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      {costoDepreciacionPreview !== null
                        ? `Costo por práctica: S/ ${costoDepreciacionPreview.toFixed(4)} por unidad`
                        : 'Define valor y categoría para cobrar depreciación'}
                    </FormHelperText>
                  </FormControl>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha último mantenimiento (opcional)"
                    value={formData.fecha_ultimo_mantenimiento}
                    onChange={(e) => setFormData(prev => ({ ...prev, fecha_ultimo_mantenimiento: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    disabled={loading}
                    helperText="Dejar vacío si no aplica"
                  />

                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha próximo mantenimiento (opcional)"
                    value={formData.fecha_proximo_mantenimiento}
                    onChange={(e) => setFormData(prev => ({ ...prev, fecha_proximo_mantenimiento: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    disabled={loading}
                    inputProps={{
                      min: formData.fecha_ultimo_mantenimiento || undefined
                    }}
                    helperText={
                      formData.fecha_ultimo_mantenimiento
                        ? "Debe ser posterior a la fecha del último mantenimiento"
                        : "Dejar vacío si no aplica"
                    }
                  />
                </Box>

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Comentarios"
                  value={formData.comentarios}
                  onChange={(e) => setFormData(prev => ({ ...prev, comentarios: e.target.value }))}
                  placeholder="Comentarios adicionales sobre el equipo..."
                  disabled={loading}
                />
              </Box>
            </Paper>
          </Box>
        )}
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
          onClick={handleSubmit}
          disabled={loading || !formData.nombre.trim() || !formData.codigo.trim()}
          variant="contained"
          sx={{ borderRadius: 2, px: 3 }}
        >
          {loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            isEditing ? 'Actualizar Equipo' : 'Crear Equipo'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
