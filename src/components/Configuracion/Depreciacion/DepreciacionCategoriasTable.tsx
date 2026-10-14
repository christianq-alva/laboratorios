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
  TablePagination,
  Tooltip
} from '@mui/material'
import { TrendingDown } from '@mui/icons-material'
import {
  formatPorcentaje,
  type DepreciacionCategoria
} from '../../../services/depreciacionCategoriaService'
import { ActionMenu } from '../Common/ActionMenu'

interface DepreciacionCategoriasTableProps {
  categorias: DepreciacionCategoria[]
  onEdit: (categoria: DepreciacionCategoria) => void
  onDelete: (categoria: DepreciacionCategoria) => void
}

export const DepreciacionCategoriasTable: React.FC<DepreciacionCategoriasTableProps> = ({
  categorias,
  onEdit,
  onDelete
}) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const paginatedCategorias = categorias.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  if (categorias.length === 0) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        color: 'text.secondary'
      }}>
        <TrendingDown sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
        <Typography variant="h6" gutterBottom>
          No hay categorías de depreciación registradas
        </Typography>
        <Typography variant="body2">
          Crea las categorías (Pequeño, Mediano, Grande) para poder cobrar depreciación por práctica
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
            <TableCell sx={{ color: 'white', fontWeight: 600 }} align="right">Porcentaje</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Descripción</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">Equipos</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">Materiales</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">Estado</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedCategorias.map((categoria) => {
            const activa = Boolean(Number(categoria.activo))
            const porcentaje = Number(categoria.porcentaje)
            return (
              <TableRow
                key={categoria.id}
                sx={{
                  '&:hover': { backgroundColor: 'action.hover' },
                  '&:last-child td, &:last-child th': { border: 0 },
                  opacity: activa ? 1 : 0.6
                }}
              >
                <TableCell>{categoria.id}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingDown color="primary" fontSize="small" />
                    <Typography variant="body2" fontWeight={500}>
                      {categoria.nombre}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Tooltip
                    title={
                      porcentaje > 0
                        ? `Un bien de S/ 1 000.00 costaría S/ ${(1000 * porcentaje / 100).toFixed(4)} por práctica`
                        : 'Sin costo de depreciación'
                    }
                  >
                    <Chip
                      label={formatPorcentaje(categoria.porcentaje)}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 700 }}
                    />
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      maxWidth: 280,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title={categoria.descripcion || undefined}
                  >
                    {categoria.descripcion || '-'}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={categoria.count_equipos ?? 0}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={categoria.count_materiales ?? 0}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={activa ? 'Activa' : 'Inactiva'}
                    size="small"
                    color={activa ? 'success' : 'default'}
                    variant={activa ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell align="center">
                  <ActionMenu
                    onEdit={() => onEdit(categoria)}
                    onDelete={() => onDelete(categoria)}
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={categorias.length}
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
