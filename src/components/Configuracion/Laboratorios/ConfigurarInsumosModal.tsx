import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  InputAdornment,
  Divider,
  Alert,
  IconButton,
  ListItemButton,
  CircularProgress,
  Paper,
} from '@mui/material'
import {
  Close,
  Science,
  Search,
  CheckCircle,
  RadioButtonUnchecked,
  Inventory,
  LocationOn,
} from '@mui/icons-material'
import { laboratorioService } from '../../../services/laboratorioService'
import { insumoService, type Insumo } from '../../../services/insumoService'
import { useApi } from '../../../hooks/useApi'

interface ConfigurarInsumosModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: (message?: string) => void
  laboratorio: {
    id: number
    nombre: string
    codigo: string
    ubicacion?: string
  } | null
}

export const ConfigurarInsumosModal: React.FC<ConfigurarInsumosModalProps> = ({
  open,
  onClose,
  onSuccess,
  laboratorio,
}) => {
  const { execute } = useApi()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInsumos, setSelectedInsumos] = useState<number[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [loadingInsumos, setLoadingInsumos] = useState(false)
  const [loadingConfigurados, setLoadingConfigurados] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar insumos disponibles y los configurados cuando se abre el modal
  useEffect(() => {
    if (open && laboratorio?.id) {
      loadInsumos()
      loadInsumosConfigurados()
    }
  }, [open, laboratorio])

  // Cargar todos los insumos disponibles
  const loadInsumos = async () => {
    if (!laboratorio?.id) return
    
    setLoadingInsumos(true)
    setError(null)
    const response = await execute(() => insumoService.getAllInsumos())
    
    if (response.error) {
      setError('Error al cargar los insumos disponibles')
      console.error('Error al cargar insumos:', response.error)
    } else if (response.data) {
      const sortedInsumos = [...(response.data.data || [])].sort((a, b) => a.nombre.localeCompare(b.nombre))
      setInsumos(sortedInsumos)
    }
    setLoadingInsumos(false)
  }

  // Cargar insumos ya configurados para este laboratorio
  const loadInsumosConfigurados = async () => {
    if (!laboratorio?.id) return
    
    setLoadingConfigurados(true)
    const response = await execute(() => laboratorioService.getInsumos(laboratorio.id))
    
    if (response.error) {
      console.error('Error al cargar insumos configurados:', response.error)
    } else if (response.data) {
      const insumosConfigurados = response.data.data || []
      setSelectedInsumos(insumosConfigurados.map((ins: Insumo) => ins.id))
    }
    setLoadingConfigurados(false)
  }

  // Filtrar insumos por búsqueda
  const filteredInsumos = insumos.filter(insumo =>
    insumo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    insumo.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Toggle selección de insumo
  const handleToggleInsumo = (insumoId: number) => {
    setSelectedInsumos(prev =>
      prev.includes(insumoId)
        ? prev.filter(id => id !== insumoId)
        : [...prev, insumoId]
    )
  }

  // Seleccionar todos los insumos filtrados
  const handleSelectAll = () => {
    if (selectedInsumos.length === filteredInsumos.length) {
      // Deseleccionar todos los filtrados
      const filteredIds = filteredInsumos.map(i => i.id)
      setSelectedInsumos(prev => prev.filter(id => !filteredIds.includes(id)))
    } else {
      // Seleccionar todos los filtrados
      const filteredIds = filteredInsumos.map(i => i.id)
      setSelectedInsumos(prev => {
        const newSelection = [...prev]
        filteredIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id)
          }
        })
        return newSelection
      })
    }
  }

  // Resetear al cerrar
  const handleClose = () => {
    setSearchTerm('')
    setSelectedInsumos([])
    setError(null)
    onClose()
  }

  // Guardar configuración
  const handleSave = async () => {
    if (!laboratorio?.id) return

    setSaving(true)
    setError(null)

    const result = await execute(() => 
      laboratorioService.configurarInsumos(laboratorio.id, selectedInsumos)
    )

    if (result.error) {
      setError(result.error)
    } else {
      onSuccess?.(result.data?.message || 'Insumos configurados correctamente')
      handleClose()
    }

    setSaving(false)
  }

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'Reactivos':
        return 'error'
      case 'Materiales':
        return 'primary'
      case 'Material_Biologico':
        return 'success'
      default:
        return 'default'
    }
  }

  // No mostrar el modal si no hay laboratorio
  if (!laboratorio) {
    return null
  }

  const insumosSeleccionadosFiltrados = filteredInsumos.filter(i => selectedInsumos.includes(i.id)).length

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Inventory color="primary" />
          <Typography variant="h6" component="span">
            Configurar Insumos
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" disabled={saving}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Información del Laboratorio (solo lectura) */}
        <Box sx={{ p: 2, pb: 1 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              bgcolor: 'grey.50',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1
            }}
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              <LocationOn color="primary" />
              <Box>
                <Typography variant="body1" fontWeight={600}>
                  {laboratorio.nombre}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {laboratorio.codigo} {laboratorio.ubicacion && `• ${laboratorio.ubicacion}`}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        <Divider />

        {/* Mensaje de error */}
        {error && (
          <Box sx={{ px: 2, pt: 2 }}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Box>
        )}

        {/* Barra de búsqueda y acciones */}
        <Box sx={{ px: 2, py: 2 }}>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar insumo por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loadingInsumos || saving}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton 
                      size="small" 
                      onClick={() => setSearchTerm('')}
                      disabled={saving}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={handleSelectAll}
              disabled={loadingInsumos || saving || filteredInsumos.length === 0}
              sx={{ minWidth: 120 }}
            >
              {insumosSeleccionadosFiltrados === filteredInsumos.length && filteredInsumos.length > 0
                ? 'Deseleccionar' 
                : 'Seleccionar'} Todo
            </Button>
          </Box>

          {/* Contador de seleccionados */}
          <Box mt={1} display="flex" justifyContent="flex-end" alignItems="center">
            <Chip 
              label={`${selectedInsumos.length} tipo${selectedInsumos.length !== 1 ? 's' : ''} de insumo seleccionado${selectedInsumos.length !== 1 ? 's' : ''}`}
              color="primary"
              size="small"
              variant={selectedInsumos.length > 0 ? 'filled' : 'outlined'}
            />
          </Box>
        </Box>

        <Divider />

        {/* Lista de insumos */}
        <List sx={{ 
          flex: 1, 
          overflow: 'auto',
          maxHeight: 'calc(80vh - 400px)',
          px: 2,
        }}>
          {loadingInsumos || loadingConfigurados ? (
            <Box py={4} display="flex" justifyContent="center">
              <CircularProgress />
            </Box>
          ) : filteredInsumos.length === 0 ? (
            <Box py={4} textAlign="center">
              <Science sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography color="text.secondary">
                {searchTerm ? 'No se encontraron insumos con ese criterio' : 'No hay insumos disponibles'}
              </Typography>
            </Box>
          ) : (
            filteredInsumos.map((insumo) => {
              const isSelected = selectedInsumos.includes(insumo.id)
              
              return (
                <ListItem
                  key={insumo.id}
                  disablePadding
                  sx={{ mb: 0.5 }}
                >
                  <ListItemButton
                    onClick={() => handleToggleInsumo(insumo.id)}
                    disabled={saving}
                    sx={{
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      bgcolor: isSelected ? 'primary.50' : 'transparent',
                      '&:hover': {
                        bgcolor: isSelected ? 'primary.100' : 'action.hover',
                      },
                    }}
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={isSelected}
                        icon={<RadioButtonUnchecked />}
                        checkedIcon={<CheckCircle />}
                        color="primary"
                        disabled={saving}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body1" fontWeight={500}>
                            {insumo.nombre}
                          </Typography>
                          <Chip
                            label={insumo.categoria?.replace('_', ' ') || 'Sin categoría'}
                            size="small"
                            color={getCategoriaColor(insumo.categoria || '')}
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          Código: {insumo.codigo || 'N/A'} • Unidad: {insumo.unidad_nombre} ({insumo.unidad_simbolo})
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              )
            })
          )}
        </List>

        {/* Información adicional */}
        <Box sx={{ px: 2, pt: 2 }}>
          <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
            Selecciona los tipos de insumo que estarán disponibles para este laboratorio.
            Los insumos seleccionados podrán ser gestionados en el inventario de este laboratorio.
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        px: 3, 
        py: 2, 
        borderTop: '1px solid',
        borderColor: 'divider',
      }}>
        <Button 
          onClick={handleClose} 
          variant="outlined"
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={saving || !laboratorio}
          startIcon={saving ? <CircularProgress size={16} /> : <CheckCircle />}
        >
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
