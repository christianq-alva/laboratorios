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
  Divider,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import { Close, Inventory, LocationOn, ExpandMore, Warning, CheckCircle } from '@mui/icons-material'
import type { InsumoSaldo } from '../../services/inventarioService'
import { inventarioService } from '../../services/inventarioService'
import { useApi } from '../../hooks/useApi'
import type { Lote } from '../../services/inventarioService'

interface DetalleLotesModalProps {
  open: boolean
  onClose: () => void
  insumo: InsumoSaldo | null
  laboratorioId?: number | 'all' // ID del laboratorio seleccionado en el filtro
}

export const DetalleLotesModal: React.FC<DetalleLotesModalProps> = ({
  open,
  onClose,
  insumo,
  laboratorioId
}) => {
  const { execute } = useApi()
  const [lotes, setLotes] = useState<Lote[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar lotes cuando se abre el modal o cambia el filtro de laboratorio
  useEffect(() => {
    if (open && insumo) {
      loadLotes()
    } else {
      setLotes([])
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, insumo, laboratorioId])

  const loadLotes = async () => {
    if (!insumo) return

    setLoading(true)
    setError(null)

    // Convertir 'all' a undefined para que no se filtre
    const labId = laboratorioId === 'all' ? undefined : laboratorioId
    
    const result = await execute(() => inventarioService.getLotesPorInsumo(insumo.id, labId))
    
    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setLotes(result.data.data || [])
    }
    
    setLoading(false)
  }

  // Agrupar lotes por laboratorio
  const lotesPorLaboratorio = React.useMemo(() => {
    const grouped: Record<number, { laboratorio: string; codigo: string; lotes: Lote[] }> = {}
    
    lotes.forEach(lote => {
      if (!grouped[lote.laboratorio_id]) {
        grouped[lote.laboratorio_id] = {
          laboratorio: lote.laboratorio_nombre,
          codigo: lote.laboratorio_codigo,
          lotes: []
        }
      }
      grouped[lote.laboratorio_id].lotes.push(lote)
    })

    return grouped
  }, [lotes])

  // Calcular totales
  const totalLotes = lotes.length
  const totalStock = lotes.reduce((sum, lote) => sum + Number(lote.saldo), 0)
  const totalCantidadOriginal = lotes.reduce((sum, lote) => sum + lote.cantidad_original, 0)

  // Formatear fecha
  const formatFecha = (fecha: string | null) => {
    if (!fecha) return 'N/A'
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Obtener color del chip según el saldo
  const getSaldoColor = (saldo: number, cantidadOriginal: number) => {
    if (saldo === 0) return 'error'
    if (saldo < cantidadOriginal * 0.3) return 'warning'
    return 'success'
  }

  // Obtener color del chip según días para vencer
  const getVencimientoColor = (dias: number | null) => {
    if (dias === null) return 'default'
    if (dias < 0) return 'error' // Vencido
    if (dias <= 30) return 'warning' // Próximo a vencer
    return 'success'
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
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
              Detalle de Lotes
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

              {/* Resumen de lotes */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 150 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Total de Lotes
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {totalLotes}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 150 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Stock Total
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {totalStock} {insumo.unidad_medida}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 150 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Cantidad Original Total
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {totalCantidadOriginal} {insumo.unidad_medida}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Divider sx={{ mb: 2 }} />

            {/* Lista de lotes agrupados por laboratorio */}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            ) : Object.keys(lotesPorLaboratorio).length === 0 ? (
              <Alert severity="info">
                <Typography variant="body2">
                  No hay lotes registrados para este insumo
                </Typography>
              </Alert>
            ) : (
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Lotes por Laboratorio
                </Typography>
                {Object.entries(lotesPorLaboratorio).map(([labId, data]) => (
                  <Accordion key={labId} defaultExpanded sx={{ mb: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <LocationOn color="primary" />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {data.laboratorio} ({data.codigo})
                        </Typography>
                        <Chip 
                          label={`${data.lotes.length} lote${data.lotes.length !== 1 ? 's' : ''}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ ml: 'auto' }}
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: 'grey.50' }}>
                              <TableCell sx={{ fontWeight: 600 }}>Lote</TableCell>
                              <TableCell sx={{ fontWeight: 600 }} align="right">Cantidad Original</TableCell>
                              <TableCell sx={{ fontWeight: 600 }} align="right">Stock Disponible</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Fecha Ingreso</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Fecha Vencimiento</TableCell>
                              <TableCell sx={{ fontWeight: 600 }} align="center">Estado</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {data.lotes.map((lote) => (
                              <TableRow key={lote.detalle_id} hover>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                                    {lote.lote}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2">
                                    {lote.cantidad_original} {lote.unidad_medida}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Chip
                                    label={`${lote.saldo} ${lote.unidad_medida}`}
                                    size="small"
                                    color={getSaldoColor(lote.saldo, lote.cantidad_original)}
                                    sx={{ fontWeight: 600 }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {formatFecha(lote.fecha_ingreso)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  {lote.fecha_vencimiento ? (
                                    <Box>
                                      <Typography variant="body2">
                                        {formatFecha(lote.fecha_vencimiento)}
                                      </Typography>
                                      
                                    </Box>
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">
                                      Sin fecha
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell align="center">
                                {lote.dias_para_vencer !== null && (
                                        <Chip
                                          label={
                                            lote.dias_para_vencer < 0
                                              ? `Vencido`
                                              : lote.dias_para_vencer <= 30
                                              ? `${lote.dias_para_vencer} días`
                                              : 'Vigente'
                                          }
                                          size="small"
                                          color={getVencimientoColor(lote.dias_para_vencer)}
                                          sx={{ mt: 0.5 }}
                                          icon={
                                            lote.dias_para_vencer < 0 ? (
                                              <Warning fontSize="small" />
                                            ) : lote.dias_para_vencer <= 30 ? (
                                              <Warning fontSize="small" />
                                            ) : (
                                              <CheckCircle fontSize="small" />
                                            )
                                          }
                                        />
                                      )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
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

