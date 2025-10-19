import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  CircularProgress,
  Alert,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material'
import {
  Close,
  Save,
  Settings,
  Inventory,
  CheckCircle
} from '@mui/icons-material'
import { insumoService } from '../../services/insumoService'
import { laboratorioService } from '../../services/laboratorioService'

interface Laboratorio {
  id: number
  nombre: string
}

interface ConfigStockMinimoDialogProps {
  open: boolean
  onClose: () => void
  insumoId: number
  insumoNombre: string
  preselectedLaboratorioId?: number
  onSuccess?: () => void
}

interface ConfiguracionActual {
  id: number
  laboratorio_id: number
  laboratorio_nombre: string
  stock_minimo: number
  stock_maximo: number | null
  punto_reorden: number | null
  observaciones: string | null
  stock_actual: number
}

interface FormData {
  laboratorio_id: number
  stock_minimo: number
  stock_maximo: number | string
  punto_reorden: number | string
  observaciones: string
}

export const ConfigStockMinimoDialog: React.FC<ConfigStockMinimoDialogProps> = ({
  open,
  onClose,
  insumoId,
  insumoNombre,
  preselectedLaboratorioId,
  onSuccess
}) => {
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [configuracionesActuales, setConfiguracionesActuales] = useState<ConfiguracionActual[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    laboratorio_id: preselectedLaboratorioId || 0,
    stock_minimo: 1,
    stock_maximo: '',
    punto_reorden: '',
    observaciones: ''
  })

  // Cargar datos al abrir el diálogo
  useEffect(() => {
    if (open) {
      loadData()
    } else {
      resetForm()
    }
  }, [open, insumoId])

  // Actualizar formData cuando cambie preselectedLaboratorioId
  useEffect(() => {
    if (preselectedLaboratorioId) {
      setFormData(prev => ({
        ...prev,
        laboratorio_id: preselectedLaboratorioId
      }))
    }
  }, [preselectedLaboratorioId])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Cargar laboratorios y configuraciones en paralelo
      const [labsResponse, configResponse] = await Promise.all([
        laboratorioService.getAll(),
        insumoService.getConfiguracionStock(insumoId)
      ])

      if (labsResponse.success && labsResponse.data) {
        setLaboratorios(labsResponse.data)
      }

      if (configResponse.success) {
        setConfiguracionesActuales(configResponse.data)
        
        // Si hay un laboratorio pre-seleccionado, buscar su configuración existente
        if (preselectedLaboratorioId) {
          const configExistente = configResponse.data.find(
            c => c.laboratorio_id === preselectedLaboratorioId
          )
          
          // Si existe configuración, pre-cargar los valores para edición
          if (configExistente) {
            setFormData({
              laboratorio_id: preselectedLaboratorioId,
              stock_minimo: configExistente.stock_minimo,
              stock_maximo: configExistente.stock_maximo || '',
              punto_reorden: configExistente.punto_reorden || '',
              observaciones: configExistente.observaciones || ''
            })
          }
        }
      }
    } catch (error: any) {
      setError(error.message || 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      laboratorio_id: preselectedLaboratorioId || 0,
      stock_minimo: 1,
      stock_maximo: '',
      punto_reorden: '',
      observaciones: ''
    })
    setError(null)
    setSuccess(false)
  }

  const handleChange = (field: keyof FormData) => (event: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.laboratorio_id === 0) {
      setError('Debe seleccionar un laboratorio')
      return
    }

    if (formData.stock_minimo <= 0) {
      setError('El stock mínimo debe ser mayor a 0. Por favor, ingrese un valor válido.')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const data = {
        insumo_id: insumoId,
        laboratorio_id: formData.laboratorio_id,
        stock_minimo: formData.stock_minimo,
        stock_maximo: formData.stock_maximo === '' ? undefined : Number(formData.stock_maximo),
        punto_reorden: formData.punto_reorden === '' ? undefined : Number(formData.punto_reorden),
        observaciones: formData.observaciones || undefined
      }

      const response = await insumoService.configurarStockMinimo(data)

      if (response.success) {
        setSuccess(true)
        // Recargar configuraciones
        await loadData()
        // Resetear formulario
        resetForm()
        
        if (onSuccess) {
          onSuccess()
        }

        // Cerrar después de 1.5 segundos si no hay más que configurar
        setTimeout(() => {
          if (configuracionesActuales.length === laboratorios.length - 1) {
            onClose()
          }
        }, 1500)
      }
    } catch (error: any) {
      setError(error.message || 'Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }

  // Verificar si estamos en modo edición
  const configuracionExistente = preselectedLaboratorioId 
    ? configuracionesActuales.find(c => c.laboratorio_id === preselectedLaboratorioId)
    : null
  const modoEdicion = !!configuracionExistente

  const laboratoriosDisponibles = laboratorios.filter(
    lab => !configuracionesActuales.some(config => config.laboratorio_id === lab.id)
  )

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Settings color="primary" />
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {modoEdicion ? 'Editar Stock Mínimo' : 'Configurar Stock Mínimo'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {insumoNombre}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} disabled={saving}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert 
                severity="success" 
                icon={<CheckCircle />}
                sx={{ mb: 2 }}
              >
                ✅ Configuración guardada exitosamente
              </Alert>
            )}

            {/* Configuraciones actuales - Ocultar en modo edición */}
            {!modoEdicion && configuracionesActuales.length > 0 && (
              <Paper sx={{ mb: 3, p: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Configuraciones Existentes ({configuracionesActuales.length})
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Laboratorio</TableCell>
                        <TableCell align="right">Stock Actual</TableCell>
                        <TableCell align="right">Stock Mínimo</TableCell>
                        <TableCell align="center">Estado</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {configuracionesActuales.map((config) => (
                        <TableRow key={config.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {config.laboratorio_nombre}
                            </Typography>
                            {config.observaciones && (
                              <Typography variant="caption" color="text.secondary">
                                {config.observaciones}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600}>
                              {config.stock_actual}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {config.stock_minimo}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {config.stock_actual < config.stock_minimo ? (
                              <Chip label="Bajo" color="error" size="small" />
                            ) : config.punto_reorden && config.stock_actual <= config.punto_reorden ? (
                              <Chip label="Reordenar" color="warning" size="small" />
                            ) : (
                              <Chip label="Normal" color="success" size="small" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Formulario de nueva configuración o edición */}
            {(laboratoriosDisponibles.length > 0 || modoEdicion) ? (
              <form onSubmit={handleSubmit}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  {modoEdicion ? 'Editar Configuración' : 'Nueva Configuración'}
                </Typography>

                {/* Mostrar laboratorio como información en modo edición */}
                {modoEdicion ? (
                  <>
                    <Box sx={{ mb: 2, p: 2, bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Laboratorio
                      </Typography>
                      <Typography variant="body1" fontWeight={600} color="primary.main">
                        {configuracionExistente?.laboratorio_nombre}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2, p: 2, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.200' }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Stock Actual
                      </Typography>
                      <Typography variant="h6" fontWeight={600} color="info.dark">
                        {configuracionExistente?.stock_actual}
                      </Typography>
                      <Chip 
                        label={
                          configuracionExistente && configuracionExistente.stock_actual < configuracionExistente.stock_minimo
                            ? 'Stock Bajo'
                            : configuracionExistente?.punto_reorden && configuracionExistente.stock_actual <= configuracionExistente.punto_reorden
                            ? 'Reordenar'
                            : 'Normal'
                        }
                        color={
                          configuracionExistente && configuracionExistente.stock_actual < configuracionExistente.stock_minimo
                            ? 'error'
                            : configuracionExistente?.punto_reorden && configuracionExistente.stock_actual <= configuracionExistente.punto_reorden
                            ? 'warning'
                            : 'success'
                        }
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </>
                ) : (
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Laboratorio</InputLabel>
                    <Select
                      value={formData.laboratorio_id}
                      label="Laboratorio"
                      onChange={handleChange('laboratorio_id')}
                      required
                      disabled={saving || !!preselectedLaboratorioId}
                    >
                      <MenuItem value={0}>Seleccionar laboratorio</MenuItem>
                      {laboratoriosDisponibles.map((lab) => (
                        <MenuItem key={lab.id} value={lab.id}>
                          {lab.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                    {preselectedLaboratorioId && !modoEdicion && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.5 }}>
                        Laboratorio pre-seleccionado desde la tabla de configuración
                      </Typography>
                    )}
                  </FormControl>
                )}

                <TextField
                  fullWidth
                  label="Stock Mínimo"
                  type="number"
                  value={formData.stock_minimo}
                  onChange={handleChange('stock_minimo')}
                  required
                  disabled={saving}
                  sx={{ mb: 2 }}
                  InputProps={{
                    inputProps: { min: 1 }
                  }}
                  helperText="Cantidad mínima que debe mantenerse en el laboratorio (debe ser mayor a 0)"
                />

                <TextField
                  fullWidth
                  label="Punto de Reorden (opcional)"
                  type="number"
                  value={formData.punto_reorden}
                  onChange={handleChange('punto_reorden')}
                  disabled={saving}
                  sx={{ mb: 2 }}
                  InputProps={{
                    inputProps: { min: 0 }
                  }}
                  helperText="Nivel para solicitar más stock antes de llegar al mínimo"
                />

                <TextField
                  fullWidth
                  label="Stock Máximo (opcional)"
                  type="number"
                  value={formData.stock_maximo}
                  onChange={handleChange('stock_maximo')}
                  disabled={saving}
                  sx={{ mb: 2 }}
                  InputProps={{
                    inputProps: { min: 0 }
                  }}
                  helperText="Límite superior para evitar sobrestock"
                />

                <TextField
                  fullWidth
                  label="Observaciones (opcional)"
                  multiline
                  rows={2}
                  value={formData.observaciones}
                  onChange={handleChange('observaciones')}
                  disabled={saving}
                  placeholder="Ej: Uso diario en prácticas, Consumo promedio 5L/semana"
                />
              </form>
            ) : (
              <Alert severity="info" icon={<Inventory />}>
                Ya has configurado el stock mínimo para todos los laboratorios disponibles
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cerrar
        </Button>
        {(laboratoriosDisponibles.length > 0 || modoEdicion) && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
            disabled={saving || loading || formData.laboratorio_id === 0}
          >
            {saving 
              ? (modoEdicion ? 'Actualizando...' : 'Guardando...') 
              : (modoEdicion ? 'Actualizar Configuración' : 'Guardar Configuración')
            }
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

