import React, { useState, useEffect } from 'react'
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Tooltip,
  TextField,
  TablePagination,
} from '@mui/material'
import {
  MoreVert,
  Edit,
  Delete,
  School,
  LocationOn,
  AccountBalance,
  Search,
  Clear,
  CheckCircle,
  Build,
  Block,
  RemoveCircle,
} from '@mui/icons-material'
import { laboratorioService } from '../../services/laboratorioService'
import type { Laboratorio } from '../../services/laboratorioService'

interface LaboratoriosTableProps {
  onEdit: (laboratorio: Laboratorio) => void
  onDelete: (laboratorio: Laboratorio) => void
  onChangeStatus: (laboratorio: Laboratorio, estado: 'Activo' | 'En Mantenimiento' | 'Inhabilitado' | 'Baja') => void
  refresh: number
  onRefreshComplete: () => void
}

export const LaboratoriosTable: React.FC<LaboratoriosTableProps> = ({
  onEdit,
  onDelete,
  onChangeStatus,
  refresh,
  onRefreshComplete,
}) => {
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedLab, setSelectedLab] = useState<Laboratorio | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const fetchLaboratorios = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await laboratorioService.getAll()
      
      if (result.success) {
        setLaboratorios(result.data || [])
      } else {
        setError(result.message || 'Error al cargar laboratorios')
      }
    } catch (err) {
      setError('Error de conexión al servidor')
      console.error('Error fetching laboratorios:', err)
    } finally {
      setLoading(false)
      onRefreshComplete()
    }
  }

  useEffect(() => {
    fetchLaboratorios()
  }, [])

  useEffect(() => {
    if (refresh > 0) {
      fetchLaboratorios()
    }
  }, [refresh])

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, laboratorio: Laboratorio) => {
    setAnchorEl(event.currentTarget)
    setSelectedLab(laboratorio)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedLab(null)
  }

  const handleEdit = () => {
    if (selectedLab) {
      onEdit(selectedLab)
    }
    handleMenuClose()
  }

  const handleDelete = () => {
    if (selectedLab) {
      onDelete(selectedLab)
    }
    handleMenuClose()
  }

  const handleChangeStatus = (estado: 'Activo' | 'En Mantenimiento' | 'Inhabilitado' | 'Baja') => {
    if (selectedLab) {
      onChangeStatus(selectedLab, estado)
    }
    handleMenuClose()
  }

  // Función para filtrar laboratorios por término de búsqueda
  // Función para obtener el color del estado
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Activo':
        return 'success'
      case 'En Mantenimiento':
        return 'warning'
      case 'Inhabilitado':
        return 'error'
      case 'Baja':
        return 'default'
      default:
        return 'default'
    }
  }

  const filteredLaboratorios = laboratorios.filter(lab => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      (lab.codigo && lab.codigo.toLowerCase().includes(searchLower)) ||
      lab.nombre.toLowerCase().includes(searchLower) ||
      lab.ubicacion.toLowerCase().includes(searchLower) ||
      (lab.escuela && lab.escuela.toLowerCase().includes(searchLower))
    )
  })

  // Función para limpiar búsqueda
  const handleClearSearch = () => {
    setSearchTerm('')
    setPage(0) // Resetear a la primera página
  }

  // Funciones para manejar la paginación
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0) // Resetear a la primera página cuando cambia el número de filas
  }

  // Calcular los laboratorios a mostrar según la página actual
  const paginatedLaboratorios = filteredLaboratorios.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    )
  }

  if (laboratorios.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <School sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No hay laboratorios registrados
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Haz clic en "Nuevo Laboratorio" para agregar el primero
        </Typography>
      </Paper>
    )
  }

  return (
    <Box>
      {/* Barra de búsqueda */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          placeholder="Buscar laboratorios por código, nombre, ubicación o escuela..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setSearchTerm(e.target.value)
            setPage(0) // Resetear a la primera página al buscar
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
            {filteredLaboratorios.length} resultado{filteredLaboratorios.length !== 1 ? 's' : ''}
          </Typography>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: 'grey.50' }}>
            <TableCell sx={{ fontWeight: 600, width: '12%' }}>Código</TableCell>
            <TableCell sx={{ fontWeight: 600, width: '25%' }}>Laboratorio</TableCell>
            <TableCell sx={{ fontWeight: 600, width: '20%' }}>Ubicación</TableCell>
            <TableCell sx={{ fontWeight: 600, width: '8%' }}>Piso</TableCell>
            <TableCell sx={{ fontWeight: 600, width: '20%' }}>Escuela</TableCell>
            <TableCell sx={{ fontWeight: 600, width: '10%' }}>Estado</TableCell>
            <TableCell align="center" sx={{ fontWeight: 600, width: '5%' }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredLaboratorios.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <School sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No se encontraron laboratorios
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {searchTerm 
                      ? `No hay laboratorios que coincidan con "${searchTerm}"`
                      : 'No hay laboratorios registrados en el sistema'
                    }
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            paginatedLaboratorios.map((lab) => (
            <TableRow key={lab.id} hover>
              {/* Código */}
              <TableCell>
                <Chip 
                  label={lab.codigo || 'N/A'} 
                  size="small" 
                  color="secondary"
                  variant="outlined"
                  sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                />
              </TableCell>

              {/* Nombre */}
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <School fontSize="small" color="primary" />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {lab.nombre}
                  </Typography>
                </Box>
              </TableCell>

              {/* Ubicación */}
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn fontSize="small" color="action" />
                  <Typography variant="body2">{lab.ubicacion}</Typography>
                </Box>
              </TableCell>

              {/* Piso */}
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                  {lab.piso}
                </Typography>
              </TableCell>

              {/* Escuela */}
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountBalance fontSize="small" color="action" />
                  <Typography variant="body2">
                    {lab.escuela || 'Escuela no asignada'}
                  </Typography>
                </Box>
              </TableCell>

              {/* Estado */}
              <TableCell>
                <Chip 
                  label={lab.estado || 'Activo'} 
                  color={getEstadoColor(lab.estado || 'Activo') as any} 
                  size="small" 
                  variant="filled" 
                />
              </TableCell>

              {/* Acciones */}
              <TableCell align="center">
                <Tooltip title="Más opciones">
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuClick(e, lab)}
                    sx={{ color: 'grey.600' }}
                  >
                    <MoreVert />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </TableContainer>

      {/* Paginación */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredLaboratorios.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) => 
          `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
        }
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      />

      {/* Menu contextual */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        
        {/* Separador visual */}
        <MenuItem disabled sx={{ borderTop: 1, borderColor: 'divider', mt: 1, pt: 1 }}>
          <ListItemText primary="Cambiar Estado:" sx={{ fontSize: '0.875rem', color: 'text.secondary' }} />
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleChangeStatus('Activo')}
          disabled={selectedLab?.estado === 'Activo'}
        >
          <ListItemIcon>
            <CheckCircle fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>Activo</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleChangeStatus('En Mantenimiento')}
          disabled={selectedLab?.estado === 'En Mantenimiento'}
        >
          <ListItemIcon>
            <Build fontSize="small" color="warning" />
          </ListItemIcon>
          <ListItemText>En Mantenimiento</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleChangeStatus('Inhabilitado')}
          disabled={selectedLab?.estado === 'Inhabilitado'}
        >
          <ListItemIcon>
            <Block fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Inhabilitado</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleChangeStatus('Baja')}
          disabled={selectedLab?.estado === 'Baja'}
        >
          <ListItemIcon>
            <RemoveCircle fontSize="small" />
          </ListItemIcon>
          <ListItemText>Baja</ListItemText>
        </MenuItem>
        
        {/* Separador para eliminar */}
        <MenuItem disabled sx={{ borderTop: 1, borderColor: 'divider', mt: 1 }}>
        </MenuItem>
        
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText>Eliminar</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  )
} 