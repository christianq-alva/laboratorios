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
  Typography,
  Avatar,
  TablePagination,
} from '@mui/material'
import {
  Edit,
  Email,
  School,
  Visibility,
  Person,
} from '@mui/icons-material'
import type { Docente } from '../../../services/docenteService'
import { ActionMenu } from '../Common/ActionMenu'

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
          <TableRow sx={{ backgroundColor: 'primary.main' }}>
            <TableCell sx={{ fontWeight: 600, color: 'white' }}>Docente</TableCell>
            <TableCell sx={{ fontWeight: 600, color: 'white' }}>Contacto</TableCell>
            <TableCell sx={{ fontWeight: 600, color: 'white' }}>Escuela</TableCell>
            <TableCell align="center" sx={{ fontWeight: 600, color: 'white' }}>Acciones</TableCell>
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
                <ActionMenu
                  onEdit={() => onEdit(docente)}
                  onDelete={() => onDelete(docente)}
                  sections={
                    onViewHorarios ? [
                      {
                        label: 'Información',
                        items: [
                          {
                            label: 'Ver Horarios',
                            icon: <Visibility fontSize="small" />,
                            onClick: () => onViewHorarios(docente),
                          }
                        ]
                      }
                    ] : []
                  }
                />
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
    </TableContainer>
  )
} 