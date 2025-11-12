import React from 'react'
import {
  Box,
  Typography,
  Chip,
  Alert,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  InputAdornment,
  Divider
} from '@mui/material'
import { Inventory, Delete, Add } from '@mui/icons-material'

export interface InsumoUsado {
  id: number
  nombre: string
  cantidad: number
  unidad_medida: string
  lote_detalle_id?: number
  lote?: string
  cantidad_requerida: number
  uniqueId?: string | number // Identificador único para cada entrada (permite múltiples lotes del mismo insumo)
}

export interface EntradaLote {
  uniqueId: string | number
  lote_detalle_id?: number
  lote?: string
  cantidad: number
}

export interface LoteDisponible {
  detalle_id: number
  lote: string
  saldo: number
  fecha_vencimiento: string | null
}

interface InsumosUsadosFormProps {
  insumosUsados: InsumoUsado[]
  lotesDisponibles: Record<number, LoteDisponible[]>
  onActualizarCantidad: (uniqueId: string | number, nuevaCantidad: number) => void
  onActualizarLote: (uniqueId: string | number, loteDetalleId: number, lote: string) => void
  onEliminar: (uniqueId: string | number) => void
  onAgregarOtroLote?: (insumoId: number) => void
}

export const InsumosUsadosForm: React.FC<InsumosUsadosFormProps> = ({
  insumosUsados,
  lotesDisponibles,
  onActualizarCantidad,
  onActualizarLote,
  onEliminar,
  onAgregarOtroLote
}) => {
  if (insumosUsados.length === 0) {
    return (
      <Alert severity="info">
        <Typography variant="body2">
          Selecciona insumos de la lista izquierda para agregarlos aquí y modificar su cantidad y lote.
        </Typography>
      </Alert>
    )
  }

  // Agrupar insumos por id para mostrar múltiples lotes del mismo insumo
  const insumosAgrupados = insumosUsados.reduce((acc, insumo) => {
    if (!acc[insumo.id]) {
      acc[insumo.id] = []
    }
    acc[insumo.id].push(insumo)
    return acc
  }, {} as Record<number, InsumoUsado[]>)

  return (
    <Box sx={{ flex: 1, overflow: 'auto' }}>
      {Object.entries(insumosAgrupados).map(([insumoId, entradas]) => {
        const primerInsumo = entradas[0]
        const cantidadTotal = entradas.reduce((sum, e) => sum + e.cantidad, 0)
        
        return (
          <Paper key={insumoId} sx={{ p: 2, mb: 2, border: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Inventory color="primary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {primerInsumo.nombre}
                </Typography>
                <Chip 
                  label={`Requerido: ${primerInsumo.cantidad_requerida} ${primerInsumo.unidad_medida}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                {entradas.length > 1 && (
                  <Chip 
                    label={`Total: ${cantidadTotal} ${primerInsumo.unidad_medida}`}
                    size="small"
                    color="success"
                  />
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {onAgregarOtroLote && (
                  <IconButton
                    onClick={() => onAgregarOtroLote(Number(insumoId))}
                    color="primary"
                    size="small"
                    disabled={(lotesDisponibles[Number(insumoId)] || []).length === 0}
                    sx={{
                      border: 1,
                      borderColor: 'primary.main',
                      '&:hover': {
                        bgcolor: 'primary.light',
                        color: 'white'
                      },
                      '&:disabled': {
                        borderColor: 'grey.300',
                        color: 'grey.400'
                      }
                    }}
                    title="Agregar otro lote"
                  >
                    <Add fontSize="small" />
                  </IconButton>
                )}
                {entradas.length === 1 ? (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onEliminar(entradas[0].uniqueId || entradas[0].id)}
                    title="Eliminar insumo"
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                ) : (
                  // Cuando hay múltiples entradas, no mostrar botón de eliminar en el header
                  // Cada entrada tiene su propio botón de eliminar
                  null
                )}
              </Box>
            </Box>
            
            {/* Lista de lotes/cantidades para este insumo */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {entradas.map((entrada, index) => {
                const uniqueId = entrada.uniqueId || `${insumoId}-${index}`
                const lotesUsados = entradas
                  .filter(e => e.lote_detalle_id)
                  .map(e => e.lote_detalle_id)
                const lotesDisponiblesFiltrados = (lotesDisponibles[Number(insumoId)] || []).filter(
                  lote => !lotesUsados.includes(lote.detalle_id) || lote.detalle_id === entrada.lote_detalle_id
                )

                return (
                  <Box key={uniqueId}>
                    {index > 0 && <Divider sx={{ my: 2 }} />}
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                      <TextField
                        sx={{ flex: 1, minWidth: 200 }}
                        label="Cantidad Usada"
                        type="number"
                        value={entrada.cantidad}
                        onChange={(e) => onActualizarCantidad(uniqueId, parseFloat(e.target.value) || 0)}
                        inputProps={{ min: 0 }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <Typography variant="body2" color="text.secondary">
                                {entrada.unidad_medida}
                              </Typography>
                            </InputAdornment>
                          )
                        }}
                      />
                      <FormControl sx={{ flex: 1, minWidth: 200 }}>
                        <InputLabel>Lote</InputLabel>
                        <Select<number>
                          value={entrada.lote_detalle_id || 0}
                          onChange={(e) => {
                            const loteId = Number(e.target.value)
                            const lotes = lotesDisponibles[Number(insumoId)] || []
                            const loteSeleccionado = lotes.find(l => l.detalle_id === loteId)
                            if (loteSeleccionado) {
                              onActualizarLote(uniqueId, loteId, loteSeleccionado.lote)
                            }
                          }}
                          label="Lote"
                        >
                          <MenuItem value={0}>
                            <em>Selecciona un lote</em>
                          </MenuItem>
                          {lotesDisponiblesFiltrados.map(lote => (
                            <MenuItem key={lote.detalle_id} value={lote.detalle_id}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                <Typography variant="body2">{lote.lote}</Typography>
                                <Chip
                                  label={`Saldo: ${lote.saldo}`}
                                  size="small"
                                  color={lote.saldo < 10 ? 'warning' : 'success'}
                                  sx={{ ml: 1 }}
                                />
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      {entradas.length > 1 && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onEliminar(uniqueId)}
                          sx={{ mt: 1 }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                    {entrada.lote && (
                      <Box sx={{ mt: 1 }}>
                        <Chip 
                          label={`Lote: ${entrada.lote} - ${entrada.cantidad} ${entrada.unidad_medida}`}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      </Box>
                    )}
                  </Box>
                )
              })}
            </Box>
          </Paper>
        )
      })}
    </Box>
  )
}

