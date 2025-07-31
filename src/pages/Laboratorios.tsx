import React, { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material'
import { Add, Warning } from '@mui/icons-material'
import { LaboratoriosTable } from '../components/Laboratorios/LaboratoriosTable'
import { LaboratorioForm } from '../components/Laboratorios/LaboratorioForm'
import { laboratorioService } from '../services/laboratorioService'
import type { Laboratorio } from '../services/laboratorioService'

export const Laboratorios: React.FC = () => {
  // Estados para formulario y eliminación
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedLaboratorio, setSelectedLaboratorio] = useState<Laboratorio | null>(null)
  const [refresh, setRefresh] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  
  // Estados para notificaciones
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  })

  // Función para abrir formulario de nuevo laboratorio
  const handleNewLaboratorio = () => {
    setSelectedLaboratorio(null)
    setFormOpen(true)
  }

  // Función para editar laboratorio
  const handleEditLaboratorio = (laboratorio: Laboratorio) => {
    setSelectedLaboratorio(laboratorio)
    setFormOpen(true)
  }

  // Función para cerrar formulario
  const handleFormClose = () => {
    setFormOpen(false)
    setSelectedLaboratorio(null)
  }

  // Función cuando el formulario tiene éxito
  const handleFormSuccess = () => {
    setRefresh(prev => !prev)
    setSnackbar({
      open: true,
      message: selectedLaboratorio ? 'Laboratorio actualizado correctamente' : 'Laboratorio creado correctamente',
      severity: 'success'
    })
  }

  // Función para confirmar eliminación
  const handleDeleteLaboratorio = (laboratorio: Laboratorio) => {
    setSelectedLaboratorio(laboratorio)
    setDeleteOpen(true)
  }

  // Función para cerrar diálogo de eliminación
  const handleDeleteClose = () => {
    if (!deleteLoading) {
      setDeleteOpen(false)
      setSelectedLaboratorio(null)
    }
  }

  // Función para confirmar eliminación
  const handleDeleteConfirm = async () => {
    if (!selectedLaboratorio) return

    setDeleteLoading(true)
    try {
      const result = await laboratorioService.delete(selectedLaboratorio.id)
      
      if (result.success) {
        setDeleteOpen(false)
        setSelectedLaboratorio(null)
        setRefresh(prev => !prev)
        setSnackbar({
          open: true,
          message: 'Laboratorio eliminado correctamente',
          severity: 'success'
        })
      } else {
        setSnackbar({
          open: true,
          message: result.message || 'Error al eliminar el laboratorio',
          severity: 'error'
        })
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error de conexión al eliminar el laboratorio',
        severity: 'error'
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  // Función para manejar el refresh completado
  const handleRefreshComplete = () => {
    // Esta función se ejecuta cuando la tabla termina de refrescar
  }

  // Función para cerrar snackbar
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  return (
    <Box>
      {/* Encabezado */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
            Laboratorios
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona los laboratorios del sistema
          </Typography>
        </Box>
        <Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleNewLaboratorio}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Nuevo Laboratorio
          </Button>
        </Box>
      </Box>

      {/* Tabla de laboratorios */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <LaboratoriosTable 
            onEdit={handleEditLaboratorio}
            onDelete={handleDeleteLaboratorio}
            refresh={refresh}
            onRefreshComplete={handleRefreshComplete}
          />
        </CardContent>
      </Card>

      {/* Formulario de laboratorio */}
      <LaboratorioForm 
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        laboratorio={selectedLaboratorio}
      />

      {/* Diálogo de eliminación */}
      <Dialog open={deleteOpen} onClose={handleDeleteClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Warning color="error" />
            Confirmar Eliminación
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            ¿Estás seguro de que quieres eliminar el laboratorio <strong>"{selectedLaboratorio?.nombre}"</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Esta acción no se puede deshacer. El laboratorio será eliminado permanentemente del sistema.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleDeleteClose}
            disabled={deleteLoading}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteConfirm}
            disabled={deleteLoading}
            variant="contained"
            color="error"
            sx={{ borderRadius: 2, px: 3 }}
          >
            {deleteLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Eliminar'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
} 