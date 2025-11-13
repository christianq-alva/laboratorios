import React, { useState } from 'react'
import { Box, Typography, Button, Snackbar, Alert } from '@mui/material'
import { Add, ReportProblem } from '@mui/icons-material'
import { IncidenciasTable } from '../components/Incidencias/IncidenciasTable'
import { IncidenciaForm } from '../components/Incidencias/IncidenciaForm'
import { IncidenciaDetalleDialog } from '../components/Incidencias/IncidenciaDetalle'
import { DeleteDialog } from '../components/Common/DeleteDialog'
import { type Incidencia, incidenciaService } from '../services/incidenciaService'
import { useApi } from '../hooks/useApi'

export const Incidencias: React.FC = () => {
  const { execute } = useApi()
  
  // Estados para el formulario
  const [formOpen, setFormOpen] = useState(false)
  
  // Estados para el detalle
  const [detalleOpen, setDetalleOpen] = useState(false)
  const [selectedIncidenciaId, setSelectedIncidenciaId] = useState<number | null>(null)
  
  // Estados para eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [incidenciaToDelete, setIncidenciaToDelete] = useState<Incidencia | null>(null)
  const [deleting, setDeleting] = useState(false)
  
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

  // Función para manejar eliminación de incidencia
  const handleDeleteIncidencia = (incidencia: Incidencia) => {
    setIncidenciaToDelete(incidencia)
    setDeleteDialogOpen(true)
  }

  // Función para cerrar diálogo de eliminación
  const handleDeleteDialogClose = () => {
    if (!deleting) {
      setDeleteDialogOpen(false)
      setIncidenciaToDelete(null)
    }
  }

  // Función para confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!incidenciaToDelete) return

    setDeleting(true)
    const response = await execute(() => incidenciaService.delete(incidenciaToDelete.id))

    if (response.error) {
      setSnackbar({
        open: true,
        message: response.error,
        severity: 'error'
      })
      setDeleting(false)
    } else {
      setSnackbar({
        open: true,
        message: 'Incidencia eliminada exitosamente',
        severity: 'success'
      })
      setDeleteDialogOpen(false)
      setIncidenciaToDelete(null)
      setDeleting(false)
      setRefresh(prev => !prev)
    }
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
        onDelete={handleDeleteIncidencia}
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

      {/* Diálogo de confirmación de eliminación */}
      <DeleteDialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
        onConfirm={handleConfirmDelete}
        title="Eliminar Incidencia"
        itemName={incidenciaToDelete?.titulo || ''}
        itemType="la incidencia"
        warningMessage="Esta acción no se puede deshacer."
        loading={deleting}
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