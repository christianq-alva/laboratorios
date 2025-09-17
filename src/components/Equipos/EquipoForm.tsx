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
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material'
import { Close, Build, Add, Remove } from '@mui/icons-material'
import { equipoService, type Equipo } from '../../services/equipoService'
import { laboratorioService, type Laboratorio } from '../../services/laboratorioService'

interface EquipoFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  equipo?: Equipo | null
}

interface InventarioInicial {
  laboratorio_id: number
  cantidad_total: number
  observaciones?: string
}

export const EquipoForm: React.FC<EquipoFormProps> = ({ open, onClose, onSuccess, equipo }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    marca: '',
    modelo: '',
    numero_serie: '',
    estado: 'Operativo' as 'Operativo' | 'En Mantenimiento' | 'Fuera de Servicio'
  })
  
  const [inventarioInicial, setInventarioInicial] = useState<InventarioInicial[]>([])
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = Boolean(equipo)

  // Cargar datos iniciales
  useEffect(() => {
    if (open) {
      loadInitialData()
      if (equipo) {
        loadEquipoData(equipo)
      } else {
        resetForm()
      }
    }
  }, [open, equipo])

  const loadInitialData = async () => {
    try {
      setLoadingData(true)
      const laboratoriosResult = await laboratorioService.getAll()
      if (laboratoriosResult.success) {
        setLaboratorios(laboratoriosResult.data || [])
      }
    } catch (err) {
      console.error('Error loading initial data:', err)
      setError('Error al cargar datos iniciales')
    } finally {
      setLoadingData(false)
    }
  }

  const loadEquipoData = (equipoData: Equipo) => {
    setFormData({
      nombre: equipoData.nombre,
      descripcion: equipoData.descripcion || '',
      marca: equipoData.marca || '',
      modelo: equipoData.modelo || '',
      numero_serie: equipoData.numero_serie || '',
      estado: equipoData.estado
    })
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      marca: '',
      modelo: '',
      numero_serie: '',
      estado: 'Operativo'
    })
    setInventarioInicial([])
    setError(null)
  }

  const agregarInventario = () => {
    setInventarioInicial(prev => [...prev, {
      laboratorio_id: 0,
      cantidad_total: 1,
      observaciones: ''
    }])
  }

  const actualizarInventario = (index: number, field: keyof InventarioInicial, value: any) => {
    setInventarioInicial(prev => 
      prev.map((item, i) => i === index ? { ...item, [field]: value } : item)
    )
  }

  const eliminarInventario = (index: number) => {
    setInventarioInicial(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)

      // Validaciones
      if (!formData.nombre.trim()) {
        setError('El nombre es requerido')
        return
      }

      // Preparar datos
      const equipoData = {
        ...formData,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        marca: formData.marca.trim(),
        modelo: formData.modelo.trim(),
        numero_serie: formData.numero_serie.trim(),
        inventario_inicial: isEditing ? undefined : inventarioInicial.filter(inv => inv.laboratorio_id > 0 && inv.cantidad_total > 0)
      }

      let result
      if (isEditing && equipo) {
        result = await equipoService.update(equipo.id, equipoData)
      } else {
        result = await equipoService.create(equipoData)
      }

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.message || 'Error al guardar el equipo')
      }
    } catch (err: any) {
      console.error('Error al enviar equipo:', err)
      setError(err.message || 'Error de conexión')
    } finally {
      setLoading(false)
    }
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
                  label="Nombre del equipo"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Microscopio Óptico, Balanza Analítica..."
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
                    placeholder="Ej: Olympus, Mettler Toledo..."
                    disabled={loading}
                  />

                  <TextField
                    fullWidth
                    label="Modelo"
                    value={formData.modelo}
                    onChange={(e) => setFormData(prev => ({ ...prev, modelo: e.target.value }))}
                    placeholder="Ej: CX23, ML204..."
                    disabled={loading}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Número de serie"
                    value={formData.numero_serie}
                    onChange={(e) => setFormData(prev => ({ ...prev, numero_serie: e.target.value }))}
                    placeholder="Número de serie único"
                    disabled={loading}
                  />

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
              </Box>
            </Paper>

            {/* Inventario inicial (solo para creación) */}
            {!isEditing && (
              <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: 'secondary.main' }}>
                    Inventario Inicial (Opcional)
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={agregarInventario}
                    size="small"
                    disabled={loading}
                  >
                    Agregar Laboratorio
                  </Button>
                </Box>

                {inventarioInicial.length === 0 ? (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Puedes agregar el inventario inicial por laboratorio o hacerlo después desde el módulo de equipos.
                  </Alert>
                ) : (
                  <List>
                    {inventarioInicial.map((inv, index) => (
                      <ListItem key={index} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, mb: 1 }}>
                        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <FormControl sx={{ flex: 1 }}>
                              <InputLabel>Laboratorio</InputLabel>
                              <Select
                                value={inv.laboratorio_id}
                                label="Laboratorio"
                                onChange={(e) => actualizarInventario(index, 'laboratorio_id', e.target.value)}
                                disabled={loading}
                              >
                                <MenuItem value={0} disabled>Seleccionar laboratorio</MenuItem>
                                {laboratorios.map((lab) => (
                                  <MenuItem key={lab.id} value={lab.id}>
                                    {lab.nombre}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>

                            <TextField
                              type="number"
                              label="Cantidad"
                              value={inv.cantidad_total}
                              onChange={(e) => actualizarInventario(index, 'cantidad_total', parseInt(e.target.value) || 0)}
                              disabled={loading}
                              inputProps={{ min: 1 }}
                              sx={{ width: 120 }}
                            />

                            <IconButton
                              onClick={() => eliminarInventario(index)}
                              color="error"
                              disabled={loading}
                            >
                              <Remove />
                            </IconButton>
                          </Box>

                          <TextField
                            fullWidth
                            label="Observaciones"
                            value={inv.observaciones}
                            onChange={(e) => actualizarInventario(index, 'observaciones', e.target.value)}
                            placeholder="Observaciones adicionales..."
                            disabled={loading}
                            size="small"
                          />
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Paper>
            )}
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
          disabled={loading || !formData.nombre.trim()}
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
