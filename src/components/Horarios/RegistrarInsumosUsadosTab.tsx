import React from 'react'
import {
  Box,
  Typography,
  Chip,
  Card,
  CardContent
} from '@mui/material'
import { Inventory, Add } from '@mui/icons-material'
import { InsumosRequeridosList } from './InsumosRequeridosList'
import { InsumosUsadosForm, type InsumoUsado, type LoteDisponible } from './RegistrarInsumosDrawer'
import type { Horario } from '../../services/horarioService'

interface RegistrarInsumosUsadosTabProps {
  horario: Horario | null
  insumosUsados: InsumoUsado[]
  lotesDisponibles: Record<number, LoteDisponible[]>
  stockDisponible?: Record<number, number>
  onAgregarInsumo: (insumo: { id: number; nombre: string; cantidad_usada: number; unidad_medida?: string }) => void
  onActualizarCantidad: (uniqueId: string | number, nuevaCantidad: number) => void
  onActualizarLote: (uniqueId: string | number, loteDetalleId: number, lote: string) => void
  onEliminar: (uniqueId: string | number) => void
  onAgregarOtroLote?: (insumoId: number) => void
}

export const RegistrarInsumosUsadosTab: React.FC<RegistrarInsumosUsadosTabProps> = ({
  horario,
  insumosUsados,
  lotesDisponibles,
  stockDisponible = {},
  onAgregarInsumo,
  onActualizarCantidad,
  onActualizarLote,
  onEliminar,
  onAgregarOtroLote
}) => {
  // Obtener IDs únicos de insumos (sin duplicados)
  const insumosAgregados = Array.from(new Set(insumosUsados.map(i => i.id)))
  const insumosRequeridos = horario?.insumos || []

  return (
    <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', gap: 3 }}>
      {/* Columna Izquierda: Insumos Requeridos */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Inventory color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Insumos Requeridos
              </Typography>
              {insumosRequeridos.length > 0 && (
                <Chip 
                  label={insumosRequeridos.length} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              )}
            </Box>

            <InsumosRequeridosList
              insumos={insumosRequeridos}
              insumosAgregados={insumosAgregados}
              stockDisponible={stockDisponible}
              onInsumoClick={onAgregarInsumo}
            />
          </CardContent>
        </Card>
      </Box>

      {/* Columna Derecha: Agregar Insumos Usados */}
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

