import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Alert,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  InputAdornment,
} from '@mui/material'
import {
  Close,
  Add,
  Remove,
  LocationOn,
  Inventory,
  TrendingUp,
  Delete,
  ShoppingCart,
  Info,
} from '@mui/icons-material'
import { insumoService, type Insumo } from '../../services/insumoService'
import { laboratorioService, type Laboratorio } from '../../services/laboratorioService'


interface ReabastecimientoModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface InsumoReabastecimiento {
  insumo_id: number
  nombre: string
  unidad_medida: string
  stock_actual: number
  cantidad_agregar: number
  observaciones: string
  lote: string
  fecha_vencimiento: string
  fecha_ingreso: string
}

export const ReabastecimientoModal: React.FC<ReabastecimientoModalProps> = ({
  open,
  onClose,
  onSuccess
}) => {

  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [insumosDisponibles, setInsumosDisponibles] = useState<Insumo[]>([])
  const [selectedLaboratorio, setSelectedLaboratorio] = useState<number>(0)
  const [insumosReabastecimiento, setInsumosReabastecimiento] = useState<InsumoReabastecimiento[]>([])
  const [motivoGeneral, setMotivoGeneral] = useState<string>('Reabastecimiento')
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>('')

  // Cargar laboratorios
  useEffect(() => {
    const loadLaboratorios = async () => {
      try {
        setLoadingData(true)
        const response = await laboratorioService.getAll()
        if (response.success) {
          setLaboratorios(response.data || [])
          setUserRole(response.user_role || '')
          
          // Si es jefe con un solo laboratorio, seleccionarlo automáticamente
          if (response.user_role === 'Jefe de Laboratorio' && response.data?.length === 1) {
            setSelectedLaboratorio(response.data[0].id)
          }
        }
      } catch (err) {
        console.error('Error al cargar laboratorios:', err)
        setError('Error al cargar laboratorios')
      } finally {
        setLoadingData(false)
      }
    }
    
    if (open) {
      loadLaboratorios()
      resetForm()
    }
  }, [open])

  // Cargar insumos cuando se selecciona laboratorio
  useEffect(() => {
    const loadInsumos = async () => {
      if (selectedLaboratorio > 0) {
        try {
          const response = await insumoService.getByLaboratorio(selectedLaboratorio)
          if (response.success) {
            setInsumosDisponibles(response.data || [])
          }
        } catch (err) {
          console.error('Error al cargar insumos:', err)
          setError('Error al cargar insumos del laboratorio')
        }
      } else {
        setInsumosDisponibles([])
      }
    }

    loadInsumos()
  }, [selectedLaboratorio])

  const resetForm = () => {
    setSelectedLaboratorio(0)
    setInsumosReabastecimiento([])
    setMotivoGeneral('Reabastecimiento')
    setError(null)
  }

  const agregarInsumo = (insumo: Insumo) => {
    const yaAgregado = insumosReabastecimiento.find(i => i.insumo_id === insumo.id)
    if (yaAgregado) {
      setError('Este insumo ya está en la lista de reabastecimiento')
      return
    }

    // Fecha actual en formato YYYY-MM-DD para los inputs de fecha
    const fechaActual = new Date().toISOString().split('T')[0]

    const nuevoInsumo: InsumoReabastecimiento = {
      insumo_id: insumo.id,
      nombre: insumo.nombre,
      unidad_medida: insumo.unidad_medida,
      stock_actual: insumo.stock_disponible || 0,
      cantidad_agregar: 0,
      observaciones: motivoGeneral,
      lote: '',
      fecha_vencimiento: '',
      fecha_ingreso: fechaActual
    }

    setInsumosReabastecimiento(prev => [...prev, nuevoInsumo])
    setError(null)
  }

  const actualizarCantidad = (insumoId: number, cantidad: number) => {
    setInsumosReabastecimiento(prev => 
      prev.map(item => 
        item.insumo_id === insumoId 
          ? { ...item, cantidad_agregar: Math.max(0, cantidad) }
          : item
      )
    )
  }

  const actualizarObservaciones = (insumoId: number, observaciones: string) => {
    setInsumosReabastecimiento(prev => 
      prev.map(item => 
        item.insumo_id === insumoId 
          ? { ...item, observaciones }
          : item
      )
    )
  }

  const actualizarLote = (insumoId: number, lote: string) => {
    setInsumosReabastecimiento(prev => 
      prev.map(item => 
        item.insumo_id === insumoId 
          ? { ...item, lote }
          : item
      )
    )
  }

  const actualizarFechaVencimiento = (insumoId: number, fecha_vencimiento: string) => {
    setInsumosReabastecimiento(prev => 
      prev.map(item => 
        item.insumo_id === insumoId 
          ? { ...item, fecha_vencimiento }
          : item
      )
    )
  }

  const actualizarFechaIngreso = (insumoId: number, fecha_ingreso: string) => {
    setInsumosReabastecimiento(prev => 
      prev.map(item => 
        item.insumo_id === insumoId 
          ? { ...item, fecha_ingreso }
          : item
      )
    )
  }

  const removerInsumo = (insumoId: number) => {
    setInsumosReabastecimiento(prev => prev.filter(item => item.insumo_id !== insumoId))
  }

  const handleSubmit = async () => {
    if (selectedLaboratorio === 0) {
      setError('Selecciona un laboratorio')
      return
    }

    if (insumosReabastecimiento.length === 0) {
      setError('Agrega al menos un insumo para reabastecer')
      return
    }

    const insumosConCantidad = insumosReabastecimiento.filter(i => i.cantidad_agregar > 0)
    if (insumosConCantidad.length === 0) {
      setError('Agrega cantidades mayores a 0 para los insumos')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Preparar datos para el backend
      const reabastecimientoData = {
        laboratorio_id: selectedLaboratorio,
        motivo_general: motivoGeneral.trim() || 'Reabastecimiento',
        insumos: insumosConCantidad.map(insumo => ({
          insumo_id: insumo.insumo_id,
          cantidad: insumo.cantidad_agregar,
          observaciones: insumo.observaciones.trim() || motivoGeneral.trim(),
          lote: insumo.lote.trim() || null,
          fecha_vencimiento: insumo.fecha_vencimiento || null,
          fecha_ingreso: insumo.fecha_ingreso || null
        }))
      }

      console.log('📦 Enviando reabastecimiento:', reabastecimientoData)
      console.log('📊 Validaciones:', {
        laboratorio_seleccionado: selectedLaboratorio > 0,
        insumos_con_cantidad: insumosConCantidad.length,
        motivo_valido: motivoGeneral.trim().length > 0
      })

      const result = await insumoService.reabastecimiento(reabastecimientoData)
      
      console.log('✅ Resultado del backend:', result)
      
      if (result.success) {
        console.log('🎉 Reabastecimiento exitoso')
        onSuccess()
        onClose()
      } else {
        console.error('❌ Error del backend:', result.message)
        setError(result.message || 'Error al procesar reabastecimiento')
      }
    } catch (err: any) {
      console.error('❌ Error completo:', err)
      console.error('❌ Respuesta del servidor:', err.response?.data)
      
      let errorMessage = 'Error al procesar reabastecimiento'
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = () => {
    return (
      selectedLaboratorio > 0 &&
      insumosReabastecimiento.length > 0 &&
      insumosReabastecimiento.some(i => i.cantidad_agregar > 0) &&
      !loading
    )
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
          height: '85vh',
          maxHeight: '85vh'
        }
      }}
    >
      <DialogTitle sx={{ pb: 2, backgroundColor: '#f0fff4' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUp color="success" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Reabastecimiento de Insumos
            </Typography>
            {userRole === 'Jefe de Laboratorio' && laboratorios.length > 1 && (
              <Chip 
                label={`${laboratorios.length} laboratorios`}
                size="small"
                color="success"
                variant="outlined"
              />
            )}
          </Box>
          <IconButton onClick={onClose} size="small" disabled={loading}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, height: 'calc(85vh - 140px)' }}>
        {loadingData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Inventory sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Cargando datos...
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', height: '100%' }}>
            {/* Panel izquierdo - Selección */}
            <Box sx={{ 
              flex: 1, 
              p: 3, 
              borderRight: '1px solid #e0e0e0',
              display: 'flex',
              flexDirection: 'column',
              gap: 3
            }}>
              {error && (
                <Alert severity="error" sx={{ borderRadius: 1.5 }}>
                  {error}
                </Alert>
              )}

              {/* Selector de laboratorio */}
              <Paper sx={{ p: 3, borderRadius: 1.5, backgroundColor: '#f0f7ff' }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                  <LocationOn />
                  Laboratorio de Destino
                </Typography>
                
                <FormControl fullWidth>
                  <InputLabel>Seleccionar laboratorio</InputLabel>
                  <Select
                    value={selectedLaboratorio}
                    label="Seleccionar laboratorio"
                    onChange={(e) => {
                      setSelectedLaboratorio(e.target.value as number)
                      setInsumosReabastecimiento([]) // Limpiar insumos al cambiar laboratorio
                    }}
                    disabled={loading}
                  >
                    <MenuItem value={0} disabled>
                      Selecciona un laboratorio
                    </MenuItem>
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

                {selectedLaboratorio > 0 && (
                  <Alert severity="info" sx={{ mt: 2, borderRadius: 1 }}>
                    <Typography variant="body2">
                      Laboratorio seleccionado: <strong>{laboratorios.find(l => l.id === selectedLaboratorio)?.nombre}</strong>
                    </Typography>
                  </Alert>
                )}
              </Paper>

              {/* Motivo general */}
              <Paper sx={{ p: 3, borderRadius: 1.5, backgroundColor: '#fff8e1' }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'warning.main' }}>
                  <Info />
                  Motivo del Reabastecimiento
                </Typography>
                
                <TextField
                  fullWidth
                  label="Motivo general"
                  value={motivoGeneral}
                  onChange={(e) => setMotivoGeneral(e.target.value)}
                  placeholder="ej: Compra mensual, Donación, Reposición de stock"
                  helperText="Este motivo se aplicará por defecto a todos los insumos"
                />
              </Paper>

              {/* Insumos disponibles */}
              {selectedLaboratorio > 0 && (
                <Paper sx={{ 
                  flex: 1,
                  borderRadius: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}>
                  <Box sx={{ p: 2, backgroundColor: '#f0f7ff', borderBottom: '1px solid #e0e0e0' }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                      <Inventory />
                      Insumos Disponibles ({insumosDisponibles.length})
                    </Typography>
                  </Box>
                  
                  <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
                    {insumosDisponibles.length > 0 ? (
                      <List dense>
                        {insumosDisponibles.map((insumo) => {
                          const yaAgregado = insumosReabastecimiento.some(i => i.insumo_id === insumo.id)
                          const stockColor = (insumo.stock_disponible || 0) === 0 ? 'error' : 
                                           (insumo.stock_disponible || 0) < 10 ? 'warning' : 'success'
                          
                          return (
                            <ListItem
                              key={insumo.id}
                              sx={{
                                mb: 1,
                                backgroundColor: yaAgregado ? '#f5f5f5' : 'white',
                                borderRadius: 1,
                                border: '1px solid #e0e0e0',
                                opacity: yaAgregado ? 0.6 : 1,
                                cursor: yaAgregado ? 'not-allowed' : 'pointer',
                                '&:hover': {
                                  backgroundColor: yaAgregado ? '#f5f5f5' : '#f0f7ff',
                                  transform: yaAgregado ? 'none' : 'translateY(-1px)',
                                  boxShadow: yaAgregado ? 'none' : '0 2px 8px rgba(0,0,0,0.1)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                              onClick={() => !yaAgregado && agregarInsumo(insumo)}
                            >
                              <ListItemText
                                primary={
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {insumo.nombre}
                                  </Typography>
                                }
                                secondary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary">
                                      Stock actual:
                                    </Typography>
                                    <Chip 
                                      label={`${insumo.stock_disponible || 0} ${insumo.unidad_medida}`}
                                      size="small"
                                      color={stockColor}
                                      variant="outlined"
                                    />
                                  </Box>
                                }
                              />
                              <ListItemSecondaryAction>
                                <IconButton
                                  edge="end"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (!yaAgregado) agregarInsumo(insumo)
                                  }}
                                  disabled={yaAgregado}
                                  color="primary"
                                  size="small"
                                >
                                  <Add />
                                </IconButton>
                              </ListItemSecondaryAction>
                            </ListItem>
                          )
                        })}
                      </List>
                    ) : (
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        height: '100%',
                        p: 3
                      }}>
                        <Inventory sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          Sin insumos
                        </Typography>
                        <Typography variant="body2" color="text.secondary" textAlign="center">
                          {selectedLaboratorio === 0 
                            ? 'Selecciona un laboratorio para ver sus insumos'
                            : 'Este laboratorio no tiene insumos registrados'
                          }
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              )}
            </Box>

            {/* Panel derecho - Insumos seleccionados */}
            <Box sx={{ 
              flex: 1, 
              backgroundColor: '#f8f9fa',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Box sx={{ p: 3, backgroundColor: '#f0fff4', borderBottom: '1px solid #e0e0e0' }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
                  <ShoppingCart />
                  Reabastecimiento ({insumosReabastecimiento.length})
                </Typography>
              </Box>
              
              <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                {insumosReabastecimiento.length === 0 ? (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '100%',
                    p: 3
                  }}>
                    <ShoppingCart sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Lista vacía
                    </Typography>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      Selecciona insumos de la izquierda para agregar al reabastecimiento
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {insumosReabastecimiento.map((insumo) => (
                      <Paper 
                        key={insumo.insumo_id}
                        sx={{ 
                          p: 2, 
                          borderRadius: 1.5,
                          border: '1px solid #e8f5e8'
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {insumo.nombre}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Stock actual: {insumo.stock_actual} {insumo.unidad_medida}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removerInsumo(insumo.insumo_id)}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', mb: 2 }}>
                          <TextField
                            label="Cantidad a agregar"
                            type="number"
                            value={insumo.cantidad_agregar}
                            onChange={(e) => actualizarCantidad(insumo.insumo_id, parseInt(e.target.value) || 0)}
                            inputProps={{ min: 0 }}
                            size="small"
                            sx={{ width: 150 }}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <Typography variant="caption" color="text.secondary">
                                    {insumo.unidad_medida}
                                  </Typography>
                                </InputAdornment>
                              )
                            }}
                          />
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => actualizarCantidad(insumo.insumo_id, insumo.cantidad_agregar - 1)}
                              disabled={insumo.cantidad_agregar <= 0}
                            >
                              <Remove />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => actualizarCantidad(insumo.insumo_id, insumo.cantidad_agregar + 1)}
                              color="primary"
                            >
                              <Add />
                            </IconButton>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                          <TextField
                            label="Lote"
                            value={insumo.lote}
                            onChange={(e) => actualizarLote(insumo.insumo_id, e.target.value)}
                            size="small"
                            sx={{ flex: 1 }}
                            placeholder="ej: LOTE-2024-001"
                          />
                          
                          <TextField
                            label="Fecha de Ingreso"
                            type="date"
                            value={insumo.fecha_ingreso}
                            onChange={(e) => actualizarFechaIngreso(insumo.insumo_id, e.target.value)}
                            size="small"
                            sx={{ flex: 1 }}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                          <TextField
                            label="Fecha de Vencimiento"
                            type="date"
                            value={insumo.fecha_vencimiento}
                            onChange={(e) => actualizarFechaVencimiento(insumo.insumo_id, e.target.value)}
                            size="small"
                            sx={{ flex: 1 }}
                            InputLabelProps={{ shrink: true }}
                            helperText="Opcional"
                          />
                        </Box>
                        
                        <TextField
                          fullWidth
                          label="Observaciones específicas"
                          value={insumo.observaciones}
                          onChange={(e) => actualizarObservaciones(insumo.insumo_id, e.target.value)}
                          size="small"
                          placeholder="Motivo específico para este insumo"
                        />
                        
                        {insumo.cantidad_agregar > 0 && (
                          <Box sx={{ mt: 1, p: 1, backgroundColor: '#e8f5e8', borderRadius: 1 }}>
                            <Typography variant="caption" color="success.dark">
                              Nuevo stock: {insumo.stock_actual + insumo.cantidad_agregar} {insumo.unidad_medida}
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>

              {/* Resumen */}
              {insumosReabastecimiento.length > 0 && (
                <Box sx={{ p: 2, backgroundColor: '#fff8e1', borderTop: '1px solid #e0e0e0' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'warning.main' }}>
                    📊 Resumen del Reabastecimiento
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {insumosReabastecimiento.filter(i => i.cantidad_agregar > 0).length} insumos • 
                    Total unidades: {insumosReabastecimiento.reduce((sum, i) => sum + i.cantidad_agregar, 0)}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
        >
          Cancelar
        </Button>
        
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit()}
          variant="contained"
          color="success"
          startIcon={loading ? undefined : <TrendingUp />}
        >
          {loading ? 'Procesando...' : 'Procesar Reabastecimiento'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
