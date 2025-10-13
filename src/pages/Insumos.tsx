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
import { Warning, History, TrendingUp, CloudUpload, FileUpload, LibraryBooks } from '@mui/icons-material'
import { InsumosTable } from '../components/Insumos/InsumosTable'
import { InsumoForm } from '../components/Insumos/InsumoForm'
import { ActividadInsumos } from '../components/Insumos/ActividadInsumos'
import { ReabastecimientoModal } from '../components/Insumos/ReabastecimientoModal'
import { CargaMasivaModal } from '../components/Insumos/CargaMasivaModal'
import { ImportacionMasiva } from '../components/Insumos/ImportacionMasiva'
import { CatalogoInsumosModal } from '../components/Insumos/CatalogoInsumosModal'
import { insumoService, type Insumo } from '../services/insumoService'

export const Insumos: React.FC = () => {
  // Estados para formulario y eliminación
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | null>(null)
  const [refresh, setRefresh] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [actividadOpen, setActividadOpen] = useState(false)
  const [reabastecimientoOpen, setReabastecimientoOpen] = useState(false)
  const [cargaMasivaOpen, setCargaMasivaOpen] = useState(false)
  const [importacionMasivaOpen, setImportacionMasivaOpen] = useState(false)
  const [catalogoOpen, setCatalogoOpen] = useState(false)
  
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
      console.log('🗑️ Intentando eliminar insumo:', selectedInsumo.id)
      const result = await insumoService.delete(selectedInsumo.id)
      
      if (result.success) {
        console.log('✅ Insumo eliminado correctamente')
        setDeleteOpen(false)
        setSelectedInsumo(null)
        setRefresh(prev => !prev)
        setSnackbar({
          open: true,
          message: 'Insumo eliminado correctamente',
          severity: 'success'
        })
      } else {
        console.error('❌ Error al eliminar insumo:', result)
        setSnackbar({
          open: true,
          message: result.message || 'Error al eliminar el insumo',
          severity: 'error'
        })
      }
    } catch (err: any) {
      console.error('❌ Error de conexión:', {
        error: err.message,
        response: err.response?.data,
        status: err.response?.status
      })
      
      let errorMessage = 'Error de conexión al eliminar el insumo'
      
      if (err.response?.status === 403) {
        errorMessage = 'No tienes permisos para eliminar este insumo'
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

  // Función para abrir reabastecimiento
  const handleOpenReabastecimiento = () => {
    setReabastecimientoOpen(true)
  }

  // Función para cerrar reabastecimiento
  const handleCloseReabastecimiento = () => {
    setReabastecimientoOpen(false)
  }

  // Función para éxito de reabastecimiento
  const handleReabastecimientoSuccess = () => {
    setRefresh(prev => !prev)
    setSnackbar({
      open: true,
      message: 'Reabastecimiento procesado correctamente',
      severity: 'success'
    })
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

  // Función para abrir carga masiva
  const handleCargaMasivaOpen = () => {
    setCargaMasivaOpen(true)
  }

  // Función para cerrar carga masiva
  const handleCargaMasivaClose = () => {
    setCargaMasivaOpen(false)
  }

  // Función para éxito de carga masiva
  const handleCargaMasivaSuccess = () => {
    setRefresh(prev => !prev)
    setSnackbar({
      open: true,
      message: 'Carga masiva procesada correctamente',
      severity: 'success'
    })
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
      message: 'Importación masiva completada correctamente',
      severity: 'success'
    })
  }

  // Función para abrir catálogo
  const handleCatalogoOpen = () => {
    setCatalogoOpen(true)
  }

  // Función para cerrar catálogo
  const handleCatalogoClose = () => {
    setCatalogoOpen(false)
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
            startIcon={<LibraryBooks />}
            onClick={handleCatalogoOpen}
            sx={{ borderRadius: 2, px: 3 }}
            color="primary"
          >
            Catálogo
          </Button>

          <Button
            variant="outlined"
            startIcon={<History />}
            onClick={handleActividadOpen}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Movimiento
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<TrendingUp />}
            onClick={handleOpenReabastecimiento}
            sx={{ borderRadius: 2, px: 3 }}
            color="success"
          >
            Reabastecimiento
          </Button>

          <Button
            variant="outlined"
            startIcon={<CloudUpload />}
            onClick={handleCargaMasivaOpen}
            sx={{ borderRadius: 2, px: 3 }}
            color="info"
          >
            Carga Masiva
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
        </Box>
      </Box>

      {/* Tabla de insumos */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <InsumosTable 
            onEdit={handleEditInsumo}
            onDelete={handleDeleteInsumo}
            onCargaMasiva={handleCargaMasivaOpen}
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

      {/* Modal de reabastecimiento */}
      <ReabastecimientoModal
        open={reabastecimientoOpen}
        onClose={handleCloseReabastecimiento}
        onSuccess={handleReabastecimientoSuccess}
      />

      {/* Modal de carga masiva */}
      <CargaMasivaModal
        open={cargaMasivaOpen}
        onClose={handleCargaMasivaClose}
        onSuccess={handleCargaMasivaSuccess}
      />

      {/* Modal de importación masiva */}
      <ImportacionMasiva
        open={importacionMasivaOpen}
        onClose={handleImportacionMasivaClose}
        onSuccess={handleImportacionMasivaSuccess}
      />

      {/* Modal de catálogo de insumos */}
      <CatalogoInsumosModal
        open={catalogoOpen}
        onClose={handleCatalogoClose}
        onNewInsumo={handleNewInsumo}
        onEditInsumo={handleEditInsumo}
        refresh={refresh}
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