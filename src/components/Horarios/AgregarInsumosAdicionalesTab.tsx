import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  TextField,
  Autocomplete,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material'
import { Search, Inventory, Add } from '@mui/icons-material'
import { insumoService, type Insumo } from '../../services/insumoService'
import { InsumosUsadosForm, type InsumoUsado, type LoteDisponible } from './InsumosUsadosForm'

interface AgregarInsumosAdicionalesTabProps {
  insumosUsados: InsumoUsado[]
  laboratorioId: number | null
  lotesDisponibles: Record<number, LoteDisponible[]>
  onAgregarInsumo: (insumo: InsumoUsado) => void
  onActualizarCantidad: (uniqueId: string | number, nuevaCantidad: number) => void
  onActualizarLote: (uniqueId: string | number, loteDetalleId: number, lote: string) => void
  onEliminar: (uniqueId: string | number) => void
  onAgregarOtroLote?: (insumoId: number) => void
}

export const AgregarInsumosAdicionalesTab: React.FC<AgregarInsumosAdicionalesTabProps> = ({
  insumosUsados,
  laboratorioId,
  lotesDisponibles,
  onAgregarInsumo,
  onActualizarCantidad,
  onActualizarLote,
  onEliminar,
  onAgregarOtroLote
}) => {
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [insumoSeleccionado, setInsumoSeleccionado] = useState<Insumo | null>(null)
  const [cantidad, setCantidad] = useState<number>(1)
  const [loteDetalleId, setLoteDetalleId] = useState<number | null>(null)
  const [lote, setLote] = useState<string>('')
  const [lotesInsumoSeleccionado, setLotesInsumoSeleccionado] = useState<Array<{
    detalle_id: number
    lote: string
    saldo: number
    fecha_vencimiento: string | null
  }>>([])
  const [loading, setLoading] = useState(false)
  const [loadingLotes, setLoadingLotes] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar catálogo de insumos
  useEffect(() => {
    loadInsumos()
  }, [])

  const loadInsumos = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await insumoService.getAllInsumos()
      if (response.data) {
        setInsumos(response.data || [])
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar insumos')
    } finally {
      setLoading(false)
    }
  }

  // Cargar lotes cuando se selecciona un insumo
  useEffect(() => {
    if (insumoSeleccionado && laboratorioId) {
      loadLotes(insumoSeleccionado.id)
    } else {
      setLotesInsumoSeleccionado([])
      setLoteDetalleId(null)
      setLote('')
    }
  }, [insumoSeleccionado, laboratorioId])

  const loadLotes = async (insumoId: number) => {
    if (!laboratorioId) return
    
    setLoadingLotes(true)
    try {
      const response = await insumoService.getLotesConSaldo(laboratorioId, insumoId)
      if (response.data) {
        setLotesInsumoSeleccionado(response.data || [])
      }
    } catch (err: any) {
      console.error('Error al cargar lotes:', err)
      setLotesInsumoSeleccionado([])
    } finally {
      setLoadingLotes(false)
    }
  }

  const handleAgregar = () => {
    if (!insumoSeleccionado || cantidad <= 0) {
      setError('Selecciona un insumo y una cantidad válida')
      return
    }

    if (lotesInsumoSeleccionado.length > 0 && !loteDetalleId) {
      setError('Selecciona un lote para este insumo')
      return
    }

    const insumoUsado: InsumoUsado = {
      id: insumoSeleccionado.id,
      nombre: insumoSeleccionado.nombre,
      cantidad: cantidad,
      unidad_medida: insumoSeleccionado.unidad_medida || 'unidades',
      lote_detalle_id: loteDetalleId || undefined,
      lote: lote || undefined,
      cantidad_requerida: 0, // No es requerido, es adicional
      uniqueId: `add-${insumoSeleccionado.id}-${Date.now()}`
    }

    onAgregarInsumo(insumoUsado)
    
    // Reset form
    setInsumoSeleccionado(null)
    setCantidad(1)
    setLoteDetalleId(null)
    setLote('')
    setError(null)
  }

  const insumosYaAgregados = insumosUsados.map(i => i.id)
  const insumosFiltrados = insumos.filter(i => !insumosYaAgregados.includes(i.id))

  return (
    <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', gap: 3 }}>
      {/* Columna Izquierda: Agregar Insumos Adicionales */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'auto' }}>
        <Alert severity="info" sx={{ mb: 1 }}>
          <Typography variant="body2">
            Agrega insumos adicionales que no estaban en los requeridos inicialmente. Selecciona el insumo, cantidad y lote.
          </Typography>
        </Alert>

        {/* Formulario para agregar insumo */}
        <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
          Agregar Insumo Adicional
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Selector de insumo */}
          <Autocomplete
            options={insumosFiltrados}
            getOptionLabel={(option) => `${option.codigo || ''} - ${option.nombre}`.trim()}
            loading={loading}
            value={insumoSeleccionado}
            onChange={(_, newValue) => {
              setInsumoSeleccionado(newValue)
              setCantidad(1)
              setLoteDetalleId(null)
              setLote('')
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Buscar Insumo"
                placeholder="Escribe para buscar..."
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                  endAdornment: (
                    <React.Fragment>
                      {loading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </React.Fragment>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <ListItem {...props} key={option.id}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {option.nombre}
                      </Typography>
                      {option.codigo && (
                        <Chip label={option.codigo} size="small" variant="outlined" />
                      )}
                      <Chip 
                        label={option.categoria} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary">
                      {option.descripcion}
                    </Typography>
                  }
                />
              </ListItem>
            )}
          />

          {/* Cantidad */}
          <TextField
            label="Cantidad"
            type="number"
            value={cantidad}
            onChange={(e) => setCantidad(Number(e.target.value) || 0)}
            inputProps={{ min: 1 }}
            helperText={insumoSeleccionado ? `Unidad: ${insumoSeleccionado.unidad_medida || 'unidades'}` : ''}
          />

          {/* Selector de lote (solo si hay lotes disponibles) */}
          {loadingLotes && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Cargando lotes disponibles...
              </Typography>
            </Box>
          )}

          {!loadingLotes && lotesInsumoSeleccionado.length > 0 && (
            <Autocomplete
              options={lotesInsumoSeleccionado}
              getOptionLabel={(option) => `${option.lote} (Saldo: ${option.saldo})`}
              value={lotesInsumoSeleccionado.find(l => l.detalle_id === loteDetalleId) || null}
              onChange={(_, newValue) => {
                if (newValue) {
                  setLoteDetalleId(newValue.detalle_id)
                  setLote(newValue.lote)
                } else {
                  setLoteDetalleId(null)
                  setLote('')
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Seleccionar Lote"
                  placeholder="Selecciona un lote"
                  required
                />
              )}
              renderOption={(props, option) => (
                <ListItem {...props} key={option.detalle_id}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body1">{option.lote}</Typography>
                        <Chip
                          label={`Saldo: ${option.saldo}`}
                          size="small"
                          color={option.saldo < 10 ? 'warning' : 'success'}
                        />
                        {option.fecha_vencimiento && (
                          <Chip
                            label={`Vence: ${new Date(option.fecha_vencimiento).toLocaleDateString('es-ES')}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              )}
            />
          )}

          {!loadingLotes && lotesInsumoSeleccionado.length === 0 && insumoSeleccionado && (
            <Alert severity="warning">
              <Typography variant="body2">
                No hay lotes disponibles para este insumo en este laboratorio.
              </Typography>
            </Alert>
          )}

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Box
              component="button"
              onClick={handleAgregar}
              disabled={!insumoSeleccionado || cantidad <= 0 || (lotesInsumoSeleccionado.length > 0 && !loteDetalleId)}
              sx={{
                px: 2,
                py: 1,
                bgcolor: 'primary.main',
                color: 'white',
                border: 'none',
                borderRadius: 1,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
                '&:hover': {
                  bgcolor: 'primary.dark'
                },
                '&:disabled': {
                  bgcolor: 'grey.300',
                  cursor: 'not-allowed'
                }
              }}
            >
              Agregar Insumo
            </Box>
          </Box>
        </Box>
        </Paper>

        {/* Lista de insumos disponibles */}
        {insumosFiltrados.length > 0 && (
          <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Insumos Disponibles ({insumosFiltrados.length})
            </Typography>
            <List sx={{ maxHeight: 'calc(100vh - 500px)', overflow: 'auto', py: 0 }}>
              {insumosFiltrados.map((insumo) => (
                <ListItemButton
                  key={insumo.id}
                  onClick={() => {
                    setInsumoSeleccionado(insumo)
                    setCantidad(1)
                  }}
                  sx={{
                    border: 1,
                    borderColor: insumoSeleccionado?.id === insumo.id ? 'primary.main' : 'divider',
                    borderRadius: 1,
                    mb: 0.5,
                    py: 0.75,
                    bgcolor: insumoSeleccionado?.id === insumo.id ? 'action.selected' : 'transparent'
                  }}
                >
                  <Inventory sx={{ mr: 2, color: 'primary.main' }} />
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {insumo.nombre}
                        </Typography>
                        {insumo.codigo && (
                          <Chip label={insumo.codigo} size="small" variant="outlined" />
                        )}
                        <Chip 
                          label={insumo.categoria} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={insumo.descripcion}
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        )}
      </Box>

      {/* Columna Derecha: Insumos Usados Realmente */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Add color="success" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Insumos Usados Realmente
              </Typography>
              {insumosUsados.length > 0 && (
                <Chip 
                  label={insumosUsados.length} 
                  size="small" 
                  color="success" 
                  variant="outlined"
                />
              )}
            </Box>

            <InsumosUsadosForm
              insumosUsados={insumosUsados}
              lotesDisponibles={lotesDisponibles}
              onActualizarCantidad={onActualizarCantidad}
              onActualizarLote={onActualizarLote}
              onEliminar={onEliminar}
              onAgregarOtroLote={onAgregarOtroLote}
            />
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

