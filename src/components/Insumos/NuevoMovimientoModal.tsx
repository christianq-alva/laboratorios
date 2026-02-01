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
} from '@mui/icons-material'
import { laboratorioService, type Laboratorio } from '../../services/laboratorioService'
import { inventarioService, type InsumoSaldo } from '../../services/inventarioService'
import { useApi } from '../../hooks/useApi'

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
  unidad_simbolo: string
  unidad_nombre: string
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
  const { execute } = useApi()
  const [laboratorioId, setLaboratorioId] = useState<number>(0)
  const [fechaMovimiento, setFechaMovimiento] = useState<string | null>(null)
  const [tipoMovimiento, setTipoMovimiento] = useState<'entrada' | 'salida'>('entrada')
  const [observaciones, setObservaciones] = useState('')
  const [detalles, setDetalles] = useState<DetalleMovimiento[]>([])

  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [insumos, setInsumos] = useState<InsumoSaldo[]>([])
  const [lotesDisponibles, setLotesDisponibles] = useState<LoteDisponible[]>([])

  const [insumosSaldo, setInsumosSaldo] = useState<InsumoSaldo[]>([])

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [insumoSeleccionado, setInsumoSeleccionado] = useState<number>(0)
  const [cantidadInput, setCantidadInput] = useState<number>(1)
  const [loteInput, setLoteInput] = useState('')
  const [fechaVencimientoInput, setFechaVencimientoInput] = useState('')

  // Para salidas: selección de lote disponible
  const [loteDisponibleSeleccionado, setLoteDisponibleSeleccionado] = useState<number>(0)


  //Al abrir o cerrar el modal
  useEffect(() => {
    if (open) {
      loadInitialData()
    } else {
      resetForm()
    }
  }, [open])

  //Al elegir el laboratorio ID
  useEffect(() => {
    if (laboratorioId > 0) {
      setInsumoSeleccionado(0)
      setLoteDisponibleSeleccionado(0)
      if (tipoMovimiento === 'entrada') {
        loadInsumos()
      } else if (tipoMovimiento === 'salida') {
        loadInsumosDisponibles()
      }
    }
  }, [laboratorioId, tipoMovimiento])

  //Al elegir el laboratorio ID
  useEffect(() => {
    if (tipoMovimiento === 'salida' && laboratorioId > 0 && insumoSeleccionado > 0) {
      loadLotesDisponibles()
    }
  }, [laboratorioId, tipoMovimiento, insumoSeleccionado])

  const loadInitialData = async () => {
    setLoadingData(true)
    setFechaMovimiento(new Date().toISOString().split('T')[0])
    const response = await execute(() => laboratorioService.getAll())
    if (response.error) {
      setError(response.error)
    } else if (response.data) {
      const sortedLaboratorios = [...(response.data.data || [])].sort((a, b) => a.nombre.localeCompare(b.nombre))
      setLaboratorios(sortedLaboratorios)
    }
    setLoadingData(false)
  }

  const loadInsumos = async () => {
    const response = await execute(() => inventarioService.getWithStock(laboratorioId))
    if (response.error) {
      setError(response.error)
    } else if (response.data) {
      setInsumos(response.data.data || [])
    }
  }

  const loadInsumosDisponibles = async () => {
    const response = await execute(() => inventarioService.getWithPositiveStock(laboratorioId))
    if (response.error) {
      setError(response.error)
    } else if (response.data) {
      setInsumosSaldo(response.data.data || [])
    }
  }

  const loadLotesDisponibles = async () => {
    const response = await execute(() => inventarioService.getLotesConSaldo(laboratorioId, insumoSeleccionado))
    if (response.error) {
      setError(response.error)
    } else if (response.data) {
      setLotesDisponibles(response.data.data || [])
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
    setFechaMovimiento(null)
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
        lote: loteInput,
        fecha_vencimiento: fechaVencimientoInput || ''
      }])
    } else if (tipoMovimiento === 'salida') {
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

    if (!observaciones.trim()) {
      setError('Las observaciones son obligatorias')
      return
    }

    if (detalles.length === 0) {
      setError('Agrega al menos un insumo al movimiento')
      return
    }

    setLoading(true)
    setError(null)

    const response = await execute(() => inventarioService.registrarMovimiento({
      laboratorio_id: laboratorioId,
      fecha_movimiento: fechaMovimiento,
      tipo_movimiento: tipoMovimiento,
      observaciones: observaciones.trim(),
      reserva_id: null,
      detalles: detalles.map(d => ({
        insumo_id: d.insumo_id,
        cantidad: d.cantidad,
        lote: d.lote || null,
        fecha_vencimiento: d.fecha_vencimiento || null,
        entrada_detalle_id: d.entrada_detalle_id || null
      }))
    }))
    if (response.error) {
      setError(response.error)
    } else if (response.data) {
      onSuccess()
      onClose()
    }
    setLoading(false)
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
                <TextField
                  sx={{ minWidth: 180 }}
                  type="date"
                  label="Fecha del Movimiento"
                  value={fechaMovimiento}
                  onChange={(e) => setFechaMovimiento(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
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
                required
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
                      {
                        tipoMovimiento == 'entrada' ?
                          insumos.map(ins => (
                            <MenuItem key={ins.id} value={ins.id}>
                              {ins.codigo} - {ins.nombre}
                            </MenuItem>
                          ))
                          :
                          insumosSaldo.map(inssaldo => (
                            <MenuItem key={inssaldo.id} value={inssaldo.id}>
                              {inssaldo.codigo} - {inssaldo.nombre}
                            </MenuItem>
                          ))
                      }
                    </Select>
                  </FormControl>
                  {tipoMovimiento === 'salida' ? (
                    <FormControl sx={{ minWidth: 280, flex: 1 }} required>
                      <InputLabel>Lote a Reducir</InputLabel>
                      <Select
                        value={loteDisponibleSeleccionado}
                        onChange={(e) => setLoteDisponibleSeleccionado(Number(e.target.value))}
                        label="Lote a Reducir"
                        disabled={!insumoSeleccionado}
                      >
                        {lotesDisponibles.map(lote => (
                          <MenuItem key={lote.detalle_id} value={lote.detalle_id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                              <Typography variant="body2">
                                {lote.lote}
                              </Typography>
                              <Typography variant="body2">
                                {lote.fecha_vencimiento}
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
                  ) : ''}
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
                  ) : ''}

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

