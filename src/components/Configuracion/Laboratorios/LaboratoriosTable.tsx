import React, { useState, useMemo } from 'react'
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
  TextField,
  TablePagination,
} from '@mui/material'
import {
  School,
  LocationOn,
  AccountBalance,
  Search,
  Clear,
  CheckCircle,
  Build,
  Block,
  RemoveCircle,
  Inventory,
} from '@mui/icons-material'
import type { Laboratorio } from '../../../services/laboratorioService'
import { ActionMenu } from '../Common/ActionMenu'
import { ConfigurarInsumosModal } from './ConfigurarInsumosModal'

interface LaboratoriosTableProps {
  laboratorios: Laboratorio[]
  onEdit: (laboratorio: Laboratorio) => void
  onDelete: (laboratorio: Laboratorio) => void
  onChangeStatus: (laboratorio: Laboratorio, estado: 'Activo' | 'En Mantenimiento' | 'Inhabilitado' | 'Baja') => void
}

export const LaboratoriosTable: React.FC<LaboratoriosTableProps> = ({
  laboratorios,
  onEdit,
  onDelete,
  onChangeStatus,
}) => {
  const [selectedLab, setSelectedLab] = useState<Laboratorio | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [configurarInsumosOpen, setConfigurarInsumosOpen] = useState(false)

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

  // Filtrar laboratorios por término de búsqueda
  const filteredLaboratorios = useMemo(() => {
    if (!searchTerm) return laboratorios

    const searchLower = searchTerm.toLowerCase()
    return laboratorios.filter(lab => (
      (lab.codigo && lab.codigo.toLowerCase().includes(searchLower)) ||
      lab.nombre.toLowerCase().includes(searchLower) ||
      lab.ubicacion.toLowerCase().includes(searchLower) ||
      (lab.escuela && lab.escuela.toLowerCase().includes(searchLower))
    ))
  }, [laboratorios, searchTerm])

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
                    <ActionMenu
                      onEdit={() => onEdit(lab)}
                      onDelete={() => onDelete(lab)}
                      sections={[
                        {
                          label: 'Configuración',
                          items: [
                            {
                              label: 'Configurar Insumos',
                              icon: <Inventory fontSize="small" />,
                              onClick: () => {
                                setSelectedLab(lab)
                                setConfigurarInsumosOpen(true)
                              },
                            }
                          ]
                        },
                        {
                          label: 'Cambiar Estado',
                          items: [
                            {
                              label: 'Activo',
                              icon: <CheckCircle fontSize="small" />,
                              color: 'success',
                              disabled: lab.estado === 'Activo',
                              onClick: () => onChangeStatus(lab, 'Activo'),
                            },
                            {
                              label: 'En Mantenimiento',
                              icon: <Build fontSize="small" />,
                              color: 'warning',
                              disabled: lab.estado === 'En Mantenimiento',
                              onClick: () => onChangeStatus(lab, 'En Mantenimiento'),
                            },
                            {
                              label: 'Inhabilitado',
                              icon: <Block fontSize="small" />,
                              color: 'error',
                              disabled: lab.estado === 'Inhabilitado',
                              onClick: () => onChangeStatus(lab, 'Inhabilitado'),
                            },
                            {
                              label: 'Baja',
                              icon: <RemoveCircle fontSize="small" />,
                              disabled: lab.estado === 'Baja',
                              onClick: () => onChangeStatus(lab, 'Baja'),
                            },
                          ]
                        }
                      ]}
                    />
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

      {/* Modal de configuración de insumos */}
      <ConfigurarInsumosModal
        open={configurarInsumosOpen}
        onClose={() => {
          setConfigurarInsumosOpen(false)
          setSelectedLab(null)
        }}
        laboratorio={selectedLab ? {
          id: selectedLab.id,
          nombre: selectedLab.nombre,
          codigo: selectedLab.codigo,
          ubicacion: selectedLab.ubicacion,
        } : null}
      />
    </Box>
  )
} 