import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  InputAdornment,
  Chip
} from '@mui/material'
import { Close, History, AttachMoney } from '@mui/icons-material'
import { insumoService, type Insumo, type PrecioHistorial } from '../../../services/insumoService'
import { useApi } from '../../../hooks/useApi'
import dayjs from 'dayjs'

interface PrecioInsumoModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  insumo: Insumo | null
}

export const PrecioInsumoModal: React.FC<PrecioInsumoModalProps> = ({
  open,
  onClose,
  onSuccess,
  insumo
}) => {
  const { execute } = useApi()
  const [precioActual, setPrecioActual] = useState<number | null>(null)
  const [historial, setHistorial] = useState<PrecioHistorial[]>([])
  const [nuevoPrecio, setNuevoPrecio] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && insumo) {
      setNuevoPrecio('')
      setError(null)
      loadPrecio()
    }
  }, [open, insumo])

  const loadPrecio = async () => {
    if (!insumo) return
    setLoading(true)
    try {
      const data = await insumoService.getPrecio(insumo.id)
      setPrecioActual(data.precio_actual)
      setHistorial(data.historial)
    } catch {
      setError('Error al cargar el precio')
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!insumo) return
    const precio = parseFloat(nuevoPrecio)
    if (isNaN(precio) || precio < 0) {
      setError('Ingresa un precio válido (mayor o igual a 0)')
      return
    }

    setSaving(true)
    setError(null)
    const result = await execute(() => insumoService.setPrecio(insumo.id, precio))
    if (result.error) {
      setError(result.error)
    } else {
      onSuccess()
      await loadPrecio()
      setNuevoPrecio('')
    }
    setSaving(false)
  }

  const handleClose = () => {
    if (!saving) onClose()
  }

  const formatPrecio = (precio: number) =>
    `S/. ${Number(precio).toFixed(2)}`

  const formatFecha = (fecha: string) =>
    dayjs(fecha).format('DD/MM/YYYY HH:mm')

  // Datos de la presentación para derivar el precio unitario (regla de tres)
  const cantidadPresentacion = Number(insumo?.cantidad_por_presentacion) || 1
  const unidad = insumo?.unidad_simbolo || 'unidad'
  const formatPrecioUnitario = (precio: number) => {
    const unitario = precio / cantidadPresentacion
    return `S/. ${unitario.toFixed(unitario < 0.01 ? 4 : 2)} por ${unidad}`
  }
  const nuevoPrecioNum = parseFloat(nuevoPrecio)

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AttachMoney color="success" />
              Precio de la presentación — {insumo?.nombre}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
              {insumo?.presentacion ? `${insumo.presentacion} — ` : ''}
              {cantidadPresentacion !== 1
                ? `contiene ${cantidadPresentacion} ${unidad}`
                : `1 ${unidad} por presentación`}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} disabled={saving} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Precio actual */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">Precio actual de la presentación:</Typography>
              {precioActual !== null
                ? (
                  <Box>
                    <Chip label={formatPrecio(precioActual)} color="success" variant="outlined" sx={{ fontWeight: 700 }} />
                    {cantidadPresentacion !== 1 && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {formatPrecioUnitario(precioActual)}
                      </Typography>
                    )}
                  </Box>
                )
                : <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>Sin precio configurado</Typography>
              }
            </Box>

            {/* Aviso: contenido de la presentación sin configurar */}
            {cantidadPresentacion === 1 && insumo?.presentacion && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Este insumo tiene cantidad por presentación = 1. Si "{insumo.presentacion}" contiene
                más de 1 {unidad}, edita primero el insumo y configura la "Cantidad por presentación";
                de lo contrario el precio se tratará como precio por {unidad}.
              </Alert>
            )}

            {/* Nuevo precio */}
            <TextField
              fullWidth
              label="Nuevo precio de la presentación"
              type="number"
              value={nuevoPrecio}
              onChange={(e) => setNuevoPrecio(e.target.value)}
              disabled={saving}
              inputProps={{ min: 0, step: '0.01' }}
              InputProps={{
                startAdornment: <InputAdornment position="start">S/.</InputAdornment>
              }}
              placeholder="0.00"
              helperText={`Precio de la presentación completa${insumo?.presentacion ? ` (${insumo.presentacion})` : ''}. El precio anterior quedará guardado en el historial`}
              sx={{ mb: 2 }}
            />

            {/* Vista previa del precio unitario derivado */}
            {cantidadPresentacion !== 1 && !isNaN(nuevoPrecioNum) && nuevoPrecioNum >= 0 && nuevoPrecio !== '' && (
              <Alert severity="success" icon={false} sx={{ mb: 2, py: 0.5 }}>
                {`${formatPrecio(nuevoPrecioNum)} ÷ ${cantidadPresentacion} ${unidad} = `}
                <strong>{formatPrecioUnitario(nuevoPrecioNum)}</strong>
              </Alert>
            )}

            {/* Historial */}
            {historial.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <History fontSize="small" color="action" />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Historial de precios (por presentación)
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, maxHeight: 200, overflow: 'auto' }}>
                  {historial.map((registro) => (
                    <Box
                      key={registro.id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        px: 1.5,
                        py: 0.75,
                        borderRadius: 1,
                        bgcolor: registro.vigente_hasta === null ? 'success.50' : 'grey.50',
                        border: 1,
                        borderColor: registro.vigente_hasta === null ? 'success.200' : 'divider'
                      }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {formatPrecio(registro.precio)}
                        </Typography>
                        {registro.usuario_nombre && (
                          <Typography variant="caption" color="text.secondary">
                            por {registro.usuario_nombre}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Desde: {formatFecha(registro.vigente_desde)}
                        </Typography>
                        {registro.vigente_hasta ? (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Hasta: {formatFecha(registro.vigente_hasta)}
                          </Typography>
                        ) : (
                          <Chip label="Vigente" size="small" color="success" sx={{ height: 16, fontSize: '0.65rem' }} />
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" disabled={saving}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="success"
          disabled={!nuevoPrecio || saving || loading}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <AttachMoney />}
        >
          {saving ? 'Guardando...' : 'Guardar Precio'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
