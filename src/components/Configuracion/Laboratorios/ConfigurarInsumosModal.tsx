import React, { useState } from 'react'
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemButton,
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

interface ConfigurarInsumosModalProps {
  open: boolean
  onClose: () => void
  laboratorio: {
    id: number
    nombre: string
    codigo: string
    ubicacion?: string
  } | null
}

// Laboratorios de ejemplo para la maquetación
const LABORATORIOS_MOCK = [
  { id: 1, nombre: 'Lab. de Química Analítica', codigo: 'LAB-001', ubicacion: 'Piso 2, Ala A' },
  { id: 2, nombre: 'Lab. de Física', codigo: 'LAB-002', ubicacion: 'Piso 3, Ala B' },
  { id: 3, nombre: 'Lab. de Biología', codigo: 'LAB-003', ubicacion: 'Piso 1, Ala C' },
  { id: 4, nombre: 'Lab. de Microbiología', codigo: 'LAB-004', ubicacion: 'Piso 2, Ala D' },
  { id: 5, nombre: 'Lab. de Computación', codigo: 'LAB-005', ubicacion: 'Piso 4, Ala A' },
]

// Insumos de ejemplo para la maquetación
const INSUMOS_MOCK = [
  { id: 1, codigo: 'INS-001', nombre: 'Ácido Sulfúrico 98%', categoria: 'Reactivos', unidad: 'Litro' },
  { id: 2, codigo: 'INS-002', nombre: 'Pipeta volumétrica 25ml', categoria: 'Materiales', unidad: 'Unidad' },
  { id: 3, codigo: 'INS-003', nombre: 'Matraz aforado 100ml', categoria: 'Materiales', unidad: 'Unidad' },
  { id: 4, codigo: 'INS-004', nombre: 'Hidróxido de Sodio', categoria: 'Reactivos', unidad: 'Kilogramo' },
  { id: 5, codigo: 'INS-005', nombre: 'Probeta graduada 250ml', categoria: 'Materiales', unidad: 'Unidad' },
  { id: 6, codigo: 'INS-006', nombre: 'Etanol 96%', categoria: 'Reactivos', unidad: 'Litro' },
  { id: 7, codigo: 'INS-007', nombre: 'Vaso de precipitados 500ml', categoria: 'Materiales', unidad: 'Unidad' },
  { id: 8, codigo: 'INS-008', nombre: 'E. coli', categoria: 'Material_Biologico', unidad: 'Cultivo' },
]

export const ConfigurarInsumosModal: React.FC<ConfigurarInsumosModalProps> = ({
  open,
  onClose,
  laboratorio,
}) => {
  const [selectedLaboratorioId, setSelectedLaboratorioId] = useState<number>(laboratorio?.id || 0)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInsumos, setSelectedInsumos] = useState<number[]>([])

  // Actualizar laboratorio seleccionado cuando cambie el prop
  React.useEffect(() => {
    if (laboratorio?.id) {
      setSelectedLaboratorioId(laboratorio.id)
    }
  }, [laboratorio])

  // Filtrar insumos por búsqueda
  const filteredInsumos = INSUMOS_MOCK.filter(insumo =>
    insumo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    insumo.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Obtener laboratorio seleccionado
  const laboratorioSeleccionado = LABORATORIOS_MOCK.find(lab => lab.id === selectedLaboratorioId)

  // Toggle selección de insumo
  const handleToggleInsumo = (insumoId: number) => {
    setSelectedInsumos(prev =>
      prev.includes(insumoId)
        ? prev.filter(id => id !== insumoId)
        : [...prev, insumoId]
    )
  }

  // Seleccionar todos
  const handleSelectAll = () => {
    if (selectedInsumos.length === filteredInsumos.length) {
      setSelectedInsumos([])
    } else {
      setSelectedInsumos(filteredInsumos.map(i => i.id))
    }
  }

  // Resetear al cerrar
  const handleClose = () => {
    setSearchTerm('')
    setSelectedInsumos([])
    setSelectedLaboratorioId(0)
    onClose()
  }

  // Guardar configuración (placeholder)
  const handleSave = async () => {
    // TODO: Implementar llamada a API
    // const result = await laboratorioService.configurarInsumos(selectedLaboratorioId, selectedInsumos)
    console.log('Guardar configuración:', {
      laboratorioId: selectedLaboratorioId,
      laboratorioNombre: laboratorioSeleccionado?.nombre,
      insumosSeleccionados: selectedInsumos,
    })
    
    // TODO: Mostrar mensaje de éxito/error
    handleClose()
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
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Selector de Laboratorio */}
        <Box sx={{ p: 2, pb: 1 }}>
          <FormControl fullWidth>
            <InputLabel id="laboratorio-select-label">Seleccionar Laboratorio</InputLabel>
            <Select
              labelId="laboratorio-select-label"
              value={selectedLaboratorioId}
              label="Seleccionar Laboratorio"
              onChange={(e) => setSelectedLaboratorioId(e.target.value as number)}
              startAdornment={
                <InputAdornment position="start">
                  <LocationOn color="primary" />
                </InputAdornment>
              }
            >
              <MenuItem value={0} disabled>
                <em>Selecciona un laboratorio</em>
              </MenuItem>
              {LABORATORIOS_MOCK.map((lab) => (
                <MenuItem key={lab.id} value={lab.id}>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {lab.nombre}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {lab.codigo} • {lab.ubicacion}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Divider />

        {/* Barra de búsqueda y acciones */}
        <Box sx={{ px: 2, py: 2 }}>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar insumo por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
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
              sx={{ minWidth: 120 }}
            >
              {selectedInsumos.length === filteredInsumos.length ? 'Deseleccionar' : 'Seleccionar'} Todo
            </Button>
          </Box>

          {/* Contador de seleccionados */}
          <Box mt={1} display="flex" justifyContent="flex-end" alignItems="center">
            <Chip 
              label={`${selectedInsumos.length} tipos de insumo seleccionados`}
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
          {filteredInsumos.length === 0 ? (
            <Box py={4} textAlign="center">
              <Science sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography color="text.secondary">
                No se encontraron insumos
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
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body1" fontWeight={500}>
                          {insumo.nombre}
                        </Typography>
                        <Chip
                          label={insumo.categoria.replace('_', ' ')}
                          size="small"
                          color={getCategoriaColor(insumo.categoria)}
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        Código: {insumo.codigo} • Unidad: {insumo.unidad}
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
            Selecciona un laboratorio y los tipos de insumo que se habilitarán para él.
            Los insumos seleccionados podrán ser asignados a este laboratorio.
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        px: 3, 
        py: 2, 
        borderTop: '1px solid',
        borderColor: 'divider',
      }}>
        <Button onClick={handleClose} variant="outlined">
          Cancelar
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={selectedInsumos.length === 0 || selectedLaboratorioId === 0}
          startIcon={<CheckCircle />}
        >
          Guardar Configuración
        </Button>
      </DialogActions>
    </Dialog>
  )
}

