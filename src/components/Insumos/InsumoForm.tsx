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
  Divider
} from '@mui/material'
import { Close, Add, Delete } from '@mui/icons-material'
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
    unidad_medida: ''
  })
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [stockInicial, setStockInicial] = useState<StockInicial[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar laboratorios
  useEffect(() => {
    const loadLaboratorios = async () => {
      try {
        const response = await laboratorioService.getAll()
        setLaboratorios(response.data)
      } catch (err) {
        console.error('Error al cargar laboratorios:', err)
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
        setFormData({
          nombre: insumo.nombre,
          descripcion: insumo.descripcion || '',
          unidad_medida: insumo.unidad_medida
        })
        setStockInicial([]) // Para edición, no mostramos stock inicial
      } else {
        setFormData({
          nombre: '',
          descripcion: '',
          unidad_medida: ''
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
    setStockInicial(prev => [...prev, {
      laboratorio_id: laboratorios[0]?.id || 0,
      cantidad: 0,
      observaciones: 'Stock inicial'
    }])
  }

  // Actualizar stock inicial
  const handleStockChange = (index: number, field: keyof StockInicial, value: any) => {
    setStockInicial(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ))
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
        stock_inicial: stockInicial.length > 0 ? stockInicial : undefined
      }

      if (insumo) {
        // TODO: Implementar actualización cuando esté disponible
        throw new Error('La edición de insumos no está implementada aún')
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {insumo ? 'Editar Insumo' : 'Nuevo Insumo'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Información básica del insumo */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Información del Insumo
            </Typography>
          </Box>
          
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
          
          <Box>
            <TextField
              fullWidth
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              multiline
              rows={3}
              placeholder="Descripción opcional del insumo"
            />
          </Box>

          {/* Stock inicial (solo para nuevos insumos) */}
          {!insumo && (
            <>
              <Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Stock Inicial por Laboratorio
                  </Typography>
                  <Button
                    startIcon={<Add />}
                    onClick={handleAddStock}
                    variant="outlined"
                    size="small"
                  >
                    Agregar Stock
                  </Button>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Opcional: Puedes asignar stock inicial a laboratorios específicos
                </Typography>
              </Box>

              {stockInicial.map((stock, index) => (
                <Box key={index} sx={{ 
                  p: 2, 
                  border: 1, 
                  borderColor: 'divider', 
                  borderRadius: 1,
                  display: 'flex',
                  gap: 2,
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}>
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Laboratorio</InputLabel>
                    <Select
                      value={stock.laboratorio_id}
                      label="Laboratorio"
                      onChange={(e) => handleStockChange(index, 'laboratorio_id', e.target.value)}
                    >
                      {laboratorios.map((lab) => (
                        <MenuItem key={lab.id} value={lab.id}>
                          {lab.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    label="Cantidad"
                    type="number"
                    value={stock.cantidad}
                    onChange={(e) => handleStockChange(index, 'cantidad', parseInt(e.target.value) || 0)}
                    sx={{ width: 120 }}
                  />

                  <TextField
                    label="Observaciones"
                    value={stock.observaciones}
                    onChange={(e) => handleStockChange(index, 'observaciones', e.target.value)}
                    sx={{ flexGrow: 1, minWidth: 200 }}
                  />

                  <IconButton 
                    onClick={() => handleRemoveStock(index)}
                    color="error"
                    size="small"
                  >
                    <Delete />
                  </IconButton>
                </Box>
              ))}

              {stockInicial.length === 0 && (
                <Box sx={{ 
                  p: 3, 
                  border: 2, 
                  borderColor: 'grey.200', 
                  borderStyle: 'dashed',
                  borderRadius: 1,
                  textAlign: 'center'
                }}>
                  <Typography variant="body2" color="text.secondary">
                    No se ha agregado stock inicial. El insumo se creará sin stock en ningún laboratorio.
                  </Typography>
                </Box>
              )}
            </>
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