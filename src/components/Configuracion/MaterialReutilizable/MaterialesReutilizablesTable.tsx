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
import { Science } from '@mui/icons-material'
import type { MaterialReutilizable } from '../../../services/materialReutilizableService'
import { ActionMenu } from '../Common/ActionMenu'

interface MaterialesReutilizablesTableProps {
  materiales: MaterialReutilizable[]
  onEdit: (material: MaterialReutilizable) => void
  onDelete: (material: MaterialReutilizable) => void
}

export const MaterialesReutilizablesTable: React.FC<MaterialesReutilizablesTableProps> = ({
  materiales,
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

  const paginated = materiales.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  if (materiales.length === 0) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        color: 'text.secondary'
      }}>
        <Science sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
        <Typography variant="h6" gutterBottom>
          No hay material reutilizable registrado
        </Typography>
        <Typography variant="body2">
          Registra la cristalería y el material afín para poder cobrar su depreciación por práctica
        </Typography>
      </Box>
    )
  }

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: 'primary.main' }}>
            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Código</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Material</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Laboratorio</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }} align="right">Cantidad</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }} align="right">Valor unit.</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Categoría</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }} align="right">Depreciación</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">Estado</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginated.map((material) => {
            const activo = Boolean(Number(material.activo))
            const valor = Number(material.valor_unitario ?? 0)
            const porcentaje = Number(material.depreciacion_porcentaje ?? 0)
            const configurado = Boolean(material.depreciacion_categoria_id) && valor > 0 && porcentaje > 0
            const costo = configurado ? valor * (porcentaje / 100) : 0
            return (
              <TableRow
                key={material.id}
                sx={{
                  '&:hover': { backgroundColor: 'action.hover' },
                  '&:last-child td, &:last-child th': { border: 0 },
                  opacity: activo ? 1 : 0.6
                }}
              >
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {material.codigo}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Science color="primary" fontSize="small" />
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {material.nombre}
                      </Typography>
                      {material.descripcion && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: 'block',
                            maxWidth: 240,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={material.descripcion}
                        >
                          {material.descripcion}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {material.laboratorio_nombre || '—'}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {material.cantidad_total}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {valor > 0 ? `S/ ${valor.toFixed(2)}` : '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  {material.depreciacion_categoria_nombre ? (
                    <Chip
                      label={`${material.depreciacion_categoria_nombre} ${parseFloat(porcentaje.toFixed(4))}%`}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  ) : (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      Sin categoría
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  {configurado ? (
                    <Tooltip title={`${parseFloat(porcentaje.toFixed(4))}% de S/ ${valor.toFixed(2)} por unidad y por práctica`}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                        S/ {costo.toFixed(4)}
                      </Typography>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Configura el valor unitario y la categoría para cobrar depreciación">
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Sin configurar
                      </Typography>
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={activo ? 'Activo' : 'Inactivo'}
                    size="small"
                    color={activo ? 'success' : 'default'}
                    variant={activo ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell align="center">
                  <ActionMenu
                    onEdit={() => onEdit(material)}
                    onDelete={() => onDelete(material)}
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
        count={materiales.length}
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
