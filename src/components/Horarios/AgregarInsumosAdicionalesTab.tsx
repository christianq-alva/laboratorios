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
import { InsumosUsadosForm, type InsumoUsado, type LoteDisponible } from './RegistrarInsumosDrawer'

interface AgregarInsumosAdicionalesTabProps {
  insumosUsados: InsumoUsado[]
  laboratorioId: number | null
  lotesDisponibles: Record<number, LoteDisponible[]>
  stockDisponible?: Record<number, number>
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
  stockDisponible = {},
  onAgregarInsumo,
  onActualizarCantidad,
  onActualizarLote,
  onEliminar,
  onAgregarOtroLote
}) => {
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [insumoSeleccionado, setInsumoSeleccionado] = useState<Insumo | null>(null)
  const [loading, setLoading] = useState(false)
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

  const handleAgregarInsumo = (insumo: Insumo) => {
    const insumoUsado: InsumoUsado = {
      id: insumo.id,
      nombre: insumo.nombre,
      cantidad: 1, // Valor por defecto, se puede editar en el lado derecho
      unidad_medida: insumo.unidad_medida || 'unidades',
      cantidad_requerida: 0, // No es requerido, es adicional
      uniqueId: `add-${insumo.id}-${Date.now()}`
    }

    onAgregarInsumo(insumoUsado)
    
    // Reset form
    setInsumoSeleccionado(null)
    setError(null)
  }

  const insumosYaAgregados = insumosUsados.map(i => i.id)
  const insumosFiltrados = insumos.filter(i => !insumosYaAgregados.includes(i.id))

  return (
    <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', gap: 3 }}>
      {/* Columna Izquierda: Agregar Insumos Adicionales */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'auto' }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Agrega insumos adicionales que no estaban en los requeridos inicialmente. Selecciona el insumo y luego edita la cantidad y lote en el lado derecho.
          </Typography>
        </Alert>

        {/* Formulario para agregar insumo */}
        <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 3 }}>
          Agregar Insumo Adicional
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Selector de insumo */}
          <Autocomplete
            options={insumosFiltrados}
            getOptionLabel={(option) => `${option.codigo || ''} - ${option.nombre}`.trim()}
            loading={loading}
            value={insumoSeleccionado}
            onChange={(_, newValue) => {
              if (newValue) {
                handleAgregarInsumo(newValue)
              } else {
                setInsumoSeleccionado(null)
              }
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
            renderOption={(props, option) => {
              const stock = stockDisponible[option.id] || 0
              const stockColor = stock === 0 ? 'error' : stock < 10 ? 'warning' : 'success'
              return (
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
                        <Chip 
                          label={`Stock: ${stock}`}
                          size="small"
                          color={stockColor}
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
              )
            }}
          />
        </Box>
        </Paper>

        {/* Lista de insumos disponibles */}
        {insumosFiltrados.length > 0 && (
          <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Insumos Disponibles ({insumosFiltrados.length})
            </Typography>
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {insumosFiltrados.map((insumo) => {
                const stock = stockDisponible[insumo.id] || 0
                const stockColor = stock === 0 ? 'error' : stock < 10 ? 'warning' : 'success'
                return (
                  <ListItemButton
                    key={insumo.id}
                    onClick={() => {
                      handleAgregarInsumo(insumo)
                    }}
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': {
                        bgcolor: 'action.hover',
                        borderColor: 'primary.main'
                      }
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
                          <Chip 
                            label={`Stock: ${stock}`}
                            size="small"
                            color={stockColor}
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={insumo.descripcion}
                    />
                  </ListItemButton>
                )
              })}
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

