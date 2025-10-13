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
import { Edit, Delete, Inventory, Science, Info, Search, Clear, CloudUpload, ViewList, ViewStream } from '@mui/icons-material'
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
  const [vistaAgrupada, setVistaAgrupada] = useState(false)
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
            
            <Tooltip title={vistaAgrupada ? "Ver lotes individuales" : "Agrupar por insumo"}>
              <Button
                variant={vistaAgrupada ? "contained" : "outlined"}
                startIcon={vistaAgrupada ? <ViewList /> : <ViewStream />}
                onClick={() => setVistaAgrupada(!vistaAgrupada)}
                color="secondary"
              >
                {vistaAgrupada ? "Vista Agrupada" : "Vista Expandida"}
              </Button>
            </Tooltip>
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
              <TableCell sx={{ fontWeight: 600 }}>Código</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Insumo</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Categoría</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Unidad</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Presentación</TableCell>
              {!vistaAgrupada ? (
                <>
                  <TableCell sx={{ fontWeight: 600 }}>Lote</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Cantidad</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>F. Vencimiento</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>F. Ingreso</TableCell>
                </>
              ) : (
                <>
                  <TableCell sx={{ fontWeight: 600 }}>Total Lotes</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Stock Total</TableCell>
                </>
              )}
              <TableCell sx={{ fontWeight: 600 }} align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInsumos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={vistaAgrupada ? 8 : 10} align="center" sx={{ py: 4 }}>
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
            ) : vistaAgrupada ? (
              // Vista Agrupada: Una fila por insumo con totales
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
                      label={`${insumo.total_lotes || 0} registro${(insumo.total_lotes || 0) !== 1 ? 's' : ''}`}
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${insumo.stock_total_lotes || 0} ${insumo.unidad_medida}`}
                      size="small"
                      color="success"
                      variant="filled"
                      sx={{ fontWeight: 600 }}
                    />
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
            ) : (
              // Vista Expandida: Una fila por lote
              filteredInsumos.flatMap((insumo) => {
                // Si el insumo no tiene lotes, mostrar una fila sin información de lote
                if (!insumo.lotes || insumo.lotes.length === 0) {
                  return [(
                    <TableRow key={`${insumo.id}-no-lotes`} hover>
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
                      <TableCell colSpan={4} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          Sin lotes registrados
                        </Typography>
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
                  )]
                }
                
                // Si el insumo tiene lotes, crear una fila por cada lote
                return insumo.lotes.map((lote, loteIndex) => {
                  const diasParaVencer = lote.fecha_vencimiento 
                    ? Math.ceil((new Date(lote.fecha_vencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    : null
                  const proximoAVencer = diasParaVencer !== null && diasParaVencer <= 30 && diasParaVencer >= 0
                  
                  return (
                    <TableRow 
                      key={`${insumo.id}-lote-${lote.detalle_id || loteIndex}`} 
                      hover
                      sx={{
                        backgroundColor: proximoAVencer ? 'warning.light' : 'inherit',
                        '&:hover': {
                          backgroundColor: proximoAVencer ? 'warning.main' : 'action.hover',
                        }
                      }}
                    >
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
                        <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                          {lote.lote || 'SIN-LOTE'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${lote.cantidad} ${insumo.unidad_medida}`}
                          size="small"
                          color="primary"
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell>
                        {lote.fecha_vencimiento ? (
                          <Box>
                            <Typography variant="body2">
                              {new Date(lote.fecha_vencimiento).toLocaleDateString('es-ES', { 
                                day: '2-digit',
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </Typography>
                            {proximoAVencer && (
                              <Chip
                                label={`${diasParaVencer} días`}
                                size="small"
                                color="warning"
                                sx={{ mt: 0.5 }}
                              />
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            Sin fecha
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {lote.fecha_ingreso ? (
                          <Typography variant="body2">
                            {new Date(lote.fecha_ingreso).toLocaleDateString('es-ES', { 
                              day: '2-digit',
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            Sin fecha
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
                  )
                })
              })
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