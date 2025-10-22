import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Alert,
  CircularProgress,
  Chip,
  Tooltip
} from '@mui/material'
import {
  Close,
  Add,
  Delete,
  SwapHoriz,
  TrendingUp,
  TrendingDown,
  Search
} from '@mui/icons-material'
import { laboratorioService, type Laboratorio } from '../../services/laboratorioService'
import { insumoService, type Insumo } from '../../services/insumoService'

interface NuevoMovimientoModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface DetalleMovimiento {
  insumo_id: number
  insumo_nombre: string
  cantidad: number
  lote?: string
  fecha_vencimiento?: string
  entrada_detalle_id?: number
  saldo_disponible?: number
}

interface LoteDisponible {
  detalle_id: number
  insumo_id: number
  insumo_nombre: string
  insumo_codigo: string
  unidad_medida: string
  lote: string
  cantidad_original: number
  saldo: number
  fecha_vencimiento: string | null
  fecha_ingreso: string
  dias_para_vencer: number | null
}

export const NuevoMovimientoModal: React.FC<NuevoMovimientoModalProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const [laboratorioId, setLaboratorioId] = useState<number>(0)
  const [tipoMovimiento, setTipoMovimiento] = useState<'entrada' | 'salida'>('entrada')
  const [observaciones, setObservaciones] = useState('')
  const [detalles, setDetalles] = useState<DetalleMovimiento[]>([])
  
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [lotesDisponibles, setLotesDisponibles] = useState<LoteDisponible[]>([])
  
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [insumoSeleccionado, setInsumoSeleccionado] = useState<number>(0)
  const [cantidadInput, setCantidadInput] = useState<number>(1)
  const [loteInput, setLoteInput] = useState('')
  const [fechaVencimientoInput, setFechaVencimientoInput] = useState('')
  
  // Para salidas: selección de lote disponible
  const [loteDisponibleSeleccionado, setLoteDisponibleSeleccionado] = useState<number>(0)

  useEffect(() => {
    if (open) {
      loadInitialData()
    } else {
      resetForm()
    }
  }, [open])

  useEffect(() => {
    if (laboratorioId > 0) {
      loadInsumos()
      if (tipoMovimiento === 'salida') {
        loadLotesDisponibles()
      }
    }
  }, [laboratorioId, tipoMovimiento])

  const loadInitialData = async () => {
    setLoadingData(true)
    try {
      const [labsRes, insumosRes] = await Promise.all([
        laboratorioService.getAll(),
        insumoService.getAll()
      ])
      setLaboratorios(labsRes.data || [])
      setInsumos(insumosRes.data || [])
    } catch (error: any) {
      setError('Error al cargar datos iniciales')
      console.error('Error:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const loadInsumos = async () => {
    try {
      const response = await insumoService.getByLaboratorio(laboratorioId)
      setInsumos(response.data || [])
    } catch (error: any) {
      console.error('Error al cargar insumos:', error)
    }
  }

  const loadLotesDisponibles = async () => {
    try {
      const response = await insumoService.getLotesConSaldo(laboratorioId)
      setLotesDisponibles(response.data || [])
    } catch (error: any) {
      console.error('Error al cargar lotes disponibles:', error)
    }
  }

  const resetForm = () => {
    setLaboratorioId(0)
    setTipoMovimiento('entrada')
    setObservaciones('')
    setDetalles([])
    setInsumoSeleccionado(0)
    setCantidadInput(1)
    setLoteInput('')
    setFechaVencimientoInput('')
    setLoteDisponibleSeleccionado(0)
    setError(null)
  }

  const handleAgregarDetalle = () => {
    if (!insumoSeleccionado || cantidadInput <= 0) {
      setError('Selecciona un insumo y una cantidad válida')
      return
    }

    const insumo = insumos.find(i => i.id === insumoSeleccionado)
    if (!insumo) return

    if (tipoMovimiento === 'entrada') {
      // Para entradas, agregar con lote y fecha de vencimiento
      setDetalles(prev => [...prev, {
        insumo_id: insumoSeleccionado,
        insumo_nombre: insumo.nombre,
        cantidad: cantidadInput,
        lote: loteInput || `LOTE-${Date.now()}`,
        fecha_vencimiento: fechaVencimientoInput || ''
      }])
    } else {
      // Para salidas, agregar con referencia al lote de entrada
      const loteSeleccionado = lotesDisponibles.find(l => l.detalle_id === loteDisponibleSeleccionado)
      
      if (!loteSeleccionado) {
        setError('Selecciona un lote disponible para la salida')
        return
      }

      if (cantidadInput > loteSeleccionado.saldo) {
        setError(`La cantidad no puede ser mayor al saldo disponible (${loteSeleccionado.saldo})`)
        return
      }

      setDetalles(prev => [...prev, {
        insumo_id: insumoSeleccionado,
        insumo_nombre: insumo.nombre,
        cantidad: cantidadInput,
        entrada_detalle_id: loteSeleccionado.detalle_id,
        lote: loteSeleccionado.lote,
        saldo_disponible: loteSeleccionado.saldo
      }])
    }

    // Reset campos
    setInsumoSeleccionado(0)
    setCantidadInput(1)
    setLoteInput('')
    setFechaVencimientoInput('')
    setLoteDisponibleSeleccionado(0)
    setError(null)
  }

  const handleEliminarDetalle = (index: number) => {
    setDetalles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (laboratorioId === 0) {
      setError('Selecciona un laboratorio')
      return
    }

    if (detalles.length === 0) {
      setError('Agrega al menos un insumo al movimiento')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await insumoService.registrarMovimiento({
        laboratorio_id: laboratorioId,
        tipo_movimiento: tipoMovimiento,
        observaciones: observaciones.trim() || null,
        reserva_id: null,
        detalles: detalles.map(d => ({
          insumo_id: d.insumo_id,
          cantidad: d.cantidad,
          lote: d.lote || null,
          fecha_vencimiento: d.fecha_vencimiento || null,
          entrada_detalle_id: d.entrada_detalle_id || null
        }))
      })

      onSuccess()
      onClose()
    } catch (error: any) {
      setError(error.message || 'Error al registrar el movimiento')
    } finally {
      setLoading(false)
    }
  }

  const getLotesDelInsumo = (insumoId: number) => {
    return lotesDisponibles.filter(l => l.insumo_id === insumoId)
  }

  const getTipoMovimientoColor = () => {
    return tipoMovimiento === 'entrada' ? 'success' : 'error'
  }

  const getTipoMovimientoIcon = () => {
    return tipoMovimiento === 'entrada' ? <TrendingUp /> : <TrendingDown />
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, md: 2 },
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SwapHoriz color="primary" />
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              Nuevo Movimiento de Insumos
            </Typography>
          </Box>
          <IconButton onClick={onClose} disabled={loading} sx={{ color: 'grey.500' }}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {loadingData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Cargando datos...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Información básica del movimiento */}
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 3 }}>
                Información del Movimiento
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <FormControl sx={{ minWidth: 220, flex: 1 }} required>
                  <InputLabel>Laboratorio</InputLabel>
                  <Select
                    value={laboratorioId}
                    onChange={(e) => setLaboratorioId(Number(e.target.value))}
                    label="Laboratorio"
                    disabled={detalles.length > 0}
                  >
                    {laboratorios.map(lab => (
                      <MenuItem key={lab.id} value={lab.id}>
                        {lab.nombre} - {lab.ubicacion}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 180 }} required>
                  <InputLabel>Tipo de Movimiento</InputLabel>
                  <Select
                    value={tipoMovimiento}
                    onChange={(e) => setTipoMovimiento(e.target.value as 'entrada' | 'salida')}
                    label="Tipo de Movimiento"
                    disabled={detalles.length > 0}
                  >
                    <MenuItem value="entrada">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingUp color="success" fontSize="small" />
                        Entrada (Ingreso)
                      </Box>
                    </MenuItem>
                    <MenuItem value="salida">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingDown color="error" fontSize="small" />
                        Salida (Consumo)
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <TextField
                fullWidth
                label="Observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                multiline
                rows={2}
                placeholder="Motivo o descripción del movimiento"
              />
            </Paper>

            {/* Agregar detalles */}
            {laboratorioId > 0 && (
              <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 3 }}>
                  Agregar Insumos
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                  <FormControl sx={{ minWidth: 250, flex: 1 }} required>
                    <InputLabel>Insumo</InputLabel>
                    <Select
                      value={insumoSeleccionado}
                      onChange={(e) => {
                        setInsumoSeleccionado(Number(e.target.value))
                        setLoteDisponibleSeleccionado(0)
                      }}
                      label="Insumo"
                    >
                      {insumos.map(ins => (
                        <MenuItem key={ins.id} value={ins.id}>
                          {ins.codigo} - {ins.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    sx={{ minWidth: 120 }}
                    type="number"
                    label="Cantidad"
                    value={cantidadInput}
                    onChange={(e) => setCantidadInput(Number(e.target.value))}
                    inputProps={{ min: 1 }}
                    required
                  />

                  {tipoMovimiento === 'entrada' ? (
                    <>
                      <TextField
                        sx={{ minWidth: 150 }}
                        label="Lote"
                        value={loteInput}
                        onChange={(e) => setLoteInput(e.target.value)}
                        placeholder="Automático si vacío"
                      />
                      <TextField
                        sx={{ minWidth: 160 }}
                        type="date"
                        label="Fecha Vencimiento"
                        value={fechaVencimientoInput}
                        onChange={(e) => setFechaVencimientoInput(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </>
                  ) : (
                    <FormControl sx={{ minWidth: 280, flex: 1 }} required>
                      <InputLabel>Lote a Reducir</InputLabel>
                      <Select
                        value={loteDisponibleSeleccionado}
                        onChange={(e) => setLoteDisponibleSeleccionado(Number(e.target.value))}
                        label="Lote a Reducir"
                        disabled={!insumoSeleccionado}
                      >
                        {getLotesDelInsumo(insumoSeleccionado).map(lote => (
                          <MenuItem key={lote.detalle_id} value={lote.detalle_id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                              <Typography variant="body2">
                                {lote.lote}
                              </Typography>
                              <Chip
                                label={`Saldo: ${lote.saldo}`}
                                size="small"
                                color={lote.saldo < 10 ? 'warning' : 'success'}
                              />
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleAgregarDetalle}
                    sx={{ minWidth: 120 }}
                  >
                    Agregar
                  </Button>
                </Box>

                {/* Tabla de detalles agregados */}
                {detalles.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                      Insumos Agregados ({detalles.length})
                    </Typography>
                    <Paper variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Insumo</TableCell>
                            <TableCell align="right">Cantidad</TableCell>
                            <TableCell>Lote</TableCell>
                            {tipoMovimiento === 'entrada' && <TableCell>F. Vencimiento</TableCell>}
                            {tipoMovimiento === 'salida' && <TableCell align="right">Saldo Lote</TableCell>}
                            <TableCell align="center">Acciones</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {detalles.map((detalle, index) => (
                            <TableRow key={index}>
                              <TableCell>{detalle.insumo_nombre}</TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={detalle.cantidad}
                                  size="small"
                                  color={getTipoMovimientoColor()}
                                  icon={getTipoMovimientoIcon()}
                                />
                              </TableCell>
                              <TableCell>{detalle.lote || '-'}</TableCell>
                              {tipoMovimiento === 'entrada' && (
                                <TableCell>
                                  {detalle.fecha_vencimiento
                                    ? new Date(detalle.fecha_vencimiento).toLocaleDateString('es-ES')
                                    : '-'}
                                </TableCell>
                              )}
                              {tipoMovimiento === 'salida' && (
                                <TableCell align="right">{detalle.saldo_disponible || '-'}</TableCell>
                              )}
                              <TableCell align="center">
                                <Tooltip title="Eliminar">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleEliminarDetalle(index)}
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Paper>
                  </Box>
                )}
              </Paper>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
          sx={{ minWidth: 100 }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || detalles.length === 0}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SwapHoriz />}
          sx={{ minWidth: 150 }}
        >
          {loading ? 'Registrando...' : 'Registrar Movimiento'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

