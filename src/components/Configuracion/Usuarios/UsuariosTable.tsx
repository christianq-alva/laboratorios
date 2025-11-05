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
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Avatar,
} from '@mui/material'
import {
  MoreVert,
  Edit,
  Delete,
  Person,
  AdminPanelSettings,
  SupervisorAccount,
  School,
} from '@mui/icons-material'

interface Usuario {
  id: number
  nombre: string
  usuario: string
  rol: 'Administrador' | 'Jefe de Laboratorio'
  laboratorios: number[]
  estado: 'Activo' | 'Inactivo'
}

interface UsuariosTableProps {
  onEdit: (usuario: Usuario) => void
  onDelete: (usuario: Usuario) => void
}

// Usuarios mock para maquetación
const USUARIOS_MOCK: Usuario[] = [
  {
    id: 1,
    nombre: 'Carlos Mendoza',
    usuario: 'cmendoza',
    rol: 'Administrador',
    laboratorios: [],
    estado: 'Activo',
  },
  {
    id: 2,
    nombre: 'María García',
    usuario: 'mgarcia',
    rol: 'Jefe de Laboratorio',
    laboratorios: [1, 2],
    estado: 'Activo',
  },
  {
    id: 3,
    nombre: 'Juan Pérez',
    usuario: 'jperez',
    rol: 'Jefe de Laboratorio',
    laboratorios: [3],
    estado: 'Activo',
  },
  {
    id: 4,
    nombre: 'Ana Torres',
    usuario: 'atorres',
    rol: 'Administrador',
    laboratorios: [],
    estado: 'Activo',
  },
  {
    id: 5,
    nombre: 'Roberto Silva',
    usuario: 'rsilva',
    rol: 'Jefe de Laboratorio',
    laboratorios: [4, 5],
    estado: 'Inactivo',
  },
]

const LABORATORIOS_MOCK = [
  { id: 1, codigo: 'LAB-001' },
  { id: 2, codigo: 'LAB-002' },
  { id: 3, codigo: 'LAB-003' },
  { id: 4, codigo: 'LAB-004' },
  { id: 5, codigo: 'LAB-005' },
]

export const UsuariosTable: React.FC<UsuariosTableProps> = ({
  onEdit,
  onDelete,
}) => {
  const [usuarios] = useState<Usuario[]>(USUARIOS_MOCK)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null)

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

  const getInitials = (nombre: string) => {
    const names = nombre.split(' ')
    return names.length > 1
      ? `${names[0][0]}${names[1][0]}`
      : nombre.substring(0, 2)
  }

  const getRolIcon = (rol: string) => {
    return rol === 'Administrador' 
      ? <AdminPanelSettings fontSize="small" color="error" />
      : <SupervisorAccount fontSize="small" color="primary" />
  }

  const getRolColor = (rol: string) => {
    return rol === 'Administrador' ? 'error' : 'primary'
  }

  const getEstadoColor = (estado: string) => {
    return estado === 'Activo' ? 'success' : 'default'
  }

  return (
    <Box>
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell>Usuario</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Laboratorios</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="center" width={80}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <Person sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography color="text.secondary">
                    No hay usuarios registrados
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              usuarios.map((usuario) => (
                <TableRow 
                  key={usuario.id}
                  hover
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  {/* Usuario */}
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar 
                        sx={{ 
                          width: 36, 
                          height: 36,
                          bgcolor: getRolColor(usuario.rol) + '.main',
                          fontSize: '0.875rem',
                        }}
                      >
                        {getInitials(usuario.nombre)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {usuario.nombre}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          @{usuario.usuario}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Rol */}
                  <TableCell>
                    <Chip
                      icon={getRolIcon(usuario.rol)}
                      label={usuario.rol}
                      size="small"
                      color={getRolColor(usuario.rol)}
                      variant="outlined"
                    />
                  </TableCell>

                  {/* Laboratorios */}
                  <TableCell>
                    {usuario.rol === 'Administrador' ? (
                      <Chip 
                        label="Todos"
                        size="small"
                        variant="outlined"
                        color="default"
                      />
                    ) : usuario.laboratorios.length === 0 ? (
                      <Typography variant="caption" color="text.secondary">
                        Sin asignar
                      </Typography>
                    ) : (
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {usuario.laboratorios.map((labId) => {
                          const lab = LABORATORIOS_MOCK.find(l => l.id === labId)
                          return (
                            <Chip
                              key={labId}
                              icon={<School fontSize="small" />}
                              label={lab?.codigo || labId}
                              size="small"
                              variant="outlined"
                            />
                          )
                        })}
                      </Box>
                    )}
                  </TableCell>

                  {/* Estado */}
                  <TableCell>
                    <Chip
                      label={usuario.estado}
                      size="small"
                      color={getEstadoColor(usuario.estado)}
                      variant="filled"
                    />
                  </TableCell>

                  {/* Acciones */}
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
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

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
    </Box>
  )
}

