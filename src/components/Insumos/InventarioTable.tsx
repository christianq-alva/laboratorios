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
  TablePagination,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material'
import { Inventory, Science, Search, Clear, Visibility, MoreVert, ListAlt } from '@mui/icons-material'
import { inventarioService, type InsumoSaldo } from '../../services/inventarioService'
import { laboratorioService, type Laboratorio } from '../../services/laboratorioService'
import { DetalleMovimientosModal } from './DetalleMovimientosModal'
import { DetalleLotesModal } from './DetalleLotesModal'

interface InventarioTableProps {
  refresh?: boolean
}

export const InventarioTable: React.FC<InventarioTableProps> = ({
  refresh,
}) => {
  const [insumos, setInsumos] = useState<InsumoSaldo[]>([])
  const [filteredInsumos, setFilteredInsumos] = useState<InsumoSaldo[]>([])
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [selectedLaboratorio, setSelectedLaboratorio] = useState<number | 'all'>('all')
  const [selectedCategoria, setSelectedCategoria] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [detalleModalOpen, setDetalleModalOpen] = useState(false)
  const [detalleLotesModalOpen, setDetalleLotesModalOpen] = useState(false)
  const [insumoSeleccionado, setInsumoSeleccionado] = useState<InsumoSaldo | null>(null)
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [insumoMenuSeleccionado, setInsumoMenuSeleccionado] = useState<InsumoSaldo | null>(null)

  // Cargar datos
  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Cargar laboratorios para el filtro
      const laboratoriosResponse = await laboratorioService.getAll()
      setLaboratorios(laboratoriosResponse.data || [])

      // Cargar insumos
      let insumosResponse
      if (selectedLaboratorio === 'all') {
        insumosResponse = await inventarioService.getAllWithStock()
      } else {
        insumosResponse = await inventarioService.getWithStock(selectedLaboratorio)
      }

      setInsumos(insumosResponse.data)
    } catch (err: any) {
      setError(err.message)
      console.error('Error al cargar datos:', err)
    } finally {
      setLoading(false)
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
        //insumo.descripcion.toLowerCase().includes(searchLower) ||
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
    setPage(0)
  }

  // Funciones para manejar la paginación
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  // Calcular los insumos a mostrar según la página actual
  const paginatedInsumos = filteredInsumos.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  // Calcular el total de items para la paginación
  const getTotalCount = () => {
    return filteredInsumos.length
  }

  // Manejar apertura del menú
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, insumo: InsumoSaldo) => {
    setMenuAnchorEl(event.currentTarget)
    setInsumoMenuSeleccionado(insumo)
  }

  // Manejar cierre del menú
  const handleMenuClose = () => {
    setMenuAnchorEl(null)
    setInsumoMenuSeleccionado(null)
  }

  // Manejar ver detalle de movimientos desde el menú
  const handleVerDetalle = () => {
    if (insumoMenuSeleccionado) {
      setInsumoSeleccionado(insumoMenuSeleccionado)
      setDetalleModalOpen(true)
    }
    handleMenuClose()
  }

  // Manejar ver detalle de lotes desde el menú
  const handleVerDetalleLotes = () => {
    if (insumoMenuSeleccionado) {
      setInsumoSeleccionado(insumoMenuSeleccionado)
      setDetalleLotesModalOpen(true)
    }
    handleMenuClose()
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
          </Box>
        </Box>

        {/* Segunda fila: Barra de búsqueda */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            placeholder="Buscar insumos por código, nombre, descripción o unidad..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearchTerm(e.target.value)
              setPage(0)
            }}
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
              <TableCell sx={{ fontWeight: 600 }}>Total Lotes</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Stock Total</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInsumos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
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
              // Vista única: Una fila por insumo con totales
              paginatedInsumos.map((insumo) => (
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
                      label={`${insumo.total_lotes || 0} lote${(insumo.total_lotes || 0) !== 1 ? 's' : ''}`}
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${insumo.stock_disponible || 0} ${insumo.unidad_medida}`}
                      size="small"
                      color={insumo.stock_disponible > 0 ? "success" : 'default'}
                      variant="filled"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Más opciones">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, insumo)}
                            color="primary"
                          >
                            <MoreVert />
                          </IconButton>
                        </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginación */}
      {filteredInsumos.length > 0 && (
        <Paper sx={{ borderTop: 1, borderColor: 'divider' }}>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={getTotalCount()}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`} insumos`
            }
          />
          {/* Información adicional */}
          <Box sx={{ p: 2, backgroundColor: 'grey.50' }}>
            <Typography variant="body2" color="text.secondary">
              Total: {filteredInsumos.length} de {insumos.length} insumo{insumos.length !== 1 ? 's' : ''}
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
        </Paper>
      )}

      {/* Menú contextual */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { boxShadow: 3, borderRadius: 2, minWidth: 200 }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleVerDetalle}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver detalle de movimientos</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleVerDetalleLotes}>
          <ListItemIcon>
            <ListAlt fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver detalle de lotes</ListItemText>
        </MenuItem>
        {/* Aquí se pueden agregar más opciones en el futuro */}
      </Menu>

      {/* Modal de detalle de movimientos */}
      <DetalleMovimientosModal
        open={detalleModalOpen}
        onClose={() => {
          setDetalleModalOpen(false)
          setInsumoSeleccionado(null)
        }}
        insumo={insumoSeleccionado}
      />

      {/* Modal de detalle de lotes */}
      <DetalleLotesModal
        open={detalleLotesModalOpen}
        onClose={() => {
          setDetalleLotesModalOpen(false)
          setInsumoSeleccionado(null)
        }}
        insumo={insumoSeleccionado}
        laboratorioId={selectedLaboratorio === "all" ? undefined : selectedLaboratorio}
      />
    </Box>
  )
} 