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
  Avatar,
} from '@mui/material'
import {
  MoreVert,
  Edit,
  Delete,
  Person,
  Email,
  School,
  Schedule,
  Visibility,
} from '@mui/icons-material'
import { docenteService } from '../../services/docenteService'
import type { Docente } from '../../services/docenteService'

interface DocentesTableProps {
  onEdit: (docente: Docente) => void
  onDelete: (docente: Docente) => void
  onViewHorarios: (docente: Docente) => void
  refresh: boolean
  onRefreshComplete: () => void
}

export const DocentesTable: React.FC<DocentesTableProps> = ({
  onEdit,
  onDelete,
  onViewHorarios,
  refresh,
  onRefreshComplete,
}) => {
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedDocente, setSelectedDocente] = useState<Docente | null>(null)

  const fetchDocentes = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await docenteService.getAll()
      
      if (result.success) {
        setDocentes(result.data || [])
      } else {
        setError(result.message || 'Error al cargar docentes')
      }
    } catch (err) {
      setError('Error de conexión al servidor')
      console.error('Error fetching docentes:', err)
    } finally {
      setLoading(false)
      onRefreshComplete()
    }
  }

  useEffect(() => {
    fetchDocentes()
  }, [])

  useEffect(() => {
    if (refresh) {
      fetchDocentes()
    }
  }, [refresh])

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, docente: Docente) => {
    setAnchorEl(event.currentTarget)
    setSelectedDocente(docente)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedDocente(null)
  }

  const handleEdit = () => {
    if (selectedDocente) {
      onEdit(selectedDocente)
    }
    handleMenuClose()
  }

  const handleDelete = () => {
    if (selectedDocente) {
      onDelete(selectedDocente)
    }
    handleMenuClose()
  }

  const handleViewHorarios = () => {
    if (selectedDocente) {
      onViewHorarios(selectedDocente)
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

  if (docentes.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Person sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No hay docentes registrados
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Haz clic en "Nuevo Docente" para agregar el primero
        </Typography>
      </Paper>
    )
  }

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: 'grey.50' }}>
            <TableCell sx={{ fontWeight: 600 }}>Docente</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Contacto</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Escuela</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Horarios</TableCell>
            <TableCell align="center" sx={{ fontWeight: 600 }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {docentes.map((docente) => (
            <TableRow key={docente.id} hover>
              {/* Nombre */}
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {docente.nombre.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" fontWeight={500}>
                      {docente.nombre}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ID: {docente.id}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>

              {/* Contacto */}
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Email fontSize="small" color="action" />
                  <Typography variant="body2">
                    {docente.correo}
                  </Typography>
                </Box>
              </TableCell>

              {/* Escuela */}
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <School fontSize="small" color="action" />
                  <Typography variant="body2">
                    {docente.escuela || 'Sin asignar'}
                  </Typography>
                </Box>
              </TableCell>

              {/* Horarios */}
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Schedule fontSize="small" color="action" />
                  <Chip
                    label={`${docente.total_horarios || 0} horarios`}
                    size="small"
                    color={docente.total_horarios && docente.total_horarios > 0 ? 'primary' : 'default'}
                    variant="outlined"
                  />
                </Box>
              </TableCell>

              {/* Acciones */}
              <TableCell align="center">
                <Tooltip title="Más opciones">
                  <IconButton
                    onClick={(e) => handleMenuClick(e, docente)}
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
        <MenuItem onClick={handleViewHorarios}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver Horarios</ListItemText>
        </MenuItem>
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