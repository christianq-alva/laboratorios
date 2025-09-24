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
  TextField,
  Button
} from '@mui/material'
import { Edit, Delete, Inventory, Science, Info, Search, Clear, CloudUpload } from '@mui/icons-material'
import { insumoService, type Insumo } from '../../services/insumoService'
import { laboratorioService, type Laboratorio } from '../../services/laboratorioService'

interface InsumosTableProps {
  onEdit?: (insumo: Insumo) => void
  onDelete?: (insumo: Insumo) => void
  onCargaMasiva?: () => void
  refresh?: boolean
  onRefreshComplete?: () => void
}

export const InsumosTable: React.FC<InsumosTableProps> = ({
  onEdit,
  onDelete,
  onCargaMasiva,
  refresh,
  onRefreshComplete
}) => {
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [filteredInsumos, setFilteredInsumos] = useState<Insumo[]>([])
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [selectedLaboratorio, setSelectedLaboratorio] = useState<number | 'all'>('all')
  const [selectedCategoria, setSelectedCategoria] = useState<string>('all')
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
      setFilteredInsumos(insumosResponse.data)
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

  // Efecto para aplicar filtros
  useEffect(() => {
    let filtered = insumos

    // Filtro por búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(insumo => 
        insumo.nombre.toLowerCase().includes(searchLower) ||
        insumo.descripcion.toLowerCase().includes(searchLower) ||
        insumo.codigo.toLowerCase().includes(searchLower)
      )
    }

    // Filtro por categoría
    if (selectedCategoria !== 'all') {
      filtered = filtered.filter(insumo => insumo.categoria === selectedCategoria)
    }

    setFilteredInsumos(filtered)
  }, [insumos, searchTerm, selectedCategoria])

  // Función para obtener el color de la categoría
  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'Reactivos':
        return '#ff9800'
      case 'Materiales':
        return '#2196f3'
      case 'Material_Biologico':
        return '#4caf50'
      default:
        return '#757575'
    }
  }

  // Función para obtener el nombre de la categoría
  const getCategoriaName = (categoria: string) => {
    switch (categoria) {
      case 'Reactivos':
        return 'Reactivos'
      case 'Materiales':
        return 'Materiales'
      case 'Material_Biologico':
        return 'Material Biológico'
      default:
        return categoria
    }
  }

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

  // Función para obtener el color de la condición
  const getCondicionColor = (condicion: string) => {
    switch (condicion) {
      case 'Excelente': return 'success'
      case 'Bueno': return 'info'
      case 'Regular': return 'warning'
      case 'Malo': return 'error'
      default: return 'info'
    }
  }


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
        {/* Primera fila: Filtro de laboratorio, botón de carga masiva y resumen */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
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

            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filtrar por Categoría</InputLabel>
              <Select
                value={selectedCategoria}
                label="Filtrar por Categoría"
                onChange={(e) => setSelectedCategoria(e.target.value)}
              >
                <MenuItem value="all">Todas las Categorías</MenuItem>
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
            
            {onCargaMasiva && (
              <Tooltip title="Cargar stock masivamente desde Excel">
                <Button
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  onClick={onCargaMasiva}
                  color="primary"
                >
                  Carga Masiva
                </Button>
              </Tooltip>
            )}
          </Box>
          
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
            placeholder="Buscar insumos por código, nombre, descripción o unidad..."
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
              <TableCell sx={{ fontWeight: 600, width: '6%' }}>Código</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '12%' }}>Insumo</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '8%' }}>Categoría</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '12%' }}>Descripción</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '6%' }}>Unidad</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '10%' }}>Presentación</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '7%' }}>Condición</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '8%' }}>F. Vencimiento</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '8%' }}>Stock Disponible</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '15%' }}>Stock por Lab</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '12%' }}>Observación</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '4%' }} align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInsumos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
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
                    <Chip 
                      label={insumo.codigo || 'N/A'} 
                      size="small" 
                      color="primary"
                      variant="outlined"
                      sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Science color="primary" />
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {insumo.nombre}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getCategoriaName(insumo.categoria)}
                      size="small"
                      sx={{
                        backgroundColor: getCategoriaColor(insumo.categoria),
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}
                    />
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
                    <Typography variant="body2">
                      {insumo.presentacion || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={insumo.condicion || 'Bueno'}
                      color={getCondicionColor(insumo.condicion || 'Bueno')}
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {insumo.fecha_vencimiento ? (
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {new Date(insumo.fecha_vencimiento).toLocaleDateString('es-ES')}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Sin fecha
                      </Typography>
                    )}
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
                  <TableCell>
                    {insumo.observacion ? (
                      <Tooltip title={insumo.observacion}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            maxWidth: 150,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            cursor: 'help'
                          }}
                        >
                          {insumo.observacion}
                        </Typography>
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Sin observaciones
                      </Typography>
                    )}
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
            {selectedCategoria !== 'all' && (
              <> de categoría {getCategoriaName(selectedCategoria)}</>
            )}
          </Typography>
        </Box>
      )}
    </Box>
  )
} 