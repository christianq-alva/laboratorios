import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Tooltip,
  Box,
  Typography,
  TablePagination,
  Avatar,
  Switch,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import { Edit, Delete, Person, AdminPanelSettings, SupervisorAccount, School, MoreVert } from '@mui/icons-material'
import type { Usuario } from '../../../services/usuarioService'

interface UsuariosTableProps {
  usuarios: Usuario[]
  onEdit: (usuario: Usuario) => void
  onDelete: (usuario: Usuario) => void
  onToggleEstado: (usuario: Usuario) => void
}

export const UsuariosTable: React.FC<UsuariosTableProps> = ({
  usuarios,
  onEdit,
  onDelete,
  onToggleEstado
}) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null)

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Funciones para manejar la paginación
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  // Calcular los usuarios a mostrar según la página actual
  const paginatedUsuarios = usuarios.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  const getInitials = (nombre: string) => {
    const names = nombre.split(' ')
    return names.length > 1
      ? `${names[0][0]}${names[1][0]}`
      : nombre.substring(0, 2).toUpperCase()
  }

  const getRolColor = (rol: string) => {
    return rol === 'Administrador' ? 'error' : 'primary'
  }

  const getEstadoColor = (estado: string) => {
    return estado === 'activo' ? 'success' : 'default'
  }

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, usuario: Usuario) => {
    setAnchorEl(event.currentTarget)
    setSelectedUsuario(usuario)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedUsuario(null)
  }

  const handleEdit = () => {
    if (selectedUsuario) {
      onEdit(selectedUsuario)
    }
    handleMenuClose()
  }

  const handleDelete = () => {
    if (selectedUsuario) {
      onDelete(selectedUsuario)
    }
    handleMenuClose()
  }

  if (usuarios.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        py: 8,
        color: 'text.secondary'
      }}>
        <Person sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
        <Typography variant="h6" gutterBottom>
          No hay usuarios registrados
        </Typography>
        <Typography variant="body2">
          Crea el primer usuario para empezar
        </Typography>
      </Box>
    )
  }

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: 'primary.main' }}>
            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Usuario</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Rol</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Laboratorios</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Estado</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Fecha Creación</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">
              Acciones
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedUsuarios.map((usuario) => (
            <TableRow 
              key={usuario.id}
              sx={{ 
                '&:hover': { backgroundColor: 'action.hover' },
                '&:last-child td, &:last-child th': { border: 0 }
              }}
            >
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar 
                    sx={{ 
                      width: 36, 
                      height: 36,
                      bgcolor: getRolColor(usuario.rol_nombre) + '.main',
                      fontSize: '0.875rem',
                    }}
                  >
                    {getInitials(usuario.nombre_completo)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {usuario.nombre_completo}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      @{usuario.usuario}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  icon={usuario.rol_nombre === 'Administrador' 
                    ? <AdminPanelSettings fontSize="small" /> 
                    : <SupervisorAccount fontSize="small" />}
                  label={usuario.rol_nombre}
                  size="small"
                  color={getRolColor(usuario.rol_nombre)}
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                {usuario.rol_nombre === 'Administrador' ? (
                  <Chip 
                    label="Todos"
                    size="small"
                    variant="outlined"
                    color="default"
                  />
                ) : usuario.laboratorios_nombres && usuario.laboratorios_nombres.length > 0 ? (
                  <Box display="flex" gap={0.5} flexWrap="wrap">
                    {usuario.laboratorios_nombres.map((lab) => (
                      <Chip
                        key={lab.id}
                        icon={<School fontSize="small" />}
                        label={lab.codigo}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    Sin asignar
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip
                    label={usuario.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    size="small"
                    color={getEstadoColor(usuario.estado)}
                    variant="filled"
                  />
                  <Switch
                    size="small"
                    checked={usuario.estado === 'activo'}
                    onChange={() => onToggleEstado(usuario)}
                    color="success"
                  />
                </Box>
              </TableCell>
              <TableCell>{formatDate(usuario.created_at)}</TableCell>
              <TableCell align="center">
                <Tooltip title="Más opciones">
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuClick(e, usuario)}
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
        count={usuarios.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) => 
          `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
        }
      />

      {/* Menú contextual */}
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
        
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Eliminar</ListItemText>
        </MenuItem>
      </Menu>
    </TableContainer>
  )
}

