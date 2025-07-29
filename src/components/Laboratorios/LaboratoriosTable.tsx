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
} from '@mui/material'
import {
  MoreVert,
  Edit,
  Delete,
  School,
  LocationOn,
  People,
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
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: 'grey.50' }}>
            <TableCell sx={{ fontWeight: 600 }}>Laboratorio</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Ubicación</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Capacidad</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
            <TableCell align="center" sx={{ fontWeight: 600 }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {laboratorios.map((lab) => (
            <TableRow key={lab.id} hover>
              {/* Nombre */}
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <School color="primary" />
                  <Box>
                    <Typography variant="body1" fontWeight={500}>
                      {lab.nombre}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ID: {lab.id}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>

              {/* Ubicación */}
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn fontSize="small" color="action" />
                  <Typography variant="body2">
                    {lab.ubicacion}
                  </Typography>
                </Box>
              </TableCell>

              {/* Capacidad */}
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <People fontSize="small" color="action" />
                  <Typography variant="body2">
                    {lab.capacidad} estudiantes
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
                    onClick={(e) => handleMenuClick(e, lab)}
                    size="small"
                  >
                    <MoreVert />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
    </TableContainer>
  )
} 