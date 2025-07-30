import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
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
  Button
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
  Refresh
} from '@mui/icons-material'
import { useAuth } from '../context/authContext'
import { dashboardService } from '../services/dashboardService'
import type { DashboardStats } from '../services/dashboardService'

export const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err)
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
        <CircularProgress size={60} sx={{ mb: 3 }} />
        <Typography variant="h6" color="text.secondary">
          Cargando estadísticas del dashboard...
        </Typography>
        <LinearProgress sx={{ width: '300px', mt: 2 }} />
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button 
              size="small" 
              color="error" 
              variant="outlined" 
              startIcon={<Refresh />} 
              onClick={fetchStats}
            >
              Reintentar
            </Button>
          }
        >
          <Typography variant="body1" gutterBottom>
            <strong>Error al cargar estadísticas:</strong> {error}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Verifica tu conexión a internet y que el servidor esté funcionando correctamente.
          </Typography>
        </Alert>
      </Box>
    )
  }

  if (!stats) {
    return (
      <Alert severity="info">
        <Typography variant="body1">
          No se encontraron estadísticas para mostrar.
        </Typography>
      </Alert>
    )
  }

  return (
    <Box>
      {/* Encabezado */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Bienvenido, <strong>{user?.nombre}</strong> • {user?.rol}
        </Typography>
      </Box>

      {/* Estadísticas principales */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 4 }}>
        {/* Laboratorios */}
        <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', color: 'white' }}>
                <School />
              </Avatar>
              <Chip label="Laboratorios" variant="outlined" />
            </Box>
            <Typography variant="h3" component="div" sx={{ fontWeight: 700, mb: 1 }}>
              {stats.laboratorios.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Laboratorios registrados
            </Typography>
          </CardContent>
        </Card>

        {/* Docentes */}
        <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'success.main', color: 'white' }}>
                <Person />
              </Avatar>
              <Chip label="Docentes" variant="outlined" />
            </Box>
            <Typography variant="h3" component="div" sx={{ fontWeight: 700, mb: 1 }}>
              {stats.docentes.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Docentes registrados
            </Typography>
          </CardContent>
        </Card>

        {/* Horarios */}
        <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'warning.main', color: 'white' }}>
                <Schedule />
              </Avatar>
              <Chip label="Horarios" variant="outlined" />
            </Box>
            <Typography variant="h3" component="div" sx={{ fontWeight: 700, mb: 1 }}>
              {stats.horarios.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Reservas programadas
            </Typography>
          </CardContent>
        </Card>

        {/* Insumos */}
        <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'info.main', color: 'white' }}>
                <Inventory />
              </Avatar>
              <Chip label="Insumos" variant="outlined" />
            </Box>
            <Typography variant="h3" component="div" sx={{ fontWeight: 700, mb: 1 }}>
              {stats.insumos.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Insumos en catálogo
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Detalles adicionales */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {/* Actividad de Horarios */}
        <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
          <CardContent>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp color="primary" />
              Actividad de Horarios
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List dense>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <Today color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="Hoy" 
                  secondary={`${stats.horarios.hoy} reservas programadas`}
                />
              </ListItem>
              
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <DateRange color="info" />
                </ListItemIcon>
                <ListItemText 
                  primary="Esta semana" 
                  secondary={`${stats.horarios.estaSemana} reservas en total`}
                />
              </ListItem>
            </List>

            {stats.horarios.porLaboratorio.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  Laboratorios más activos:
                </Typography>
                {stats.horarios.porLaboratorio.slice(0, 3).map((lab, index) => (
                  <Chip 
                    key={index}
                    label={`${lab.laboratorio}: ${lab.cantidad}`}
                    size="small"
                    variant="outlined"
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Distribución de Docentes */}
        <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
          <CardContent>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person color="primary" />
              Docentes por Escuela
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {stats.docentes.porEscuela.length > 0 ? (
              <List dense>
                {stats.docentes.porEscuela.slice(0, 5).map((escuela, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={escuela.escuela} 
                      secondary={`${escuela.cantidad} docentes`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
                <Warning color="warning" />
                <Typography variant="body2" color="text.secondary">
                  No hay docentes asignados por escuela
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
} 