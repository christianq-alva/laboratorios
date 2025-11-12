import React, { useState, useEffect } from 'react'
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Tabs,
  Tab
} from '@mui/material'
import { Close, CheckCircle } from '@mui/icons-material'
import { RegistrarInsumosUsadosTab } from './RegistrarInsumosUsadosTab'
import { AgregarInsumosAdicionalesTab } from './AgregarInsumosAdicionalesTab'
import type { Horario } from '../../services/horarioService'
import type { InsumoUsado, LoteDisponible } from './InsumosUsadosForm'

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

  // Cargar datos cuando se abre el drawer
  useEffect(() => {
    if (open && horario) {
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
        const { insumoService } = await import('../../services/insumoService')
        const response = await insumoService.getLotesConSaldo(horario.laboratorio_id, insumo.id)
        if (response.data && response.data.length > 0) {
          const lotesMapeados: LoteDisponible[] = response.data.map((lote: any) => ({
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

