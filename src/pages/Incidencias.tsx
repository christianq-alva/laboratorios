import React, { useState } from 'react'
import { Box, Typography, Button, Snackbar, Alert } from '@mui/material'
import { Add, ReportProblem } from '@mui/icons-material'
import { IncidenciasTable } from '../components/Incidencias/IncidenciasTable'
import { IncidenciaForm } from '../components/Incidencias/IncidenciaForm'
import { IncidenciaDetalleDialog } from '../components/Incidencias/IncidenciaDetalle'
import { incidenciaService, type Incidencia } from '../services/incidenciaService'

export const Incidencias: React.FC = () => {
  // Estados para el formulario
  const [formOpen, setFormOpen] = useState(false)
  
  // Estados para el detalle
  const [detalleOpen, setDetalleOpen] = useState(false)
  const [selectedIncidenciaId, setSelectedIncidenciaId] = useState<number | null>(null)
  
  // Estados para refrescar
  const [refresh, setRefresh] = useState(false)
  
  // Estados para notificaciones
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  })

  // Función para abrir formulario de nueva incidencia
  const handleNewIncidencia = () => {
    setFormOpen(true)
  }

  // Función para cerrar formulario
  const handleFormClose = () => {
    setFormOpen(false)
  }

  // Función para cuando se crea exitosamente una incidencia
  const handleFormSuccess = () => {
    setSnackbar({
      open: true,
      message: 'Incidencia reportada correctamente',
      severity: 'success'
    })
    setRefresh(prev => !prev)
  }

  // Función para ver detalles de una incidencia
  const handleViewIncidencia = (incidencia: Incidencia) => {
    setSelectedIncidenciaId(incidencia.id)
    setDetalleOpen(true)
  }

  // Función para cerrar detalle
  const handleDetalleClose = () => {
    setDetalleOpen(false)
    setSelectedIncidenciaId(null)
  }

  // Función para completar refresh
  const handleRefreshComplete = () => {
    // Refresh completado
  }

  // Función para cerrar snackbar
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReportProblem color="error" />
            Incidencias
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Reporta y gestiona incidencias en los laboratorios
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={handleNewIncidencia}
          sx={{ borderRadius: 2, px: 3 }}
        >
          Nueva Incidencia
        </Button>
      </Box>

      {/* Tabla de incidencias */}
      <IncidenciasTable
        onView={handleViewIncidencia}
        refresh={refresh}
        onRefreshComplete={handleRefreshComplete}
      />

      {/* Formulario de nueva incidencia */}
      <IncidenciaForm
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />

      {/* Diálogo de detalles */}
      <IncidenciaDetalleDialog
        open={detalleOpen}
        onClose={handleDetalleClose}
        incidenciaId={selectedIncidenciaId}
      />

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
} 