import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material'
import {
  Close,
  Inventory,
  Search,
  Clear,
  Science,
  Biotech,
  Category,
  Edit,
  Add
} from '@mui/icons-material'
import { insumoService, type Insumo } from '../../services/insumoService'

interface CatalogoInsumosModalProps {
  open: boolean
  onClose: () => void
  onNewInsumo: () => void
  onEditInsumo: (insumo: Insumo) => void
  refresh?: boolean
}

export const CatalogoInsumosModal: React.FC<CatalogoInsumosModalProps> = ({
  open,
  onClose,
  onNewInsumo,
  onEditInsumo,
  refresh
}) => {
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [filteredInsumos, setFilteredInsumos] = useState<Insumo[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar catálogo de insumos
  useEffect(() => {
    if (open) {
      loadCatalogo()
    }
  }, [open])

  // Recargar cuando cambia refresh
  useEffect(() => {
    if (open && refresh !== undefined) {
      loadCatalogo()
    }
  }, [refresh])

  const loadCatalogo = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await insumoService.getAll()
      if (response.success) {
        setInsumos(response.data || [])
        setFilteredInsumos(response.data || [])
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar el catálogo')
    } finally {
      setLoading(false)
    }
  }

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...insumos]

    // Filtrar por categoría
    if (selectedCategoria !== 'all') {
      filtered = filtered.filter(i => i.categoria === selectedCategoria)
    }

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(i =>
        i.nombre.toLowerCase().includes(term) ||
        i.codigo?.toLowerCase().includes(term) ||
        i.descripcion?.toLowerCase().includes(term)
      )
    }

    setFilteredInsumos(filtered)
  }, [searchTerm, selectedCategoria, insumos])

  const handleClearSearch = () => {
    setSearchTerm('')
  }

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'Reactivos':
        return '#ff9800'
      case 'Materiales':
        return '#2196f3'
      case 'Material_Biologico':
        return '#4caf50'
      default:
        return '#9e9e9e'
    }
  }

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case 'Reactivos':
        return <Science fontSize="small" />
      case 'Material_Biologico':
        return <Biotech fontSize="small" />
      default:
        return <Category fontSize="small" />
    }
  }

  const getCondicionColor = (condicion: string) => {
    switch (condicion?.toLowerCase()) {
      case 'excelente':
        return 'success'
      case 'bueno':
        return 'info'
      case 'regular':
        return 'warning'
      case 'malo':
        return 'error'
      default:
        return 'default'
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
          height: '85vh',
          maxHeight: '85vh'
        }
      }}
    >
      <DialogTitle sx={{ pb: 2, backgroundColor: '#f0f7ff' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Inventory color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Catálogo de Insumos
            </Typography>
            <Chip
              label={`${filteredInsumos.length} insumos`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={onNewInsumo}
              size="small"
              sx={{ borderRadius: 2 }}
            >
              Nuevo Insumo
            </Button>
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>
            {error}
          </Alert>
        )}

        {/* Filtros */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Buscar por nombre, código o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}>
                    <Clear />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label="Todas"
              onClick={() => setSelectedCategoria('all')}
              color={selectedCategoria === 'all' ? 'primary' : 'default'}
              variant={selectedCategoria === 'all' ? 'filled' : 'outlined'}
              sx={{ cursor: 'pointer' }}
            />
            <Chip
              label="Reactivos"
              onClick={() => setSelectedCategoria('Reactivos')}
              color={selectedCategoria === 'Reactivos' ? 'warning' : 'default'}
              variant={selectedCategoria === 'Reactivos' ? 'filled' : 'outlined'}
              icon={<Science />}
              sx={{ cursor: 'pointer' }}
            />
            <Chip
              label="Materiales"
              onClick={() => setSelectedCategoria('Materiales')}
              color={selectedCategoria === 'Materiales' ? 'info' : 'default'}
              variant={selectedCategoria === 'Materiales' ? 'filled' : 'outlined'}
              icon={<Category />}
              sx={{ cursor: 'pointer' }}
            />
            <Chip
              label="Material Biológico"
              onClick={() => setSelectedCategoria('Material_Biologico')}
              color={selectedCategoria === 'Material_Biologico' ? 'success' : 'default'}
              variant={selectedCategoria === 'Material_Biologico' ? 'filled' : 'outlined'}
              icon={<Biotech />}
              sx={{ cursor: 'pointer' }}
            />
          </Box>
        </Box>

        {/* Tabla */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredInsumos.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Inventory sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No se encontraron insumos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm || selectedCategoria !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'No hay insumos registrados en el catálogo'}
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 1.5, maxHeight: 'calc(85vh - 280px)' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: '#f5f5f5' }}>Código</TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: '#f5f5f5' }}>Nombre</TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: '#f5f5f5' }}>Categoría</TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: '#f5f5f5' }}>Unidad</TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: '#f5f5f5' }}>Presentación</TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: '#f5f5f5' }}>Condición</TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: '#f5f5f5' }}>Descripción</TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: '#f5f5f5', width: 100 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInsumos.map((insumo) => (
                  <TableRow
                    key={insumo.id}
                    sx={{
                      '&:hover': { backgroundColor: '#f5f5f5' },
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                        {insumo.codigo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {insumo.nombre}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={insumo.categoria?.replace('_', ' ')}
                        size="small"
                        icon={getCategoriaIcon(insumo.categoria)}
                        sx={{
                          backgroundColor: getCategoriaColor(insumo.categoria),
                          color: 'white',
                          fontWeight: 500
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{insumo.unidad_medida}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {insumo.presentacion || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={insumo.condicion || 'Bueno'}
                        size="small"
                        color={getCondicionColor(insumo.condicion || 'Bueno')}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={insumo.descripcion || ''} placement="top">
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {insumo.descripcion || '-'}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Editar insumo">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => onEditInsumo(insumo)}
                          sx={{
                            '&:hover': {
                              backgroundColor: 'primary.light',
                              transform: 'scale(1.1)'
                            },
                            transition: 'all 0.2s'
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="contained">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

