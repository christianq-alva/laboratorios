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
  Alert
} from '@mui/material'
import { Close, Add, Delete, LocationOn, Inventory, Info } from '@mui/icons-material'
import { insumoService, type Insumo } from '../../services/insumoService'
import { laboratorioService, type Laboratorio } from '../../services/laboratorioService'


interface InsumoFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  insumo?: Insumo | null
}

interface StockInicial {
  laboratorio_id: number
  cantidad: number
  observaciones: string
}

export const InsumoForm: React.FC<InsumoFormProps> = ({
  open,
  onClose,
  onSuccess,
  insumo
}) => {

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    unidad_medida: '',
    categoria: 'Materiales' as 'Reactivos' | 'Materiales' | 'Material_Biologico',
    presentacion: '',
    condicion: 'Bueno' as 'Excelente' | 'Bueno' | 'Regular' | 'Malo',
    fecha_vencimiento: '',
    observacion: ''
  })
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [stockInicial, setStockInicial] = useState<StockInicial[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>('')

  // Cargar laboratorios
  useEffect(() => {
    const loadLaboratorios = async () => {
      try {
        const response = await laboratorioService.getAll()
        if (response.success) {
          setLaboratorios(response.data || [])
          setUserRole(response.user_role || '')
          
          // Si es jefe de laboratorio con un solo lab, agregarlo automáticamente
          if (response.user_role === 'Jefe de Laboratorio' && response.data?.length === 1) {
            setStockInicial([{
              laboratorio_id: response.data[0].id,
              cantidad: 0,
              observaciones: 'Nuevo ingreso'
            }])
          }
        }
      } catch (err) {
        console.error('Error al cargar laboratorios:', err)
        setError('Error al cargar laboratorios disponibles')
      }
    }
    
    if (open) {
      loadLaboratorios()
    }
  }, [open])

  // Resetear formulario cuando se abre/cierra
  useEffect(() => {
    if (open) {
      if (insumo) {
        // Función para formatear fechas al formato YYYY-MM-DD requerido por input[type="date"]
        const formatDateForInput = (date: string | undefined) => {
          if (!date) return ''
          try {
            return new Date(date).toISOString().split('T')[0]
          } catch (error) {
            console.warn('Error al formatear fecha:', date, error)
            return ''
          }
        }

        setFormData({
          nombre: insumo.nombre,
          descripcion: insumo.descripcion || '',
          unidad_medida: insumo.unidad_medida,
          categoria: insumo.categoria || 'Materiales',
          presentacion: insumo.presentacion || '',
          condicion: insumo.condicion || 'Bueno',
          fecha_vencimiento: formatDateForInput(insumo.fecha_vencimiento),
          observacion: insumo.observacion || ''
        })
        setStockInicial([]) // Para edición, no mostramos stock inicial
      } else {
        setFormData({
          nombre: '',
          descripcion: '',
          unidad_medida: '',
          categoria: 'Materiales',
          presentacion: '',
          condicion: 'Bueno',
          fecha_vencimiento: '',
          observacion: ''
        })
        setStockInicial([])
      }
      setError(null)
    }
  }, [open, insumo])

  // Manejar cambios en el formulario
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Agregar stock inicial
  const handleAddStock = () => {
    // Encontrar laboratorios que aún no han sido agregados
    const laboratoriosUsados = stockInicial.map(s => s.laboratorio_id)
    const laboratoriosDisponibles = laboratorios.filter(lab => !laboratoriosUsados.includes(lab.id))
    
    if (laboratoriosDisponibles.length === 0) {
      setError('Ya has agregado todos tus laboratorios disponibles')
      return
    }
    
    const siguienteLaboratorio = laboratoriosDisponibles[0]
    const tipoMovimiento = stockInicial.length === 0 ? 'Stock inicial' : 'Nuevo ingreso'
    
    setStockInicial(prev => [...prev, {
      laboratorio_id: siguienteLaboratorio.id,
      cantidad: 0,
      observaciones: tipoMovimiento
    }])
  }

  // Actualizar stock inicial
  const handleStockChange = (index: number, field: keyof StockInicial, value: any) => {
    // Validar que no se repita el laboratorio
    if (field === 'laboratorio_id') {
      const yaExiste = stockInicial.some((item, i) => i !== index && item.laboratorio_id === value)
      if (yaExiste) {
        setError('Este laboratorio ya fue agregado. Selecciona otro laboratorio.')
        return
      }
    }
    
    setStockInicial(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ))
    
    // Limpiar error si era por laboratorio duplicado
    if (field === 'laboratorio_id' && error?.includes('ya fue agregado')) {
      setError(null)
    }
  }

  // Eliminar stock inicial
  const handleRemoveStock = (index: number) => {
    setStockInicial(prev => prev.filter((_, i) => i !== index))
  }

  // Validar formulario
  const validateForm = () => {
    if (!formData.nombre.trim()) {
      setError('El nombre del insumo es requerido')
      return false
    }
    if (!formData.unidad_medida.trim()) {
      setError('La unidad de medida es requerida')
      return false
    }
    
    // Validar stock inicial
    for (const stock of stockInicial) {
      if (stock.cantidad <= 0) {
        setError('La cantidad debe ser mayor a 0')
        return false
      }
    }
    
    setError(null)
    return true
  }

  // Enviar formulario
  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const insumoData = {
        ...formData,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        unidad_medida: formData.unidad_medida.trim(),
        presentacion: formData.presentacion.trim(),
        observacion: formData.observacion.trim(),
        fecha_vencimiento: formData.fecha_vencimiento && formData.fecha_vencimiento.trim() ? formData.fecha_vencimiento : undefined,
        stock_inicial: stockInicial.length > 0 ? stockInicial : undefined
      }

      if (insumo) {
        // Actualizar insumo existente
        await insumoService.update(insumo.id, {
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion.trim(),
          unidad_medida: formData.unidad_medida.trim(),
          categoria: formData.categoria,
          presentacion: formData.presentacion.trim(),
          condicion: formData.condicion,
          fecha_vencimiento: formData.fecha_vencimiento && formData.fecha_vencimiento.trim() ? formData.fecha_vencimiento : undefined,
          observacion: formData.observacion.trim()
        })
      } else {
        await insumoService.create(insumoData)
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 1.5,
          minHeight: '70vh'
        }
      }}
    >
      <DialogTitle sx={{ pb: 2, backgroundColor: '#f8f9fa' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Inventory color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {insumo ? 'Editar Insumo' : 'Nuevo Insumo'}
            </Typography>
            {userRole === 'Jefe de Laboratorio' && laboratorios.length > 1 && (
              <Typography variant="caption" sx={{ 
                backgroundColor: 'info.light', 
                color: 'info.contrastText',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                ml: 1
              }}>
                Múltiples laboratorios
              </Typography>
            )}
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 1.5 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Información básica del insumo */}
          <Box sx={{ 
            p: 3, 
            backgroundColor: '#f0f7ff', 
            borderRadius: 1.5,
            border: '1px solid #e3f2fd'
          }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
              <Info />
              Información del Insumo
            </Typography>
            
            {userRole === 'Jefe de Laboratorio' && (
              <Alert severity="info" sx={{ mb: 2, borderRadius: 1 }}>
                <Typography variant="body2">
                  Como jefe de laboratorio, puedes agregar insumos a {laboratorios.length === 1 ? 'tu laboratorio' : 'cualquiera de tus laboratorios asignados'}.
                </Typography>
              </Alert>
            )}
          
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Nombre del Insumo"
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                required
                sx={{ minWidth: 250, flex: 1 }}
              />
              
              <TextField
                label="Unidad de Medida"
                value={formData.unidad_medida}
                onChange={(e) => handleInputChange('unidad_medida', e.target.value)}
                placeholder="ej: unidades, kg, litros, etc."
                required
                sx={{ minWidth: 200 }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl sx={{ minWidth: 250 }}>
                <InputLabel>Categoría del Insumo</InputLabel>
                <Select
                  value={formData.categoria}
                  label="Categoría del Insumo"
                  onChange={(e) => handleInputChange('categoria', e.target.value)}
                  required
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
                </Select>
              </FormControl>
            </Box>
            
            <TextField
              fullWidth
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              multiline
              rows={3}
              placeholder="Descripción opcional del insumo"
            />

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Presentación"
                value={formData.presentacion}
                onChange={(e) => handleInputChange('presentacion', e.target.value)}
                placeholder="ej: Frasco 500ml, Caja x 100 unidades"
                sx={{ minWidth: 250, flex: 1 }}
              />
              
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Condición</InputLabel>
                <Select
                  value={formData.condicion}
                  label="Condición"
                  onChange={(e) => handleInputChange('condicion', e.target.value)}
                >
                  <MenuItem value="Excelente">Excelente</MenuItem>
                  <MenuItem value="Bueno">Bueno</MenuItem>
                  <MenuItem value="Regular">Regular</MenuItem>
                  <MenuItem value="Malo">Malo</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                type="date"
                label="Fecha de Vencimiento"
                value={formData.fecha_vencimiento}
                onChange={(e) => handleInputChange('fecha_vencimiento', e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 200 }}
              />
            </Box>

            <TextField
              fullWidth
              label="Observaciones"
              value={formData.observacion}
              onChange={(e) => handleInputChange('observacion', e.target.value)}
              multiline
              rows={2}
              placeholder="Observaciones adicionales sobre el insumo..."
            />
          </Box>

          {/* Stock inicial (solo para nuevos insumos) */}
          {!insumo && (
            <Box sx={{ 
              p: 3, 
              backgroundColor: '#f0fff4', 
              borderRadius: 1.5,
              border: '1px solid #e8f5e8'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
                  <LocationOn />
                  Stock por Laboratorio
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {userRole === 'Jefe de Laboratorio' && laboratorios.length > 1 && stockInicial.length === 0 && (
                    <Button
                      variant="outlined"
                      size="small"
                      color="success"
                      onClick={() => {
                        const todosLosLabs = laboratorios.map(lab => ({
                          laboratorio_id: lab.id,
                          cantidad: 0,
                          observaciones: 'Stock inicial'
                        }))
                        setStockInicial(todosLosLabs)
                      }}
                    >
                      Agregar a Todos
                    </Button>
                  )}
                  <Button
                    startIcon={<Add />}
                    onClick={handleAddStock}
                    variant="contained"
                    size="small"
                    color="success"
                    disabled={laboratorios.length === 0 || stockInicial.length >= laboratorios.length}
                  >
                    Agregar a Laboratorio
                  </Button>
                </Box>
              </Box>
              
              {userRole === 'Jefe de Laboratorio' && laboratorios.length > 1 && (
                <Alert severity="success" sx={{ mb: 2, borderRadius: 1 }}>
                  <Typography variant="body2">
                    Puedes agregar este insumo a cualquiera de tus {laboratorios.length} laboratorios asignados.
                  </Typography>
                </Alert>
              )}
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {laboratorios.length === 1 
                  ? 'Agrega la cantidad inicial de este insumo a tu laboratorio'
                  : 'Selecciona los laboratorios donde quieres agregar este insumo y sus cantidades iniciales'
                }
              </Typography>

              {stockInicial.map((stock, index) => (
                <Box key={index} sx={{ 
                  p: 3, 
                  backgroundColor: 'white',
                  border: '1px solid #e0e0e0', 
                  borderRadius: 1.5,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  mb: 2
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'success.main' }}>
                      Laboratorio #{index + 1}
                    </Typography>
                    <IconButton 
                      onClick={() => handleRemoveStock(index)}
                      color="error"
                      size="small"
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: 'error.light',
                          transform: 'scale(1.1)'
                        }
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <FormControl sx={{ minWidth: 250, flex: 1 }}>
                      <InputLabel>Laboratorio</InputLabel>
                      <Select
                        value={stock.laboratorio_id}
                        label="Laboratorio"
                        onChange={(e) => handleStockChange(index, 'laboratorio_id', e.target.value)}
                      >
                        {laboratorios.map((lab) => (
                          <MenuItem key={lab.id} value={lab.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocationOn fontSize="small" />
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {lab.nombre}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {lab.ubicacion} {lab.escuela && `• ${lab.escuela}`}
                                </Typography>
                              </Box>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      label="Cantidad inicial"
                      type="number"
                      value={stock.cantidad}
                      onChange={(e) => handleStockChange(index, 'cantidad', parseInt(e.target.value) || 0)}
                      inputProps={{ min: 0 }}
                      sx={{ width: 150 }}
                      helperText="Unidades disponibles"
                    />

                    <TextField
                      label="Motivo del ingreso"
                      value={stock.observaciones}
                      onChange={(e) => handleStockChange(index, 'observaciones', e.target.value)}
                      sx={{ flex: 1, minWidth: 200 }}
                      placeholder="ej: Compra, Donación, Reabastecimiento"
                      helperText="Razón del ingreso de stock"
                    />
                  </Box>
                </Box>
              ))}

              {stockInicial.length === 0 && (
                <Box sx={{ 
                  p: 4, 
                  border: 2, 
                  borderColor: 'success.light', 
                  borderStyle: 'dashed',
                  borderRadius: 1.5,
                  textAlign: 'center',
                  backgroundColor: '#fafffe'
                }}>
                  <LocationOn sx={{ fontSize: 48, color: 'success.light', mb: 1 }} />
                  <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                    Agregar a Laboratorios
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Haz clic en "Agregar a Laboratorio" para asignar stock inicial a laboratorios específicos.
                    {userRole === 'Jefe de Laboratorio' && laboratorios.length > 1 && (
                      <><br />Puedes agregar el mismo insumo a múltiples laboratorios con diferentes cantidades.</>
                    )}
                  </Typography>
                  {laboratorios.length === 0 && (
                    <Alert severity="warning" sx={{ mt: 2, borderRadius: 1 }}>
                      No tienes laboratorios asignados para agregar insumos
                    </Alert>
                  )}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Guardando...' : (insumo ? 'Actualizar' : 'Crear')}
        </Button>
      </DialogActions>
    </Dialog>
  )
} 