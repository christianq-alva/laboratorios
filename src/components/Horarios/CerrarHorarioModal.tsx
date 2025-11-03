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
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip
} from '@mui/material'
import {
  Close,
  CheckCircle,
  Add,
  Delete,
  Warning
} from '@mui/icons-material'
import { horarioService } from '../../services/horarioService'
import { insumoService } from '../../services/insumoService'

interface CerrarHorarioModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  horarioId: number | null
  fecha: string
}

interface InsumoRequerido {
  id: number
  nombre: string
  cantidad_requerida: number
  unidad_medida: string
}

interface EquipoRequerido {
  id: number
  nombre: string
  cantidad_requerida: number
}

interface ConsumoInsumo {
  insumo_id: number
  lote_detalle_id: number
  cantidad: number
  lote: string
  saldo_disponible: number
}

interface LoteDisponible {
  detalle_id: number
  lote: string
  saldo: number
  fecha_vencimiento: string | null
}

export const CerrarHorarioModal: React.FC<CerrarHorarioModalProps> = ({
  open,
  onClose,
  onSuccess,
  horarioId,
  fecha
}) => {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [insumosRequeridos, setInsumosRequeridos] = useState<InsumoRequerido[]>([])
  const [equiposRequeridos, setEquiposRequeridos] = useState<EquipoRequerido[]>([])
  const [laboratorioId, setLaboratorioId] = useState<number>(0)

  const [consumosInsumos, setConsumosInsumos] = useState<ConsumoInsumo[]>([])
  const [lotesDisponibles, setLotesDisponibles] = useState<Record<number, LoteDisponible[]>>({})

  // Estados para agregar consumo
  const [insumoSeleccionado, setInsumoSeleccionado] = useState<number>(0)
  const [loteSeleccionado, setLoteSeleccionado] = useState<number>(0)
  const [cantidadConsumo, setCantidadConsumo] = useState<number>(1)

  useEffect(() => {
    if (open && horarioId) {
      if (!open) console.log("equiposRequeridos", equiposRequeridos) //Observación: Hay que borrarlo      
      loadHorarioData()
    } else {
      resetForm()
    }
  }, [open, horarioId])

  const loadHorarioData = async () => {
    if (!horarioId) return

    setLoadingData(true)
    setError(null)

    try {
      const response = await horarioService.getById(horarioId)

      if (!response.success || !response.data) {
        throw new Error('No se pudo cargar el horario')
      }

      const horario = response.data
      setLaboratorioId(horario.laboratorio_id)

      // Cargar insumos requeridos
      const insumos = horario.insumos?.map((i: any) => ({
        id: i.id,
        nombre: i.nombre,
        cantidad_requerida: i.cantidad_usada || 0,
        unidad_medida: i.unidad_medida || 'unidades'
      })) || []
      setInsumosRequeridos(insumos)

      // Cargar equipos requeridos
      const equipos = horario.equipos?.map((e: any) => ({
        id: e.id,
        nombre: e.nombre,
        cantidad_requerida: e.cantidad_usada || 1
      })) || []
      setEquiposRequeridos(equipos)

      // Cargar lotes disponibles para cada insumo
      if (insumos.length > 0 && horario.laboratorio_id) {
        const lotesData: Record<number, LoteDisponible[]> = {}

        for (const insumo of insumos) {
          const lotesRes = await insumoService.getLotesConSaldo(horario.laboratorio_id, insumo.id)
          lotesData[insumo.id] = lotesRes.data.map(l => ({
            detalle_id: l.detalle_id,
            lote: l.lote,
            saldo: l.saldo,
            fecha_vencimiento: l.fecha_vencimiento
          }))
        }

        setLotesDisponibles(lotesData)
      }

    } catch (err: any) {
      setError(err.message || 'Error al cargar datos del horario')
      console.error('Error:', err)
    } finally {
      setLoadingData(false)
    }
  }

  const resetForm = () => {
    setInsumosRequeridos([])
    setEquiposRequeridos([])
    setConsumosInsumos([])
    setLotesDisponibles({})
    setLaboratorioId(0)
    setInsumoSeleccionado(0)
    setLoteSeleccionado(0)
    setCantidadConsumo(1)
    setError(null)
  }

  const handleAgregarConsumo = () => {
    if (!insumoSeleccionado || !loteSeleccionado || cantidadConsumo <= 0) {
      setError('Completa todos los campos')
      return
    }

    const insumo = insumosRequeridos.find(i => i.id === insumoSeleccionado)
    const lotes = lotesDisponibles[insumoSeleccionado] || []
    const lote = lotes.find(l => l.detalle_id === loteSeleccionado)

    if (!insumo || !lote) {
      setError('Datos inválidos')
      return
    }

    if (cantidadConsumo > lote.saldo) {
      setError(`La cantidad no puede ser mayor al saldo disponible (${lote.saldo})`)
      return
    }

    // Verificar que no exceda lo requerido
    const consumidoActual = consumosInsumos
      .filter(c => c.insumo_id === insumoSeleccionado)
      .reduce((sum, c) => sum + c.cantidad, 0)

    if (consumidoActual + cantidadConsumo > insumo.cantidad_requerida) {
      setError(`No puedes consumir más de lo requerido (${insumo.cantidad_requerida})`)
      return
    }

    setConsumosInsumos(prev => [...prev, {
      insumo_id: insumoSeleccionado,
      lote_detalle_id: loteSeleccionado,
      cantidad: cantidadConsumo,
      lote: lote.lote,
      saldo_disponible: lote.saldo
    }])

    // Reset campos
    setInsumoSeleccionado(0)
    setLoteSeleccionado(0)
    setCantidadConsumo(1)
    setError(null)
  }

  const handleEliminarConsumo = (index: number) => {
    setConsumosInsumos(prev => prev.filter((_, i) => i !== index))
  }

  const getCantidadConsumida = (insumoId: number) => {
    return consumosInsumos
      .filter(c => c.insumo_id === insumoId)
      .reduce((sum, c) => sum + c.cantidad, 0)
  }

  const handleCerrarHorario = async () => {
    if (consumosInsumos.length === 0) {
      setError('Agrega al menos un consumo de insumo')
      return
    }

    // Validar que se haya consumido todo lo requerido
    for (const insumo of insumosRequeridos) {
      const consumido = getCantidadConsumida(insumo.id)
      if (consumido < insumo.cantidad_requerida) {
        setError(`Falta consumir ${insumo.cantidad_requerida - consumido} de ${insumo.nombre}`)
        return
      }
    }

    setLoading(true)
    setError(null)
    
    try {
      await horarioService.cerrarHorario({
        laboratorio_id: laboratorioId,
        tipo_movimiento: 'salida',
        observaciones: `Consumo de inventario en horarioId: ${horarioId!}`,
        reserva_id: horarioId!,
        fecha_movimiento: fecha,
        detalles: consumosInsumos.map(c => ({
          insumo_id: c.insumo_id,
          cantidad: c.cantidad, 
          lote: null,
          fecha_vencimiento: null,
          entrada_detalle_id: c.lote_detalle_id
        }))
      })

      onSuccess()
      onClose()
    } catch (err: any) {
        setError(err.message || 'Error al cerrar el horario')
      } finally {
        setLoading(false)
      }
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
              <CheckCircle color="success" />
              <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                Cerrar Horario
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

              <Alert severity="info">
                <Typography variant="body2">
                  Registra el consumo real de insumos durante la clase. Selecciona manualmente los lotes utilizados.
                </Typography>
              </Alert>

              {/* Tabla de insumos requeridos */}
              <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Insumos Requeridos
                </Typography>

                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Insumo</TableCell>
                      <TableCell align="center">Requerido</TableCell>
                      <TableCell align="center">Consumido</TableCell>
                      <TableCell align="center">Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {insumosRequeridos.map(insumo => {
                      const consumido = getCantidadConsumida(insumo.id)
                      const completo = consumido >= insumo.cantidad_requerida

                      return (
                        <TableRow key={insumo.id}>
                          <TableCell>{insumo.nombre}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${insumo.cantidad_requerida} ${insumo.unidad_medida}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${consumido} ${insumo.unidad_medida}`}
                              size="small"
                              color={completo ? 'success' : 'warning'}
                            />
                          </TableCell>
                          <TableCell align="center">
                            {completo ? (
                              <CheckCircle color="success" fontSize="small" />
                            ) : (
                              <Warning color="warning" fontSize="small" />
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </Paper>

              {/* Agregar consumos */}
              <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 3 }}>
                  Registrar Consumo
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                  <FormControl sx={{ minWidth: 200, flex: 1 }} required>
                    <InputLabel>Insumo</InputLabel>
                    <Select
                      value={insumoSeleccionado}
                      onChange={(e) => {
                        setInsumoSeleccionado(Number(e.target.value))
                        setLoteSeleccionado(0)
                      }}
                      label="Insumo"
                    >
                      {insumosRequeridos.map(insumo => (
                        <MenuItem key={insumo.id} value={insumo.id}>
                          {insumo.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl sx={{ minWidth: 250, flex: 1 }} required disabled={!insumoSeleccionado}>
                    <InputLabel>Lote a Reducir</InputLabel>
                    <Select
                      value={loteSeleccionado}
                      onChange={(e) => setLoteSeleccionado(Number(e.target.value))}
                      label="Lote a Reducir"
                    >
                      {(lotesDisponibles[insumoSeleccionado] || []).map(lote => (
                        <MenuItem key={lote.detalle_id} value={lote.detalle_id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <Typography variant="body2">{lote.lote}</Typography>
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

                  <TextField
                    sx={{ minWidth: 120 }}
                    type="number"
                    label="Cantidad"
                    value={cantidadConsumo}
                    onChange={(e) => setCantidadConsumo(Number(e.target.value))}
                    inputProps={{ min: 1 }}
                    required
                  />

                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleAgregarConsumo}
                    sx={{ minWidth: 120 }}
                  >
                    Agregar
                  </Button>
                </Box>

                {/* Tabla de consumos agregados */}
                {consumosInsumos.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Consumos Registrados ({consumosInsumos.length})
                    </Typography>
                    <Paper variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Insumo</TableCell>
                            <TableCell>Lote</TableCell>
                            <TableCell align="right">Cantidad</TableCell>
                            <TableCell align="right">Saldo Lote</TableCell>
                            <TableCell align="center">Acciones</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {consumosInsumos.map((consumo, index) => {
                            const insumo = insumosRequeridos.find(i => i.id === consumo.insumo_id)
                            return (
                              <TableRow key={index}>
                                <TableCell>{insumo?.nombre}</TableCell>
                                <TableCell>{consumo.lote}</TableCell>
                                <TableCell align="right">
                                  <Chip label={consumo.cantidad} size="small" color="error" />
                                </TableCell>
                                <TableCell align="right">{consumo.saldo_disponible}</TableCell>
                                <TableCell align="center">
                                  <Tooltip title="Eliminar">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleEliminarConsumo(index)}
                                    >
                                      <Delete fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </Paper>
                  </Box>
                )}
              </Paper>
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
            onClick={handleCerrarHorario}
            disabled={loading || consumosInsumos.length === 0}
            variant="contained"
            color="success"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
            sx={{ minWidth: 150 }}
          >
            {loading ? 'Cerrando...' : 'Cerrar Horario'}
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

