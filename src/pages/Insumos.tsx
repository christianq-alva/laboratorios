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
import { Add, Warning, History } from '@mui/icons-material'
import { InsumosTable } from '../components/Insumos/InsumosTable'
import { InsumoForm } from '../components/Insumos/InsumoForm'
import { ActividadInsumos } from '../components/Insumos/ActividadInsumos'
import { insumoService } from '../services/insumoService'
import type { Insumo } from '../services/insumoService'

export const Insumos: React.FC = () => {
  // Estados para formulario y eliminación
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | null>(null)
  const [refresh, setRefresh] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [actividadOpen, setActividadOpen] = useState(false)
  
  // Estados para notificaciones
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  })

  // Función para abrir formulario de nuevo insumo
  const handleNewInsumo = () => {
    setSelectedInsumo(null)
    setFormOpen(true)
  }

  // Función para editar insumo
  const handleEditInsumo = (insumo: Insumo) => {
    setSelectedInsumo(insumo)
    setFormOpen(true)
  }

  // Función para cerrar formulario
  const handleFormClose = () => {
    setFormOpen(false)
    setSelectedInsumo(null)
  }

  // Función cuando el formulario tiene éxito
  const handleFormSuccess = () => {
    setRefresh(prev => !prev)
    setSnackbar({
      open: true,
      message: selectedInsumo ? 'Insumo actualizado correctamente' : 'Insumo creado correctamente',
      severity: 'success'
    })
  }

  // Función para confirmar eliminación
  const handleDeleteInsumo = (insumo: Insumo) => {
    setSelectedInsumo(insumo)
    setDeleteOpen(true)
  }

  // Función para cerrar diálogo de eliminación
  const handleDeleteClose = () => {
    if (!deleteLoading) {
      setDeleteOpen(false)
      setSelectedInsumo(null)
    }
  }

  // Función para confirmar eliminación
  const handleDeleteConfirm = async () => {
    if (!selectedInsumo) return

    setDeleteLoading(true)
    try {
      // TODO: Implementar eliminación cuando esté disponible en el backend
      throw new Error('La eliminación de insumos no está implementada aún')
      
      // const result = await insumoService.delete(selectedInsumo.id)
      
      // if (result.success) {
      //   setDeleteOpen(false)
      //   setSelectedInsumo(null)
      //   setRefresh(prev => !prev)
      //   setSnackbar({
      //     open: true,
      //     message: 'Insumo eliminado correctamente',
      //     severity: 'success'
      //   })
      // } else {
      //   setSnackbar({
      //     open: true,
      //     message: result.message || 'Error al eliminar el insumo',
      //     severity: 'error'
      //   })
      // }
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || 'Error de conexión al eliminar el insumo',
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

  // Función para abrir actividad
  const handleActividadOpen = () => {
    setActividadOpen(true)
  }

  // Función para cerrar actividad
  const handleActividadClose = () => {
    setActividadOpen(false)
  }

  return (
    <Box>
      {/* Encabezado */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
            Insumos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Controla el inventario de materiales por laboratorio
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<History />}
            onClick={handleActividadOpen}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Actividad
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleNewInsumo}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Nuevo Insumo
          </Button>
        </Box>
      </Box>

      {/* Tabla de insumos */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <InsumosTable 
            onEdit={handleEditInsumo}
            onDelete={handleDeleteInsumo}
            refresh={refresh}
            onRefreshComplete={handleRefreshComplete}
          />
        </CardContent>
      </Card>

      {/* Formulario de insumo */}
      <InsumoForm 
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        insumo={selectedInsumo}
      />

      {/* Actividad de insumos */}
      <ActividadInsumos
        open={actividadOpen}
        onClose={handleActividadClose}
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
            ¿Estás seguro de que quieres eliminar el insumo <strong>"{selectedInsumo?.nombre}"</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Esta acción no se puede deshacer. El insumo será eliminado permanentemente del sistema.
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