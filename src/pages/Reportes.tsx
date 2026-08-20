import React, { useState, useEffect } from 'react'
import { Box, Typography, Paper, Tabs, Tab } from '@mui/material'
import { Assessment, AttachMoney, AccessTime } from '@mui/icons-material'
import { escuelaService } from '../services/escuelaService'
import type { Escuela } from '../services/escuelaService'
import { laboratorioService } from '../services/laboratorioService'
import type { Laboratorio } from '../services/laboratorioService'
import { cicloService } from '../services/cicloService'
import type { Ciclo } from '../services/cicloService'
import { TabCostos } from '../components/Reportes/TabCostos'
import { TabUso } from '../components/Reportes/TabUso'

export const Reportes: React.FC = () => {
  const [tab, setTab] = useState(0)

  // Lookups compartidos: se cargan una sola vez y se pasan a cada tab
  const [escuelas, setEscuelas] = useState<Escuela[]>([])
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [ciclos, setCiclos] = useState<Ciclo[]>([])

  useEffect(() => {
    escuelaService.getAll().then((res) => setEscuelas(res.data ?? []))
    laboratorioService.getAll().then((res) => setLaboratorios(res.data ?? []))
    cicloService.getAll().then((res) => setCiclos(res.data ?? []))
  }, [])

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assessment color="primary" sx={{ fontSize: 36 }} />
          Reportes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Análisis de costos de insumos y uso de laboratorios
        </Typography>
      </Box>

      {/* Tabs por dominio: cada uno con sus propios filtros aislados */}
      <Paper sx={{ borderRadius: 2, mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ px: 1, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 56 } }}
        >
          <Tab icon={<AttachMoney />} iconPosition="start" label="Costos de Insumos" />
          <Tab icon={<AccessTime />} iconPosition="start" label="Uso de Laboratorios" />
        </Tabs>
      </Paper>

      {/* Ambos paneles quedan montados para preservar filtros al alternar tabs */}
      <Box hidden={tab !== 0}>
        <TabCostos escuelas={escuelas} laboratorios={laboratorios} ciclos={ciclos} />
      </Box>
      <Box hidden={tab !== 1}>
        <TabUso escuelas={escuelas} laboratorios={laboratorios} />
      </Box>
    </Box>
  )
}
