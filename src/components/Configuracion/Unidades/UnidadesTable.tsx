import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  TablePagination
} from '@mui/material'
import { Straighten } from '@mui/icons-material'
import type { Unidad } from '../../../services/unidadService'
import { ActionMenu } from '../Common/ActionMenu'

interface UnidadesTableProps {
  unidades: Unidad[]
  onEdit: (unidad: Unidad) => void
  onDelete: (unidad: Unidad) => void
}

export const UnidadesTable: React.FC<UnidadesTableProps> = ({
  unidades,
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

  // Calcular las unidades a mostrar según la página actual
  const paginatedUnidades = unidades.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  if (unidades.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        py: 8,
        color: 'text.secondary'
      }}>
        <Straighten sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
        <Typography variant="h6" gutterBottom>
          No hay unidades registradas
        </Typography>
        <Typography variant="body2">
          Crea la primera unidad para empezar
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
            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Símbolo</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Nombre</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Descripción</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">
              Acciones
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedUnidades.map((unidad) => (
            <TableRow 
              key={unidad.id}
              sx={{ 
                '&:hover': { backgroundColor: 'action.hover' },
                '&:last-child td, &:last-child th': { border: 0 }
              }}
            >
              <TableCell>{unidad.id}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Straighten color="primary" fontSize="small" />
                  <Typography variant="body2" fontWeight={500}>
                    {unidad.simbolo}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight={500}>
                  {unidad.nombre}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    maxWidth: 300, 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {unidad.descripcion || '-'}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <ActionMenu
                  onEdit={() => onEdit(unidad)}
                  onDelete={() => onDelete(unidad)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={unidades.length}
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

