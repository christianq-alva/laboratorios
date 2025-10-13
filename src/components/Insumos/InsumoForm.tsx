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
import { Close, Inventory, Info } from '@mui/icons-material'
import { insumoService, type Insumo } from '../../services/insumoService'


interface InsumoFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  insumo?: Insumo | null
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
    observacion: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Resetear formulario cuando se abre/cierra
  useEffect(() => {
    if (open) {
      if (insumo) {
        setFormData({
          nombre: insumo.nombre,
          descripcion: insumo.descripcion || '',
          unidad_medida: insumo.unidad_medida,
          categoria: insumo.categoria || 'Materiales',
          presentacion: insumo.presentacion || '',
          condicion: insumo.condicion || 'Bueno',
          observacion: insumo.observacion || ''
        })
      } else {
        setFormData({
          nombre: '',
          descripcion: '',
          unidad_medida: '',
          categoria: 'Materiales',
          presentacion: '',
          condicion: 'Bueno',
          observacion: ''
        })
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
    
    setError(null)
    return true
  }

  // Enviar formulario
  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const insumoData = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        unidad_medida: formData.unidad_medida.trim(),
        categoria: formData.categoria,
        presentacion: formData.presentacion.trim(),
        condicion: formData.condicion,
        observacion: formData.observacion.trim()
      }

      if (insumo) {
        // Actualizar insumo existente
        await insumoService.update(insumo.id, insumoData)
      } else {
        // Crear nuevo insumo (solo el maestro, sin stock)
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
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 1.5
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
            border: '1px solid #e3f2fd',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <Typography variant="h6" gutterBottom sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1, 
              color: 'primary.main',
              mb: 2,
              fontWeight: 600
            }}>
              <Info />
              Información del Insumo
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2, borderRadius: 1.5 }}>
              <Typography variant="body2">
                Crea el insumo maestro. Los datos de stock, lote y fecha de vencimiento se registrarán al agregar un movimiento de entrada en el inventario.
              </Typography>
            </Alert>
          
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
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

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
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
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
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
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 3, gap: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Guardando...' : (insumo ? 'Actualizar' : 'Crear Insumo')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
