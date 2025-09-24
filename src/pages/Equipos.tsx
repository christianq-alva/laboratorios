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
import { Add, Warning, History, FileUpload } from '@mui/icons-material'
import { EquiposTable } from '../components/Equipos/EquiposTable'
import { EquipoForm } from '../components/Equipos/EquipoForm'
import { ActividadEquipos } from '../components/Equipos/ActividadEquipos'
import { ImportacionMasivaEquipos } from '../components/Equipos/ImportacionMasivaEquipos'
import { equipoService, type Equipo } from '../services/equipoService'

export const Equipos: React.FC = () => {
  // Estados para formulario y eliminación
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [actividadOpen, setActividadOpen] = useState(false)
  const [importacionMasivaOpen, setImportacionMasivaOpen] = useState(false)
  const [selectedEquipo, setSelectedEquipo] = useState<Equipo | null>(null)
  const [refresh, setRefresh] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  
  // Estados para notificaciones
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  })

  // Función para abrir formulario de nuevo equipo
  const handleNewEquipo = () => {
    setSelectedEquipo(null)
    setFormOpen(true)
  }

  // Función para editar equipo
  const handleEditEquipo = (equipo: Equipo) => {
    setSelectedEquipo(equipo)
    setFormOpen(true)
  }

  // Función para cerrar formulario
  const handleFormClose = () => {
    setFormOpen(false)
    setSelectedEquipo(null)
  }

  // Función para abrir actividad
  const handleActividad = () => {
    setActividadOpen(true)
  }

  // Función para cerrar actividad
  const handleActividadClose = () => {
    setActividadOpen(false)
  }

  // Función para abrir importación masiva
  const handleImportacionMasivaOpen = () => {
    setImportacionMasivaOpen(true)
  }

  // Función para cerrar importación masiva
  const handleImportacionMasivaClose = () => {
    setImportacionMasivaOpen(false)
  }

  // Función para éxito de importación masiva
  const handleImportacionMasivaSuccess = () => {
    setRefresh(prev => !prev)
    setSnackbar({
      open: true,
      message: 'Importación masiva de equipos completada correctamente',
      severity: 'success'
    })
  }

  // Función cuando el formulario tiene éxito
  const handleFormSuccess = () => {
    setRefresh(prev => !prev)
    setSnackbar({
      open: true,
      message: selectedEquipo ? 'Equipo actualizado correctamente' : 'Equipo creado correctamente',
      severity: 'success'
    })
  }

  // Función para confirmar eliminación
  const handleDeleteEquipo = (equipo: Equipo) => {
    setSelectedEquipo(equipo)
    setDeleteOpen(true)
  }

  // Función para cerrar diálogo de eliminación
  const handleDeleteClose = () => {
    if (!deleteLoading) {
      setDeleteOpen(false)
      setSelectedEquipo(null)
    }
  }

  // Función para confirmar eliminación
  const handleDeleteConfirm = async () => {
    if (!selectedEquipo) return

    setDeleteLoading(true)
    try {
      console.log('🗑️ Intentando eliminar equipo:', selectedEquipo.id)
      const result = await equipoService.delete(selectedEquipo.id)
      
      if (result.success) {
        console.log('✅ Equipo eliminado correctamente')
        setDeleteOpen(false)
        setSelectedEquipo(null)
        setRefresh(prev => !prev)
        setSnackbar({
          open: true,
          message: 'Equipo eliminado correctamente',
          severity: 'success'
        })
      } else {
        console.error('❌ Error al eliminar equipo:', result)
        setSnackbar({
          open: true,
          message: result.message || 'Error al eliminar el equipo',
          severity: 'error'
        })
      }
    } catch (err: any) {
      console.error('❌ Error de conexión:', {
        error: err.message,
        response: err.response?.data,
        status: err.response?.status
      })
      
      let errorMessage = 'Error de conexión al eliminar el equipo'
      
      if (err.response?.status === 403) {
        errorMessage = 'No tienes permisos para eliminar este equipo'
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
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
            Equipos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona el inventario de equipos por laboratorio
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<History />}
            onClick={handleActividad}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Actividad
          </Button>

          <Button
            variant="outlined"
            startIcon={<FileUpload />}
            onClick={handleImportacionMasivaOpen}
            sx={{ borderRadius: 2, px: 3 }}
            color="secondary"
          >
            Importar Excel
          </Button>
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleNewEquipo}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Nuevo Equipo
          </Button>
        </Box>
      </Box>

      {/* Tabla de equipos */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <EquiposTable 
            onEdit={handleEditEquipo}
            onDelete={handleDeleteEquipo}
            refresh={refresh}
            onRefreshComplete={handleRefreshComplete}
          />
        </CardContent>
      </Card>

      {/* Formulario de equipo */}
      <EquipoForm 
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        equipo={selectedEquipo}
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
            ¿Estás seguro de que quieres eliminar el equipo <strong>"{selectedEquipo?.nombre}"</strong>?
          </Typography>
          {selectedEquipo && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Código:</strong> {selectedEquipo.codigo}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Marca/Modelo:</strong> {selectedEquipo.marca} {selectedEquipo.modelo}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>N° Serie:</strong> {selectedEquipo.numero_serie}
              </Typography>
            </Box>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Esta acción no se puede deshacer. El equipo será eliminado permanentemente del sistema.
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

      {/* Modal de actividad */}
      <ActividadEquipos
        open={actividadOpen}
        onClose={handleActividadClose}
      />

      {/* Modal de importación masiva */}
      <ImportacionMasivaEquipos
        open={importacionMasivaOpen}
        onClose={handleImportacionMasivaClose}
        onSuccess={handleImportacionMasivaSuccess}
      />

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
