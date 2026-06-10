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
      loadPrecio()
      setNuevoPrecio('')
      setError(null)
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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachMoney color="success" />
            Precio — {insumo?.nombre}
          </Typography>
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
              <Typography variant="body2" color="text.secondary">Precio actual:</Typography>
              {precioActual !== null
                ? <Chip label={formatPrecio(precioActual)} color="success" variant="outlined" sx={{ fontWeight: 700 }} />
                : <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>Sin precio configurado</Typography>
              }
            </Box>

            {/* Nuevo precio */}
            <TextField
              fullWidth
              label="Nuevo precio"
              type="number"
              value={nuevoPrecio}
              onChange={(e) => setNuevoPrecio(e.target.value)}
              disabled={saving}
              inputProps={{ min: 0, step: '0.01' }}
              InputProps={{
                startAdornment: <InputAdornment position="start">S/.</InputAdornment>
              }}
              placeholder="0.00"
              helperText="El precio anterior quedará guardado en el historial"
              sx={{ mb: 2 }}
            />

            {/* Historial */}
            {historial.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <History fontSize="small" color="action" />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Historial de precios
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
