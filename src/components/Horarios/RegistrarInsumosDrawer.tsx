import React, { useState, useEffect } from 'react'
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Tabs,
  Tab,
  TextField,
  Select,
  MenuItem
} from '@mui/material'
import { Close, CheckCircle, Add } from '@mui/icons-material'
import { RegistrarInsumosUsadosTab } from './RegistrarInsumosUsadosTab'
import { AgregarInsumosAdicionalesTab } from './AgregarInsumosAdicionalesTab'
import type { Horario } from '../../services/horarioService'
import { inventarioService } from '../../services/inventarioService'

// Tipos locales
export interface InsumoUsado {
  id: number
  nombre: string
  cantidad: number
  unidad_medida: string
  cantidad_requerida: number
  lote_detalle_id?: number
  lote?: string
  uniqueId?: string | number
}

export interface LoteDisponible {
  detalle_id: number
  lote: string
  saldo: number
  fecha_vencimiento: string | null
}

interface RegistrarInsumosDrawerProps {
  open: boolean
  onClose: () => void
  horario: Horario | null
  onSaveInsumosUsados?: (insumos: InsumoUsado[]) => void
}

export const RegistrarInsumosDrawer: React.FC<RegistrarInsumosDrawerProps> = ({
  open,
  onClose,
  horario,
  onSaveInsumosUsados
}) => {
  const [tabValue, setTabValue] = useState(0) // 0 = Insumos Requeridos, 1 = Agregar Adicionales
  
  // Estados para "Registrar Insumos Usados"
  const [insumosUsados, setInsumosUsados] = useState<InsumoUsado[]>([])
  const [lotesDisponiblesOriginal, setLotesDisponiblesOriginal] = useState<Record<number, LoteDisponible[]>>({})
  const [contadorUniqueId, setContadorUniqueId] = useState(0)
  const [stockDisponible, setStockDisponible] = useState<Record<number, number>>({}) // stock por insumo_id

  // Cargar datos cuando se abre el drawer
  useEffect(() => {
    if (open && horario) {
      loadStockDisponible()
      // Mock de lotes disponibles
      const lotesMockOriginal: Record<number, LoteDisponible[]> = {}
      
      const insumos = horario.insumos || []
      insumos.forEach(insumo => {
        const lotes = [
          { detalle_id: insumo.id * 10 + 1, lote: `LOTE-${insumo.id}-001`, saldo: 50, fecha_vencimiento: '2025-12-31' },
          { detalle_id: insumo.id * 10 + 2, lote: `LOTE-${insumo.id}-002`, saldo: 30, fecha_vencimiento: '2026-06-30' },
        ]
        lotesMockOriginal[insumo.id] = lotes
      })
      
      setLotesDisponiblesOriginal(lotesMockOriginal)
      setInsumosUsados([])
      setContadorUniqueId(0)
    }
  }, [open, horario])

  // Cargar stock disponible de insumos
  const loadStockDisponible = async () => {
    if (!horario?.laboratorio_id) return
    
    try {
      const response = await inventarioService.getWithStock(horario.laboratorio_id)
      if (response.data) {
        const stockMap: Record<number, number> = {}
        response.data.forEach((insumo: { id: number; stock_disponible: number }) => {
          stockMap[insumo.id] = insumo.stock_disponible || 0
        })
        setStockDisponible(stockMap)
      }
    } catch (error) {
      console.error('Error al cargar stock disponible:', error)
    }
  }

  // Funciones para "Registrar Insumos Usados"
  const handleAgregarInsumoRequerido = (insumo: { id: number; nombre: string; cantidad_usada: number; unidad_medida?: string }) => {
    const uniqueId = `req-${insumo.id}-${Date.now()}-${contadorUniqueId}`
    setContadorUniqueId(prev => prev + 1)
    
    setInsumosUsados(prev => [...prev, {
      id: insumo.id,
      nombre: insumo.nombre,
      cantidad: insumo.cantidad_usada || 0,
      unidad_medida: insumo.unidad_medida || 'unidades',
      cantidad_requerida: insumo.cantidad_usada || 0,
      uniqueId
    }])
  }

  const handleActualizarCantidad = (uniqueId: string | number, nuevaCantidad: number) => {
    setInsumosUsados(prev => prev.map(insumo => 
      (insumo.uniqueId || insumo.id) === uniqueId ? { ...insumo, cantidad: nuevaCantidad } : insumo
    ))
  }

  const handleActualizarLote = (uniqueId: string | number, loteDetalleId: number, lote: string) => {
    setInsumosUsados(prev => prev.map(insumo => 
      (insumo.uniqueId || insumo.id) === uniqueId ? { ...insumo, lote_detalle_id: loteDetalleId, lote } : insumo
    ))
  }

  const handleEliminarInsumoUsado = (uniqueId: string | number) => {
    setInsumosUsados(prev => prev.filter(i => (i.uniqueId || i.id) !== uniqueId))
  }

  // Función para agregar otro lote del mismo insumo
  const handleAgregarOtroLote = (insumoId: number) => {
    const insumoOriginal = insumosUsados.find(i => i.id === insumoId)
    if (!insumoOriginal) return

    const uniqueId = `lote-${insumoId}-${Date.now()}-${contadorUniqueId}`
    setContadorUniqueId(prev => prev + 1)

    setInsumosUsados(prev => [...prev, {
      id: insumoId,
      nombre: insumoOriginal.nombre,
      cantidad: 0,
      unidad_medida: insumoOriginal.unidad_medida,
      cantidad_requerida: insumoOriginal.cantidad_requerida,
      uniqueId
    }])
  }

  // Función para agregar insumo adicional
  const handleAgregarInsumoAdicional = async (insumo: InsumoUsado) => {
    // Siempre agregar como nueva entrada con uniqueId
    const uniqueId = `add-${insumo.id}-${Date.now()}-${contadorUniqueId}`
    setContadorUniqueId(prev => prev + 1)
    
    setInsumosUsados(prev => [...prev, { ...insumo, uniqueId }])

    // Cargar lotes si no están cargados
    if (!lotesDisponiblesOriginal[insumo.id] && horario?.laboratorio_id) {
      try {
        const response = await inventarioService.getLotesConSaldo(horario.laboratorio_id, insumo.id)
        if (response.data && response.data.length > 0) {
          const lotesMapeados: LoteDisponible[] = response.data.map((lote) => ({
            detalle_id: lote.detalle_id,
            lote: lote.lote,
            saldo: lote.saldo,
            fecha_vencimiento: lote.fecha_vencimiento
          }))
          setLotesDisponiblesOriginal(prev => ({
            ...prev,
            [insumo.id]: lotesMapeados
          }))
        }
      } catch (error) {
        console.error('Error al cargar lotes para insumo adicional:', error)
      }
    }
  }

  const handleClose = () => {
    setInsumosUsados([])
    setTabValue(0)
    onClose()
  }

  const handleSave = () => {
    onSaveInsumosUsados?.(insumosUsados)
    handleClose()
  }

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          height: '80vh',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
          zIndex: 1500
        }
      }}
      ModalProps={{
        sx: { zIndex: 1500 },
        BackdropProps: {
          sx: {
            zIndex: 1499,
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }}
      SlideProps={{
        direction: 'up',
        timeout: 300
      }}
    >
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle color="success" />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Registrar Insumos Usados
            </Typography>
          </Box>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Box>

        {/* Tabs */}
        <Tabs 
          value={tabValue} 
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Insumos Requeridos" />
          <Tab label="Agregar Insumos Adicionales" />
        </Tabs>

        {/* Tab Content */}
        {tabValue === 0 ? (
          <RegistrarInsumosUsadosTab
            horario={horario}
            insumosUsados={insumosUsados}
            lotesDisponibles={lotesDisponiblesOriginal}
            stockDisponible={stockDisponible}
            onAgregarInsumo={handleAgregarInsumoRequerido}
            onActualizarCantidad={handleActualizarCantidad}
            onActualizarLote={handleActualizarLote}
            onEliminar={handleEliminarInsumoUsado}
            onAgregarOtroLote={handleAgregarOtroLote}
          />
        ) : (
          <AgregarInsumosAdicionalesTab
            insumosUsados={insumosUsados}
            laboratorioId={horario?.laboratorio_id || null}
            lotesDisponibles={lotesDisponiblesOriginal}
            stockDisponible={stockDisponible}
            onAgregarInsumo={handleAgregarInsumoAdicional}
            onActualizarCantidad={handleActualizarCantidad}
            onActualizarLote={handleActualizarLote}
            onEliminar={handleEliminarInsumoUsado}
            onAgregarOtroLote={handleAgregarOtroLote}
          />
        )}

        {/* Footer */}
        <Box sx={{ pt: 2, mt: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {insumosUsados.length > 0 
              ? `${insumosUsados.length} insumo${insumosUsados.length > 1 ? 's' : ''} agregado${insumosUsados.length > 1 ? 's' : ''}`
              : 'No hay insumos agregados'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button onClick={handleClose} variant="outlined">
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              variant="contained"
              color="success"
              disabled={insumosUsados.length === 0}
            >
              Guardar Insumos Usados
            </Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}

// Componente InsumosUsadosForm
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
  // Agrupar insumos por ID para mostrar múltiples lotes del mismo insumo
  const insumosAgrupados = insumosUsados.reduce((acc, insumo) => {
    const key = insumo.id
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(insumo)
    return acc
  }, {} as Record<number, InsumoUsado[]>)

  return (
    <Box sx={{ flex: 1, overflow: 'auto' }}>
      {insumosUsados.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No hay insumos agregados
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Object.entries(insumosAgrupados).map(([insumoId, lotes]) => (
            <Box key={insumoId} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {lotes[0].nombre}
                </Typography>
                {onAgregarOtroLote && (lotesDisponibles[Number(insumoId)] || []).length > 0 && (
                  <IconButton
                    size="small"
                    onClick={() => onAgregarOtroLote(Number(insumoId))}
                    disabled={(lotesDisponibles[Number(insumoId)] || []).length === 0}
                  >
                    <Add />
                  </IconButton>
                )}
              </Box>
              {lotes.map((insumo) => (
                <Box key={insumo.uniqueId || insumo.id} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                  <TextField
                    type="number"
                    size="small"
                    label="Cantidad"
                    value={insumo.cantidad}
                    onChange={(e) => onActualizarCantidad(insumo.uniqueId || insumo.id, Number(e.target.value))}
                    sx={{ width: 100 }}
                  />
                  <Select
                    size="small"
                    value={insumo.lote_detalle_id || ''}
                    onChange={(e) => {
                      const loteDetalleId = Number(e.target.value)
                      const loteSeleccionado = (lotesDisponibles[insumo.id] || []).find(l => l.detalle_id === loteDetalleId)
                      if (loteSeleccionado) {
                        onActualizarLote(insumo.uniqueId || insumo.id, loteDetalleId, loteSeleccionado.lote)
                      }
                    }}
                    sx={{ flex: 1 }}
                  >
                    {(lotesDisponibles[insumo.id] || []).map((lote) => (
                      <MenuItem key={lote.detalle_id} value={lote.detalle_id}>
                        {lote.lote} (Saldo: {lote.saldo})
                      </MenuItem>
                    ))}
                  </Select>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onEliminar(insumo.uniqueId || insumo.id)}
                  >
                    <Close />
                  </IconButton>
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}
