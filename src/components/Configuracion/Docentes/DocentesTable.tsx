import React, { useState } from 'react'
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
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Avatar,
  TablePagination,
} from '@mui/material'
import {
  MoreVert,
  Edit,
  Delete,
  Person,
  Email,
  School,
  Visibility,
} from '@mui/icons-material'
import type { Docente } from '../../../services/docenteService'

interface DocentesTableProps {
  docentes: Docente[]
  onEdit: (docente: Docente) => void
  onDelete: (docente: Docente) => void
  onViewHorarios?: (docente: Docente) => void
}

export const DocentesTable: React.FC<DocentesTableProps> = ({
  docentes,
  onEdit,
  onDelete,
  onViewHorarios,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedDocente, setSelectedDocente] = useState<Docente | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Funciones para manejar la paginación
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  // Calcular los docentes a mostrar según la página actual
  const paginatedDocentes = docentes.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

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
    if (selectedDocente && onViewHorarios) {
      onViewHorarios(selectedDocente)
    }
    handleMenuClose()
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
            <TableCell align="center" sx={{ fontWeight: 600 }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedDocentes.map((docente) => (
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
                  <Typography variant="body2" color={docente.correo ? 'text.primary' : 'text.secondary'}>
                    {docente.correo || 'Sin correo'}
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
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={docentes.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) => 
          `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
        }
      />

      {/* Menu contextual */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {onViewHorarios && (
          <MenuItem onClick={handleViewHorarios}>
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            <ListItemText>Ver Horarios</ListItemText>
          </MenuItem>
        )}
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