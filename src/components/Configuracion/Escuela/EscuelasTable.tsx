import React, { useState } from 'react'
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
  TablePagination
} from '@mui/material'
import { School } from '@mui/icons-material'
import type { Escuela } from '../../../services/escuelaService'
import { ActionMenu } from '../Common/ActionMenu'

interface EscuelasTableProps {
  escuelas: Escuela[]
  onEdit: (escuela: Escuela) => void
  onDelete: (escuela: Escuela) => void
}

export const EscuelasTable: React.FC<EscuelasTableProps> = ({
  escuelas,
  onEdit,
  onDelete
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

  // Calcular las escuelas a mostrar según la página actual
  const paginatedEscuelas = escuelas.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  if (escuelas.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        py: 8,
        color: 'text.secondary'
      }}>
        <School sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
        <Typography variant="h6" gutterBottom>
          No hay escuelas registradas
        </Typography>
        <Typography variant="body2">
          Crea la primera escuela para empezar
        </Typography>
      </Box>
    )
  }

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: 'primary.main' }}>
            <TableCell sx={{ color: 'white', fontWeight: 600 }}>ID</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Nombre</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">
              Acciones
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedEscuelas.map((escuela) => (
            <TableRow 
              key={escuela.id}
              sx={{ 
                '&:hover': { backgroundColor: 'action.hover' },
                '&:last-child td, &:last-child th': { border: 0 }
              }}
            >
              <TableCell>
                <Chip 
                  label={escuela.id} 
                  size="small" 
                  color="default"
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <School color="primary" fontSize="small" />
                  <Typography variant="body2" fontWeight={500}>
                    {escuela.nombre}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell align="center">
                <ActionMenu
                  onEdit={() => onEdit(escuela)}
                  onDelete={() => onDelete(escuela)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={escuelas.length}
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

