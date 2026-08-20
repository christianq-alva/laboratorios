import React, { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  TablePagination,
} from '@mui/material'
import { Close, Inventory, TrendingUp, TrendingDown } from '@mui/icons-material'
import { inventarioService, type InsumoSaldo } from '../../services/inventarioService'

interface Movimiento {
  id: number
  fecha_movimiento: string
  tipo_movimiento: 'entrada' | 'salida'
  cantidad: number
  laboratorio_nombre: string
  observaciones: string | null
  lote: string | null
  fecha_ingreso: string | null
}

interface DetalleMovimientosInsumoModalProps {
  open: boolean
  onClose: () => void
  insumo: InsumoSaldo | null
  laboratorioId?: number
}

export const DetalleMovimientosInsumoModal: React.FC<DetalleMovimientosInsumoModalProps> = ({
  open,
  onClose,
  insumo,
  laboratorioId
}) => {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Paginación
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const loadMovimientos = useCallback(async () => {
    if (!insumo) return

    setLoading(true)
    setError(null)

    try {
      const response = await inventarioService.getActividadDetalleInsumos(
        insumo.id,
        laboratorioId
      )
      setMovimientos(response.data || [])
    } catch (err: any) {
      setError(err.message || 'Error al cargar los movimientos')
    } finally {
      setLoading(false)
    }
  }, [insumo, laboratorioId])

  // Cargar movimientos cuando se abre el modal y hay un insumo seleccionado
  useEffect(() => {
    if (open && insumo) {
      loadMovimientos()
      setPage(0)
    } else {
      // Limpiar datos cuando se cierra el modal
      setMovimientos([])
      setError(null)
    }
  }, [open, insumo, loadMovimientos])

  // Calcular totales
  const totalEntradas = movimientos
    .filter(m => m.tipo_movimiento === 'entrada')
    .length

  const totalSalidas = movimientos
    .filter(m => m.tipo_movimiento === 'salida')
    .length

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const paginatedMovimientos = movimientos.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Inventory color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Detalle de movimientos de insumo
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {insumo ? (
          <Box>
            {/* Información del insumo */}
            <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {insumo.nombre}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                    <Chip label={insumo.codigo} size="small" variant="outlined" />
                    <Chip
                      label={insumo.categoria}
                      size="small"
                      sx={{
                        bgcolor: insumo.categoria === 'Reactivos' ? '#ff9800' :
                                insumo.categoria === 'Materiales' ? '#2196f3' :
                                insumo.categoria === 'Farmacos' ? '#9c27b0' :
                                insumo.categoria === 'Insumos' ? '#009688' : '#4caf50',
                        color: 'white'
                      }}
                    />
                    <Chip
                      label={`${insumo.unidad_nombre}`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </Box>

              {/* Resumen de movimientos */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 150 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <TrendingUp color="success" fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      Total Entradas
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {totalEntradas} registro(s)
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 150 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <TrendingDown color="error" fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      Total Salidas
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>
                    {totalSalidas} registro(s)
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Divider sx={{ mb: 2 }} />

            {/* Tabla de movimientos */}
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Historial de Movimientos
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">Tipo</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Cantidad</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Lote</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Laboratorio</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Observaciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {movimientos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No hay movimientos registrados para este insumo
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedMovimientos.map((movimiento) => (
                        <TableRow key={movimiento.id} hover>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(movimiento.fecha_movimiento).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={movimiento.tipo_movimiento === 'entrada' ? 'Entrada' : 'Salida'}
                              size="small"
                              color={movimiento.tipo_movimiento === 'entrada' ? 'success' : 'error'}
                              icon={movimiento.tipo_movimiento === 'entrada' ? <TrendingUp /> : <TrendingDown />}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: movimiento.tipo_movimiento === 'entrada' ? 'success.main' : 'error.main'
                              }}
                            >
                              {movimiento.tipo_movimiento === 'entrada' ? '+' : '-'}{movimiento.cantidad} {insumo.unidad_nombre}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {movimiento.lote || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {movimiento.laboratorio_nombre}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {movimiento.observaciones || '-'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {movimientos.length > 0 && (
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={movimientos.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Filas por página:"
                    labelDisplayedRows={({ from, to, count }) =>
                      `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                    }
                  />
                )}
              </TableContainer>
            )}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No se ha seleccionado ningún insumo
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
