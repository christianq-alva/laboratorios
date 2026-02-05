import React, { useState, useEffect } from 'react'
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
  CircularProgress,
  Alert,
  TablePagination,
} from '@mui/material'
import { Close, Visibility, Add, Remove, LocationOn, Person, Schedule } from '@mui/icons-material'
import { inventarioService } from '../../services/inventarioService'

interface DetalleMovimientoModalProps {
  open: boolean
  onClose: () => void
  movimientoId: number | null
}

export const DetalleMovimientoModal: React.FC<DetalleMovimientoModalProps> = ({
  open,
  onClose,
  movimientoId
}) => {
  const [cabecera, setCabecera] = useState<{
    id: number
    fecha_movimiento: string
    tipo_movimiento: 'entrada' | 'salida'
    fecha_ingreso: string | null
    observaciones: string | null
    laboratorio_nombre: string
    usuario_nombre: string
    usuario_rol: string
    reserva_descripcion: string | null
  } | null>(null)
  const [detalle, setDetalle] = useState<Array<{
    insumo_id: number
    insumo_codigo: string
    insumo_nombre: string
    unidad_simbolo: string
    unidad_nombre: string
    cantidad: number
    lote: string | null
  }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    if (open && movimientoId) {
      setError(null)
      setLoading(true)
      inventarioService.getDetalleMovimiento(movimientoId)
        .then((res) => {
          if (res.success && res.data) {
            setCabecera(res.data.cabecera)
            setDetalle(res.data.detalle || [])
            setPage(0)
          }
        })
        .catch((err: any) => {
          setError(err.response?.data?.message || err.message || 'Error al cargar el detalle del movimiento')
          setCabecera(null)
          setDetalle([])
        })
        .finally(() => setLoading(false))
    } else {
      setCabecera(null)
      setDetalle([])
      setError(null)
    }
  }, [open, movimientoId])

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const paginatedDetalle = detalle.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return 'N/A'
    try {
      return new Date(fecha).toLocaleString('es-PE', {
        timeZone: 'America/Lima',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour12: false
      })
    } catch {
      return 'Fecha inválida'
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Visibility color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Detalle de movimiento
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : cabecera ? (
          <Box>
            <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                <Chip
                  icon={cabecera.tipo_movimiento === 'entrada' ? <Add /> : <Remove />}
                  label={cabecera.tipo_movimiento === 'entrada' ? 'Entrada' : 'Salida'}
                  color={cabecera.tipo_movimiento === 'entrada' ? 'success' : 'error'}
                  size="small"
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Schedule fontSize="small" color="action" />
                  <Typography variant="body2">{formatFecha(cabecera.fecha_movimiento)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationOn fontSize="small" color="action" />
                  <Typography variant="body2">{cabecera.laboratorio_nombre}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Person fontSize="small" color="action" />
                  <Typography variant="body2">{cabecera.usuario_nombre} ({cabecera.usuario_rol})</Typography>
                </Box>
              </Box>
              {cabecera.observaciones && (
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  Observaciones: {cabecera.observaciones}
                </Typography>
              )}
              {cabecera.reserva_descripcion && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  Reserva: {cabecera.reserva_descripcion}
                </Typography>
              )}
            </Paper>

            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Insumos del movimiento
            </Typography>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Código</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Insumo</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Unidad</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Lote</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Cantidad</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detalle.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No hay líneas en este movimiento
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedDetalle.map((linea) => (
                      <TableRow key={`${linea.insumo_id}-${linea.lote || 'n'}`} hover>
                        <TableCell>{linea.insumo_codigo}</TableCell>
                        <TableCell>{linea.insumo_nombre}</TableCell>
                        <TableCell>{`${linea.unidad_simbolo} (${linea.unidad_nombre})`}</TableCell>
                        <TableCell>{linea.lote || '-'}</TableCell>
                        <TableCell align="right">{linea.cantidad} {linea.unidad_simbolo}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {detalle.length > 0 && (
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={detalle.length}
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
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
