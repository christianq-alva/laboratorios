import React from 'react'
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
  Divider
} from '@mui/material'
import { Close, Inventory, TrendingUp, TrendingDown } from '@mui/icons-material'
import type { InsumoSaldo } from '../../services/inventarioService'

interface Movimiento {
  id: number
  fecha: string
  tipo: 'entrada' | 'salida'
  cantidad: number
  laboratorio: string
  observaciones?: string
}

interface DetalleMovimientosModalProps {
  open: boolean
  onClose: () => void
  insumo: InsumoSaldo | null
}

export const DetalleMovimientosModal: React.FC<DetalleMovimientosModalProps> = ({
  open,
  onClose,
  insumo
}) => {
  // Datos de ejemplo (maqueta)
  const movimientosEjemplo: Movimiento[] = insumo ? [
    {
      id: 1,
      fecha: '2025-01-15 10:30:00',
      tipo: 'entrada',
      cantidad: 50,
      laboratorio: 'Laboratorio de Química',
      observaciones: 'Compra inicial'
    },
    {
      id: 2,
      fecha: '2025-01-20 14:15:00',
      tipo: 'salida',
      cantidad: 10,
      laboratorio: 'Laboratorio de Química',
      observaciones: 'Uso en práctica de laboratorio'
    },
    {
      id: 3,
      fecha: '2025-01-25 09:00:00',
      tipo: 'entrada',
      cantidad: 30,
      laboratorio: 'Laboratorio de Química',
      observaciones: 'Reabastecimiento'
    },
    {
      id: 4,
      fecha: '2025-02-01 16:45:00',
      tipo: 'salida',
      cantidad: 5,
      laboratorio: 'Laboratorio de Química',
      observaciones: 'Uso en experimento'
    },
    {
      id: 5,
      fecha: '2025-02-05 11:20:00',
      tipo: 'salida',
      cantidad: 15,
      laboratorio: 'Laboratorio de Química',
      observaciones: 'Uso en clase práctica'
    }
  ] : []

  // Calcular totales
  const totalEntradas = movimientosEjemplo
    .filter(m => m.tipo === 'entrada')
    .reduce((sum, m) => sum + m.cantidad, 0)
  
  const totalSalidas = movimientosEjemplo
    .filter(m => m.tipo === 'salida')
    .reduce((sum, m) => sum + m.cantidad, 0)

  const saldoActual = totalEntradas - totalSalidas

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
              Detalle de Movimientos
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
                                insumo.categoria === 'Materiales' ? '#2196f3' : '#4caf50',
                        color: 'white'
                      }}
                    />
                    <Chip 
                      label={`${insumo.unidad_medida}`} 
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
                    {totalEntradas} {insumo.unidad_medida}
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
                    {totalSalidas} {insumo.unidad_medida}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 150 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Saldo Actual
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {saldoActual} {insumo.unidad_medida}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Divider sx={{ mb: 2 }} />

            {/* Tabla de movimientos */}
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Historial de Movimientos
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">Tipo</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Cantidad</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Laboratorio</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Observaciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movimientosEjemplo.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No hay movimientos registrados para este insumo
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    movimientosEjemplo.map((movimiento) => (
                      <TableRow key={movimiento.id} hover>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(movimiento.fecha).toLocaleDateString('es-ES', {
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
                            label={movimiento.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                            size="small"
                            color={movimiento.tipo === 'entrada' ? 'success' : 'error'}
                            icon={movimiento.tipo === 'entrada' ? <TrendingUp /> : <TrendingDown />}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 600,
                              color: movimiento.tipo === 'entrada' ? 'success.main' : 'error.main'
                            }}
                          >
                            {movimiento.tipo === 'entrada' ? '+' : '-'}{movimiento.cantidad} {insumo.unidad_medida}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {movimiento.laboratorio}
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
            </TableContainer>
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

