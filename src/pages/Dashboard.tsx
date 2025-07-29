import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import {
  School,
  Person,
  Schedule,
  Inventory,
  TrendingUp,
  Today,
  DateRange,
  CheckCircle,
  Warning,
  BugReport,
  ExpandMore,
  Refresh,
} from '@mui/icons-material'
import { useAuth } from '../context/authContext'
import { dashboardService } from '../services/dashboardService'
import type { DashboardStats } from '../services/dashboardService'

export const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [debugLoading, setDebugLoading] = useState(false)

  // Función para cargar las estadísticas
  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await dashboardService.getStats()
      
      if (result.success && result.data) {
        setStats(result.data)
      } else {
        setError(result.message || 'Error al cargar estadísticas')
      }
    } catch (err) {
      setError('Error de conexión al servidor')
      console.error('Error fetching dashboard stats:', err)
    } finally {
      setLoading(false)
    }
  }

  // Función de debug
  const runDebug = async () => {
    try {
      setDebugLoading(true)
      const result = await dashboardService.debug()
      setDebugInfo(result)
      console.log('🔧 Información de debug:', result)
    } catch (err) {
      console.error('Error en debug:', err)
    } finally {
      setDebugLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  // Si está cargando
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          Cargando estadísticas del dashboard...
        </Typography>
      </Box>
    )
  }

  // Si hay error
  if (error) {
    return (
      <Box>
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                size="small"
                color="error" 
                variant="outlined"
                startIcon={<BugReport />}
                onClick={runDebug}
                disabled={debugLoading}
              >
                {debugLoading ? 'Debugeando...' : 'Debug'}
              </Button>
              <Button 
                size="small"
                color="error" 
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchStats}
              >
                Reintentar
              </Button>
            </Box>
          }
        >
          <Typography variant="body1" gutterBottom>
            <strong>Error al cargar estadísticas:</strong> {error}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Haz clic en "Debug" para obtener más información sobre el problema.
          </Typography>
        </Alert>

        {/* Panel de debug */}
        {debugInfo && (
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BugReport />
                Información de Debug
                <Chip 
                  label={debugInfo.success ? 'OK' : 'ERROR'} 
                  color={debugInfo.success ? 'success' : 'error'} 
                  size="small" 
                />
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Conexión a BD:</strong> {debugInfo.connection || 'N/A'}
                </Typography>
                
                {debugInfo.tables && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Tablas disponibles:</strong>
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      {debugInfo.tables.map((table: any, index: number) => (
                        <Typography key={index} variant="body2" color="text.secondary">
                          • {String(Object.values(table)[0])}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}

                {debugInfo.stats && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Conteos por tabla:</strong>
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      {Object.entries(debugInfo.stats).map(([table, count]) => (
                        <Typography key={table} variant="body2" color="text.secondary">
                          • {table}: {count as string}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}

                {debugInfo.message && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Error:</strong> {debugInfo.message}
                    </Typography>
                  </Alert>
                )}

                {debugInfo.error && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                    <Typography variant="body2">
                      <strong>Detalles del error:</strong>
                    </Typography>
                    <pre style={{ fontSize: '0.75rem', overflow: 'auto' }}>
                      {JSON.stringify(debugInfo.error, null, 2)}
                    </pre>
                  </Box>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}
      </Box>
    )
  }

  // Si no hay datos
  if (!stats) {
    return (
      <Alert severity="info">
        No se pudieron cargar las estadísticas del dashboard
      </Alert>
    )
  }

  const statsCards = [
    {
      title: 'Laboratorios',
      value: stats.laboratorios.total,
      subtitle: `${stats.laboratorios.activos} activos`,
      icon: <School />,
      color: '#1976d2',
      bgColor: '#e3f2fd',
    },
    {
      title: 'Docentes',
      value: stats.docentes.total,
      subtitle: `${stats.docentes.porEscuela.length} escuelas`,
      icon: <Person />,
      color: '#388e3c',
      bgColor: '#e8f5e8',
    },
    {
      title: 'Horarios',
      value: stats.horarios.total,
      subtitle: `${stats.horarios.hoy} hoy`,
      icon: <Schedule />,
      color: '#f57c00',
      bgColor: '#fff3e0',
    },
    {
      title: 'Insumos',
      value: stats.insumos.total,
      subtitle: `${stats.insumos.conStock} con stock`,
      icon: <Inventory />,
      color: '#7b1fa2',
      bgColor: '#f3e5f5',
    },
  ]

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Resumen general del sistema de laboratorios
        </Typography>
      </Box>

      {/* Tarjetas de estadísticas principales */}
      <Box 
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
          gap: 3,
          mb: 4
        }}
      >
        {statsCards.map((card, index) => (
          <Card 
            key={index}
            sx={{ 
              height: '100%',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: card.bgColor, 
                    color: card.color,
                    mr: 2,
                    width: 48,
                    height: 48,
                  }}
                >
                  {card.icon}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" fontWeight="bold" color={card.color}>
                    {card.value.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.subtitle}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h6" color="text.primary">
                {card.title}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Fila de detalles */}
      <Box 
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
          gap: 3
        }}
      >
        {/* Panel de usuario */}
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar 
                sx={{ 
                  bgcolor: 'primary.main',
                  width: 56,
                  height: 56,
                  mr: 2,
                  fontSize: '1.5rem'
                }}
              >
                {user?.nombre?.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6" gutterBottom>
                  {user?.nombre}
                </Typography>
                <Chip 
                  label={user?.rol}
                  color={user?.rol === 'Administrador' ? 'error' : 'primary'}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Usuario:</strong> {user?.usuario}
            </Typography>

            {user?.laboratorio_ids && user.laboratorio_ids.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                <strong>Laboratorios asignados:</strong> {user.laboratorio_ids.length}
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Horarios detalle */}
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Schedule color="action" />
              Horarios Detalle
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Total</Typography>
                <Typography variant="body2" fontWeight="bold">{stats.horarios.total}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Today fontSize="small" />
                  <Typography variant="body2" color="text.secondary">Hoy</Typography>
                </Box>
                <Typography variant="body2" fontWeight="bold" color="primary.main">
                  {stats.horarios.hoy}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <DateRange fontSize="small" />
                  <Typography variant="body2" color="text.secondary">Esta semana</Typography>
                </Box>
                <Typography variant="body2" fontWeight="bold" color="secondary.main">
                  {stats.horarios.estaSemana}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Typography variant="body2" color="text.secondary" gutterBottom>
              Por laboratorio:
            </Typography>
            <List dense>
              {stats.horarios.porLaboratorio.slice(0, 3).map((item, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <School fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.laboratorio} 
                    secondary={`${item.cantidad} horarios`}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>

        {/* Insumos detalle */}
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Inventory color="action" />
              Estado de Insumos
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Total</Typography>
                <Typography variant="body2" fontWeight="bold">{stats.insumos.total}</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircle fontSize="small" color="success" />
                <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                  Con stock
                </Typography>
                <Typography variant="body2" fontWeight="bold" color="success.main">
                  {stats.insumos.conStock}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Warning fontSize="small" color="warning" />
                <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                  Sin stock
                </Typography>
                <Typography variant="body2" fontWeight="bold" color="warning.main">
                  {stats.insumos.sinStock}
                </Typography>
              </Box>

              {/* Barra de progreso del stock */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Estado general del inventario
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(stats.insumos.conStock / Math.max(stats.insumos.total, 1)) * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                  color={stats.insumos.conStock > stats.insumos.sinStock ? 'success' : 'warning'}
                />
                <Typography variant="caption" color="text.secondary">
                  {Math.round((stats.insumos.conStock / Math.max(stats.insumos.total, 1)) * 100)}% con stock disponible
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Typography variant="body2" color="text.secondary" gutterBottom>
              Por laboratorio:
            </Typography>
            <List dense>
              {stats.insumos.porLaboratorio.slice(0, 3).map((item, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Inventory fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.laboratorio} 
                    secondary={`${item.cantidad} insumos`}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
} 