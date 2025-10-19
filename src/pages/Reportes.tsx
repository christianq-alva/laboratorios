import React, { useState } from 'react'
import {
  Box,
  Container,
  Tabs,
  Tab,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Avatar,
  Chip
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  Inventory as InventoryIcon,
  EventBusy as EventBusyIcon
} from '@mui/icons-material'
import DashboardEjecutivo from '../components/Reportes/DashboardEjecutivo'
import ConsumoDetallado from '../components/Reportes/ConsumoDetallado'
import TopInsumos from '../components/Reportes/TopInsumos'
import { ReporteStockBajo } from '../components/Reportes/ReporteStockBajo'
import { ReporteProximosVencer } from '../components/Reportes/ReporteProximosVencer'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reportes-tabpanel-${index}`}
      aria-labelledby={`reportes-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `reportes-tab-${index}`,
    'aria-controls': `reportes-tabpanel-${index}`,
  }
}

const Reportes: React.FC = () => {
  const [tabValue, setTabValue] = useState(0)

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const reportes = [
    {
      id: 0,
      titulo: 'Dashboard Ejecutivo',
      descripcion: 'Vista general con métricas clave y análisis ejecutivo',
      icon: <DashboardIcon />,
      color: '#1976d2',
      componente: <DashboardEjecutivo />
    },
    {
      id: 1,
      titulo: 'Consumo Detallado',
      descripcion: 'Análisis detallado de consumo mensual y anual por laboratorio',
      icon: <TimelineIcon />,
      color: '#d32f2f',
      componente: <ConsumoDetallado />
    },
    {
      id: 2,
      titulo: 'Top Insumos',
      descripcion: 'Ranking de insumos más consumidos con análisis de demanda',
      icon: <TrendingUpIcon />,
      color: '#ed6c02',
      componente: <TopInsumos />
    },
    {
      id: 3,
      titulo: 'Insumos con Stock Bajo',
      descripcion: 'Alertas de insumos agotados, con stock bajo o que necesitan reorden',
      icon: <InventoryIcon />,
      color: '#f57c00',
      componente: <ReporteStockBajo />
    },
    {
      id: 4,
      titulo: 'Insumos Próximos a Vencer',
      descripcion: 'Lotes de insumos vencidos o próximos a vencer clasificados por urgencia',
      icon: <EventBusyIcon />,
      color: '#c62828',
      componente: <ReporteProximosVencer />
    }
  ]

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Reportes de Consumo
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Sistema de reportes ejecutivos para análisis de consumo de insumos por laboratorio
        </Typography>
        <Box display="flex" gap={1} mt={2}>
          <Chip label="Power BI Style" color="primary" variant="outlined" />
          <Chip label="Exportable" color="success" variant="outlined" />
          <Chip label="Tiempo Real" color="info" variant="outlined" />
        </Box>
      </Box>

      {/* Vista de tarjetas para selección de reporte */}
      {tabValue === -1 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          {reportes.map((reporte) => (
            <Box sx={{ width: { xs: '100%', md: 'calc(33.333% - 16px)' } }} key={reporte.id}>
              <Card elevation={2} sx={{ height: '100%' }}>
                <CardActionArea
                  onClick={() => setTabValue(reporte.id)}
                  sx={{ height: '100%', p: 2 }}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar sx={{ bgcolor: reporte.color, mr: 2 }}>
                        {reporte.icon}
                      </Avatar>
                      <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                        {reporte.titulo}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {reporte.descripcion}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {/* Navegación por tabs */}
      <Paper elevation={1} sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              minHeight: 72,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600
            }
          }}
        >
          {reportes.map((reporte) => (
            <Tab
              key={reporte.id}
              icon={reporte.icon}
              iconPosition="start"
              label={reporte.titulo}
              {...a11yProps(reporte.id)}
              sx={{
                '& .MuiTab-iconWrapper': {
                  color: reporte.color,
                  mr: 1
                }
              }}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Contenido de los reportes */}
      {reportes.map((reporte) => (
        <TabPanel key={reporte.id} value={tabValue} index={reporte.id}>
          {reporte.componente}
        </TabPanel>
      ))}
    </Container>
  )
}

export default Reportes
