import React, { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  TextField
} from '@mui/material'
import { Edit, Delete, Inventory, Science, Info, Search, Clear } from '@mui/icons-material'
import { insumoService, type Insumo } from '../../services/insumoService'
import { laboratorioService, type Laboratorio } from '../../services/laboratorioService'

interface InsumosTableProps {
  onEdit?: (insumo: Insumo) => void
  onDelete?: (insumo: Insumo) => void
  refresh?: boolean
  onRefreshComplete?: () => void
}

export const InsumosTable: React.FC<InsumosTableProps> = ({
  onEdit,
  onDelete,
  refresh,
  onRefreshComplete
}) => {
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [selectedLaboratorio, setSelectedLaboratorio] = useState<number | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar datos
  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Cargar laboratorios para el filtro
      const laboratoriosResponse = await laboratorioService.getAll()
      setLaboratorios(laboratoriosResponse.data)

      // Cargar insumos
      let insumosResponse
      if (selectedLaboratorio === 'all') {
        insumosResponse = await insumoService.getAll()
      } else {
        insumosResponse = await insumoService.getByLaboratorio(selectedLaboratorio)
      }
      
      setInsumos(insumosResponse.data)
    } catch (err: any) {
      setError(err.message)
      console.error('Error al cargar datos:', err)
    } finally {
      setLoading(false)
      onRefreshComplete?.()
    }
  }

  // Efecto para cargar datos iniciales
  useEffect(() => {
    loadData()
  }, [])

  // Efecto para refrescar cuando cambia el refresh prop
  useEffect(() => {
    if (refresh !== undefined) {
      loadData()
    }
  }, [refresh])

  // Efecto para recargar cuando cambia el laboratorio seleccionado
  useEffect(() => {
    if (laboratorios.length > 0) {
      loadData()
    }
  }, [selectedLaboratorio])

  // Función para formatear el stock por laboratorio
  const formatStockPorLaboratorio = (stockString?: string, unidadMedida?: string) => {
    if (!stockString) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Sin stock registrado
          </Typography>
        </Box>
      )
    }
    
    const stocks = stockString.split('; ').map(item => {
      const [lab, cantidad] = item.split(':')
      return { laboratorio: lab, cantidad: parseInt(cantidad) || 0 }
    })
    
    // Ordenar por cantidad (mayor a menor)
    stocks.sort((a, b) => b.cantidad - a.cantidad)
    
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {stocks.map((stock, index) => (
          <Box 
            key={index} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              p: 1,
              borderRadius: 1,
              bgcolor: 'grey.50',
              border: 1,
              borderColor: 'grey.200'
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
              {stock.laboratorio}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={`${stock.cantidad} ${unidadMedida || ''}`}
                size="small"
                color={getStockColor(stock.cantidad)}
                variant="filled"
                sx={{ 
                  minWidth: 'auto',
                  '& .MuiChip-label': { px: 1 }
                }}
              />
              {stock.cantidad === 0 && (
                <Typography variant="caption" color="error" sx={{ fontWeight: 600 }}>
                  AGOTADO
                </Typography>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    )
  }

  // Función para obtener el color del chip según el stock
  const getStockColor = (stock: number) => {
    if (stock === 0) return 'error'
    if (stock < 10) return 'warning'
    return 'success'
  }

  // Función para filtrar insumos por término de búsqueda
  const filteredInsumos = insumos.filter(insumo => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      insumo.nombre.toLowerCase().includes(searchLower) ||
      (insumo.descripcion && insumo.descripcion.toLowerCase().includes(searchLower)) ||
      insumo.unidad_medida.toLowerCase().includes(searchLower)
    )
  })

  // Función para limpiar búsqueda
  const handleClearSearch = () => {
    setSearchTerm('')
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    )
  }

  return (
    <Box>
      {/* Filtros y búsqueda */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        {/* Primera fila: Filtro de laboratorio y resumen */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filtrar por Laboratorio</InputLabel>
            <Select
              value={selectedLaboratorio}
              label="Filtrar por Laboratorio"
              onChange={(e) => setSelectedLaboratorio(e.target.value as number | 'all')}
            >
              <MenuItem value="all">Todos los Laboratorios</MenuItem>
              {laboratorios.map((lab) => (
                <MenuItem key={lab.id} value={lab.id}>
                  {lab.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Resumen de stock */}
          {insumos.length > 0 && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Chip 
                label={`${filteredInsumos.length} de ${insumos.length} insumo${insumos.length !== 1 ? 's' : ''}`}
                color="primary"
                variant="outlined"
                size="small"
              />
              <Chip 
                label={`${insumos.filter(i => i.stock_disponible === 0).length} agotado${insumos.filter(i => i.stock_disponible === 0).length !== 1 ? 's' : ''}`}
                color="error"
                variant="outlined"
                size="small"
              />
              <Chip 
                label={`${insumos.filter(i => i.stock_disponible && i.stock_disponible > 0 && i.stock_disponible < 10).length} bajo stock`}
                color="warning"
                variant="outlined"
                size="small"
              />
              <Tooltip title="Verde: Stock suficiente | Amarillo: Stock bajo | Rojo: Agotado">
                <IconButton size="small" color="default">
                  <Info fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>

        {/* Segunda fila: Barra de búsqueda */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            placeholder="Buscar insumos por nombre, descripción o unidad..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <Search sx={{ color: 'text.secondary', mr: 1 }} />
              ),
              endAdornment: searchTerm && (
                <IconButton
                  size="small"
                  onClick={handleClearSearch}
                  sx={{ color: 'text.secondary' }}
                >
                  <Clear />
                </IconButton>
              )
            }}
          />
          {searchTerm && (
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              {filteredInsumos.length} resultado{filteredInsumos.length !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Tabla de insumos */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600, width: '20%' }}>Insumo</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '25%' }}>Descripción</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '10%' }}>Unidad</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '15%' }}>Stock Disponible</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '25%' }}>Stock por Laboratorio</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '5%' }} align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInsumos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Inventory sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No hay insumos registrados
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {searchTerm 
                        ? `No se encontraron insumos que coincidan con "${searchTerm}"`
                        : selectedLaboratorio === 'all' 
                          ? 'No se han registrado insumos en el sistema'
                          : 'No hay insumos registrados en este laboratorio'
                      }
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredInsumos.map((insumo) => (
                <TableRow key={insumo.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Science color="primary" />
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {insumo.nombre}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {insumo.descripcion || 'Sin descripción'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={insumo.unidad_medida} 
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {insumo.stock_disponible !== undefined ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label={`${insumo.stock_disponible} ${insumo.unidad_medida}`}
                          color={getStockColor(insumo.stock_disponible)}
                          variant="filled"
                          size="small"
                          sx={{ 
                            minWidth: 'auto',
                            '& .MuiChip-label': { px: 1.5 }
                          }}
                        />
                        {insumo.stock_disponible === 0 && (
                          <Typography variant="caption" color="error" sx={{ fontWeight: 600 }}>
                            AGOTADO
                          </Typography>
                        )}
                        {insumo.stock_disponible > 0 && insumo.stock_disponible < 10 && (
                          <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
                            BAJO
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        No disponible
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatStockPorLaboratorio(insumo.stock_por_laboratorio, insumo.unidad_medida)}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      {onEdit && (
                        <Tooltip title="Editar insumo">
                          <IconButton 
                            size="small" 
                            onClick={() => onEdit(insumo)}
                            color="primary"
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                      )}
                      {onDelete && (
                        <Tooltip title="Eliminar insumo">
                          <IconButton 
                            size="small" 
                            onClick={() => onDelete(insumo)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Información adicional */}
      {filteredInsumos.length > 0 && (
        <Box sx={{ p: 2, backgroundColor: 'grey.50', borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            Mostrando {filteredInsumos.length} de {insumos.length} insumo{insumos.length !== 1 ? 's' : ''}
            {selectedLaboratorio !== 'all' && laboratorios.length > 0 && (
              <> en {laboratorios.find(l => l.id === selectedLaboratorio)?.nombre}</>
            )}
            {searchTerm && (
              <> que coinciden con "{searchTerm}"</>
            )}
          </Typography>
        </Box>
      )}
    </Box>
  )
} 