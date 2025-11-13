import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Snackbar,
  Chip,
  Paper,
  CircularProgress
} from '@mui/material'
import { LocationOn } from '@mui/icons-material'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { useAuth } from '../hooks/useAuth'
import { CalendarView } from '../components/Dashboard/CalendarView'
import { laboratorioService, type Laboratorio } from '../services/laboratorioService'
import { useApi } from '../hooks/useApi'

dayjs.extend(isoWeek)

export const Dashboard: React.FC = () => {

  const { user } = useAuth()
  const navigate = useNavigate()
  const { execute } = useApi()
  const [navigationSnackbar, setNavigationSnackbar] = useState({
    open: false,
    message: ''
  })
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [loadingLaboratorios, setLoadingLaboratorios] = useState(false)

  // Cargar laboratorios del usuario si es Jefe de Laboratorio
  useEffect(() => {
    const loadLaboratorios = async () => {
      if (user?.rol === 'Jefe de Laboratorio') {
        setLoadingLaboratorios(true)
        const result = await execute(() => laboratorioService.getAll())
        if (result.data) {
          setLaboratorios(result.data.data || [])
        }
        setLoadingLaboratorios(false)
      }
    }
    loadLaboratorios()
  }, [user, execute])

  const handleNavigateToLab = (laboratorioId: number, horarioId: number, fechaHorario?: string) => {
    // Guardar información en localStorage para que el calendario sepa qué laboratorio mostrar
    localStorage.setItem('dashboard_navigation', JSON.stringify({
      laboratorioId,
      horarioId,
      timestamp: Date.now()
    }))

    // Guardar la semana del horario seleccionado si se proporciona la fecha
    if (fechaHorario) {
      const semanaHorario = dayjs(fechaHorario).startOf('isoWeek')
      localStorage.setItem('calendario_semana_actual', semanaHorario.format('YYYY-MM-DD'))
    }

    setNavigationSnackbar({
      open: true,
      message: 'Navegando al calendario semanal...'
    })

    // Navegar a la página de horarios
    setTimeout(() => {
      navigate('/horarios')
    }, 500)
  }

  const isJefeLaboratorio = user?.rol === 'Jefe de Laboratorio'

  return (
    <Box>
      {/* Encabezado */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: isJefeLaboratorio ? 2 : 0 }}>
          Bienvenido, <strong>{user?.nombre}</strong> • {user?.rol}
        </Typography>

        {/* Laboratorios asignados - Solo para Jefe de Laboratorio */}
        {isJefeLaboratorio && (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              mt: 2, 
              bgcolor: 'primary.50', 
              border: 1, 
              borderColor: 'primary.200',
              borderRadius: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <LocationOn color="primary" />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                Mis Laboratorios
              </Typography>
            </Box>
            {loadingLaboratorios ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                <CircularProgress size={24} />
              </Box>
            ) : laboratorios.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {laboratorios.map((lab) => (
                  <Chip
                    key={lab.id}
                    icon={<LocationOn />}
                    label={`${lab.codigo} - ${lab.nombre}`}
                    color="primary"
                    variant="outlined"
                    sx={{ 
                      fontWeight: 500,
                      '&:hover': {
                        bgcolor: 'primary.100',
                        borderColor: 'primary.main'
                      }
                    }}
                  />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No tienes laboratorios asignados
              </Typography>
            )}
          </Paper>
        )}
      </Box>

      {/* Calendario de Horarios */}
      <Box sx={{ mb: 4 }}>
        <CalendarView
          onNavigateToLab={handleNavigateToLab}
        />
      </Box>

      {/* Snackbar de navegación */}
      <Snackbar
        open={navigationSnackbar.open}
        autoHideDuration={1000}
        onClose={() => setNavigationSnackbar({ open: false, message: '' })}
        message={navigationSnackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
} 