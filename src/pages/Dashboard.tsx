import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Snackbar
} from '@mui/material'
import { useAuth } from '../hooks/useAuth'
import { CalendarView } from '../components/Dashboard/CalendarView'

export const Dashboard: React.FC = () => {

  const { user } = useAuth()
  const navigate = useNavigate()
  const [navigationSnackbar, setNavigationSnackbar] = useState({
    open: false,
    message: ''
  })

  const handleNavigateToLab = (laboratorioId: number, horarioId: number) => {
    // Guardar información en localStorage para que el calendario sepa qué laboratorio mostrar
    localStorage.setItem('dashboard_navigation', JSON.stringify({
      laboratorioId,
      horarioId,
      timestamp: Date.now()
    }))

    setNavigationSnackbar({
      open: true,
      message: 'Navegando al calendario semanal...'
    })

    // Navegar a la página de horarios
    setTimeout(() => {
      navigate('/horarios')
    }, 500)
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

      {/* Calendario de Horarios */}
      <Box sx={{ mb: 4 }}>
        <CalendarView
          onNavigateToLab={handleNavigateToLab}
        />
      </Box>

<<<<<<< Updated upstream
=======
      {/* Formulario de nuevo horario - Lazy Loading */}
      {horarioFormOpen && (
        <Suspense fallback={
          <Box display="flex" justifyContent="center" alignItems="center" p={3}>
            <CircularProgress />
          </Box>
        }>
          <HorarioFormSimple
            open={horarioFormOpen}
            onClose={handleHorarioFormClose}
            onSuccess={handleHorarioFormSuccess}
          />
        </Suspense>
      )}

>>>>>>> Stashed changes
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