import React from 'react'
import {
  Box,
  Typography,
  Alert,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Tooltip,
  IconButton
} from '@mui/material'
import { CheckCircle, Warning, Add, Delete } from '@mui/icons-material'

interface InsumoRequerido {
  id: number
  nombre: string
  cantidad_requerida: number
  unidad_medida: string
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

interface CerrarHorarioTabProps {
  insumosRequeridos: InsumoRequerido[]
  consumosInsumos: ConsumoInsumo[]
  lotesDisponibles: Record<number, LoteDisponible[]>
  insumoSeleccionado: number
  loteSeleccionado: number
  cantidadConsumo: number
  onInsumoChange: (insumoId: number) => void
  onLoteChange: (loteId: number) => void
  onCantidadChange: (cantidad: number) => void
  onAgregarConsumo: () => void
  onEliminarConsumo: (index: number) => void
  getCantidadConsumida: (insumoId: number) => number
}

export const CerrarHorarioTab: React.FC<CerrarHorarioTabProps> = ({
  insumosRequeridos,
  consumosInsumos,
  lotesDisponibles,
  insumoSeleccionado,
  loteSeleccionado,
  cantidadConsumo,
  onInsumoChange,
  onLoteChange,
  onCantidadChange,
  onAgregarConsumo,
  onEliminarConsumo,
  getCantidadConsumida
}) => {
  return (
    <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Mensaje informativo */}
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

        {insumosRequeridos.length === 0 ? (
          <Alert severity="info">
            <Typography variant="body2">
              No se registraron insumos requeridos para este horario
            </Typography>
          </Alert>
        ) : (
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
                        color="default"
                        variant="outlined"
                        sx={{ bgcolor: 'grey.100' }}
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
        )}
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
              onChange={(e) => onInsumoChange(Number(e.target.value))}
              label="Insumo"
            >
              <MenuItem value={0}>
                <em>Selecciona un insumo</em>
              </MenuItem>
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
              onChange={(e) => onLoteChange(Number(e.target.value))}
              label="Lote a Reducir"
            >
              <MenuItem value={0}>
                <em>Selecciona un lote</em>
              </MenuItem>
              {(lotesDisponibles[insumoSeleccionado] || []).map(lote => (
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

          <TextField
            sx={{ minWidth: 120 }}
            type="number"
            label="Cantidad"
            value={cantidadConsumo}
            onChange={(e) => onCantidadChange(Number(e.target.value))}
            inputProps={{ min: 1 }}
            required
          />

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onAgregarConsumo}
            sx={{ minWidth: 120 }}
            disabled={!insumoSeleccionado || !loteSeleccionado || cantidadConsumo <= 0}
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
                              onClick={() => onEliminarConsumo(index)}
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
  )
}

