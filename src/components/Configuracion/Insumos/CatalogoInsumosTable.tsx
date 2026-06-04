import React, { useState, useMemo } from 'react'
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
  TextField,
  IconButton
} from '@mui/material'
import { LibraryBooks, Search, Clear } from '@mui/icons-material'
import type { Insumo } from '../../../services/insumoService'
import { ActionMenu } from '../Common/ActionMenu'

interface CatalogoInsumosTableProps {
  insumos: Insumo[]
  onEdit: (insumo: Insumo) => void
  onDelete: (insumo: Insumo) => void
}

export const CatalogoInsumosTable: React.FC<CatalogoInsumosTableProps> = ({
  insumos,
  onEdit,
  onDelete
}) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')

  const getCategoriaColor = (categoria?: string) => {
    switch (categoria) {
      case 'Reactivos': return '#ff9800'
      case 'Materiales': return '#2196f3'
      case 'Material_Biologico': return '#4caf50'
      case 'Farmacos': return '#9c27b0'
      default: return '#9e9e9e'
    }
  }

  // Filtrar insumos por término de búsqueda
  const filteredInsumos = useMemo(() => {
    if (!searchTerm) return insumos
    
    const searchLower = searchTerm.toLowerCase()
    return insumos.filter(insumo => (
      (insumo.codigo && insumo.codigo.toLowerCase().includes(searchLower)) ||
      insumo.nombre.toLowerCase().includes(searchLower) ||
      (insumo.descripcion && insumo.descripcion.toLowerCase().includes(searchLower)) ||
      (insumo.categoria && insumo.categoria.toLowerCase().includes(searchLower)) ||
      (insumo.unidad_simbolo && insumo.unidad_simbolo.toLowerCase().includes(searchLower)) ||
      (insumo.unidad_nombre && insumo.unidad_nombre.toLowerCase().includes(searchLower)) ||
      (insumo.presentacion && insumo.presentacion.toLowerCase().includes(searchLower))
    ))
  }, [insumos, searchTerm])

  // Función para limpiar búsqueda
  const handleClearSearch = () => {
    setSearchTerm('')
    setPage(0)
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
  const paginatedInsumos = filteredInsumos.slice(
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
    <Box>
      {/* Barra de búsqueda */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          placeholder="Buscar insumos por código, nombre, categoría, unidad o presentación..."
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
            {filteredInsumos.length} resultado{filteredInsumos.length !== 1 ? 's' : ''}
          </Typography>
        )}
      </Box>

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
          {filteredInsumos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <LibraryBooks sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No se encontraron insumos
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {searchTerm 
                      ? `No hay insumos que coincidan con "${searchTerm}"`
                      : 'No hay insumos registrados en el sistema'
                    }
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            paginatedInsumos.map((insumo) => (
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
              <TableCell>{`${insumo.unidad_nombre} (${insumo.unidad_simbolo})` || '-'}</TableCell>
              <TableCell>{insumo.presentacion || '-'}</TableCell>
              <TableCell align="center">
                <ActionMenu
                  onEdit={() => onEdit(insumo)}
                  onDelete={() => onDelete(insumo)}
                />
              </TableCell>
            </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredInsumos.length}
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
    </Box>
  )
}

