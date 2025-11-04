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
  TablePagination
} from '@mui/material'
import { Edit, Delete, LibraryBooks } from '@mui/icons-material'
import type { Insumo2 } from '../../../services/insumoService'

interface CatalogoInsumosTableProps {
  insumos: Insumo2[]
  onEdit: (insumo: Insumo2) => void
  onDelete: (insumo: Insumo2) => void
}

export const CatalogoInsumosTable: React.FC<CatalogoInsumosTableProps> = ({
  insumos,
  onEdit,
  onDelete
}) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const getCategoriaColor = (categoria?: string) => {
    switch (categoria) {
      case 'Reactivos': return '#ff9800'
      case 'Materiales': return '#2196f3'
      case 'Material_Biologico': return '#4caf50'
      default: return '#9e9e9e'
    }
  }

  // Funciones para manejar la paginación
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  // Calcular los insumos a mostrar según la página actual
  const paginatedInsumos = insumos.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  if (insumos.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        py: 8,
        color: 'text.secondary'
      }}>
        <LibraryBooks sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
        <Typography variant="h6" gutterBottom>
          No hay insumos registrados
        </Typography>
        <Typography variant="body2">
          Crea el primer insumo para empezar
        </Typography>
      </Box>
    )
  }

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: 'primary.main' }}>
            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Código</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Nombre</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Categoría</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Unidad</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Presentación</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">
              Acciones
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedInsumos.map((insumo) => (
            <TableRow 
              key={insumo.id}
              sx={{ 
                '&:hover': { backgroundColor: 'action.hover' },
                '&:last-child td, &:last-child th': { border: 0 }
              }}
            >
              <TableCell>
                <Chip
                  label={insumo.codigo || 'N/A'}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight={500}>
                  {insumo.nombre}
                </Typography>
                {insumo.descripcion && (
                  <Typography variant="caption" color="text.secondary">
                    {insumo.descripcion}
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                <Chip
                  label={insumo.categoria?.replace('_', ' ') || 'N/A'}
                  size="small"
                  sx={{
                    backgroundColor: getCategoriaColor(insumo.categoria),
                    color: 'white',
                    fontWeight: 500
                  }}
                />
              </TableCell>
              <TableCell>{insumo.unidad_medida}</TableCell>
              <TableCell>{insumo.presentacion || '-'}</TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                  <Tooltip title="Editar">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => onEdit(insumo)}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onDelete(insumo)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={insumos.length}
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

