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
} from '@mui/icons-material'
import { laboratorioService } from '../../services/laboratorioService'
import type { Laboratorio } from '../../services/laboratorioService'

interface LaboratoriosTableProps {
  onEdit: (laboratorio: Laboratorio) => void
  onDelete: (laboratorio: Laboratorio) => void
  refresh: boolean
  onRefreshComplete: () => void
}

export const LaboratoriosTable: React.FC<LaboratoriosTableProps> = ({
  onEdit,
  onDelete,
  refresh,
  onRefreshComplete,
}) => {
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedLab, setSelectedLab] = useState<Laboratorio | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

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
    if (refresh) {
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

  // Función para filtrar laboratorios por término de búsqueda
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
  }

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
            filteredLaboratorios.map((lab) => (
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
                  label="Activo" 
                  color="success" 
                  size="small" 
                  variant="outlined" 
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