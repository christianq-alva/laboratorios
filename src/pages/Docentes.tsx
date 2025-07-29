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
  CircularProgress,
} from '@mui/material'
import { Add, Person, Warning } from '@mui/icons-material'
import { DocentesTable } from '../components/Docentes/DocentesTable'
import { DocenteForm } from '../components/Docentes/DocenteForm'
import { docenteService } from '../services/docenteService'
import type { Docente } from '../services/docenteService'

export const Docentes: React.FC = () => {
  // Estados para los diálogos
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [horariosOpen, setHorariosOpen] = useState(false)
  const [selectedDocente, setSelectedDocente] = useState<Docente | null>(null)
  
  // Estados para la tabla
  const [refresh, setRefresh] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  
  // Estados para notificaciones
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  })

  // Funciones para manejar el formulario
  const handleNewDocente = () => {
    setSelectedDocente(null)
    setFormOpen(true)
  }

  const handleEditDocente = (docente: Docente) => {
    setSelectedDocente(docente)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setSelectedDocente(null)
  }

  const handleFormSuccess = () => {
    setRefresh(true)
    setSnackbar({
      open: true,
      message: selectedDocente 
        ? 'Docente actualizado correctamente' 
        : 'Docente creado correctamente',
      severity: 'success'
    })
  }

  // Funciones para manejar eliminación
  const handleDeleteDocente = (docente: Docente) => {
    setSelectedDocente(docente)
    setDeleteOpen(true)
  }

  const handleDeleteClose = () => {
    setDeleteOpen(false)
    setSelectedDocente(null)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedDocente) return

    setDeleteLoading(true)
    try {
      const result = await docenteService.delete(selectedDocente.id)
      if (result.success) {
        setRefresh(true)
        setSnackbar({
          open: true,
          message: 'Docente eliminado correctamente',
          severity: 'success'
        })
        handleDeleteClose()
      } else {
        setSnackbar({
          open: true,
          message: result.message || 'Error al eliminar docente',
          severity: 'error'
        })
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error de conexión al servidor',
        severity: 'error'
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  // Función para ver horarios
  const handleViewHorarios = (docente: Docente) => {
    setSelectedDocente(docente)
    setHorariosOpen(true)
  }

  const handleHorariosClose = () => {
    setHorariosOpen(false)
    setSelectedDocente(null)
  }

  // Función para manejar el refresh completado
  const handleRefreshComplete = () => {
    setRefresh(false)
  }

  // Función para cerrar notificaciones
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Docentes
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona el personal docente de la universidad
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleNewDocente}
          sx={{ borderRadius: 2, px: 3 }}
        >
          Nuevo Docente
        </Button>
      </Box>

      {/* Contenido principal */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <DocentesTable
            onEdit={handleEditDocente}
            onDelete={handleDeleteDocente}
            onViewHorarios={handleViewHorarios}
            refresh={refresh}
            onRefreshComplete={handleRefreshComplete}
          />
        </CardContent>
      </Card>

      {/* Formulario de crear/editar */}
      <DocenteForm
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        docente={selectedDocente}
      />

      {/* Diálogo de eliminación */}
      <Dialog open={deleteOpen} onClose={handleDeleteClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Warning color="warning" />
            Confirmar Eliminación
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            ¿Estás seguro de que deseas eliminar al docente?
          </Typography>
          {selectedDocente && (
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="h6">{selectedDocente.nombre}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedDocente.correo}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose} disabled={deleteLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? <CircularProgress size={20} /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de horarios (placeholder) */}
      <Dialog open={horariosOpen} onClose={handleHorariosClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Horarios del Docente
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {selectedDocente ? `Horarios de ${selectedDocente.nombre}` : ''}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta funcionalidad se implementará próximamente
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleHorariosClose}>Cerrar</Button>
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
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
} 