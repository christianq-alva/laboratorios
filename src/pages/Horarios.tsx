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
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material'
import { Add, Schedule, Warning, ViewList, CalendarMonth } from '@mui/icons-material'
import { HorariosTable } from '../components/Horarios/HorariosTable'
import { CalendarioSemanal } from '../components/Horarios/CalendarioSemanal'
import { HorarioFormSimple as HorarioForm } from '../components/Horarios/HorarioFormSimple'
import { HorarioDetalle } from '../components/Horarios/HorarioDetalle'
import { horarioService } from '../services/horarioService'
import type { Horario } from '../services/horarioService'

export const Horarios: React.FC = () => {
  // Estados para formulario y eliminación
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [detalleOpen, setDetalleOpen] = useState(false)
  const [selectedHorario, setSelectedHorario] = useState<Horario | null>(null)
  const [selectedHorarioId, setSelectedHorarioId] = useState<number | null>(null)
  const [refresh, setRefresh] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  
  // Estado para alternar entre vista de tabla y calendario
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('calendar')
  
  // Estados para notificaciones
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  })

  // Función para abrir formulario de nuevo horario
  const handleNewHorario = () => {
    setSelectedHorario(null)
    setFormOpen(true)
  }

  // Función para editar horario
  const handleEditHorario = (horario: Horario) => {
    setSelectedHorario(horario)
    setFormOpen(true)
  }

  // Función para cerrar formulario
  const handleFormClose = () => {
    setFormOpen(false)
    setSelectedHorario(null)
  }

  // Función cuando el formulario tiene éxito
  const handleFormSuccess = () => {
    setRefresh(prev => !prev)
    setSnackbar({
      open: true,
      message: selectedHorario ? 'Horario actualizado correctamente' : 'Horario creado correctamente',
      severity: 'success'
    })
  }

  // Función para ver detalles del horario
  const handleViewHorario = (horario: Horario) => {
    setSelectedHorarioId(horario.id)
    setDetalleOpen(true)
  }

  // Función para cerrar detalles
  const handleDetalleClose = () => {
    setDetalleOpen(false)
    setSelectedHorarioId(null)
  }

  // Función para confirmar eliminación
  const handleDeleteHorario = (horario: Horario) => {
    setSelectedHorario(horario)
    setDeleteOpen(true)
  }

  // Función para cerrar diálogo de eliminación
  const handleDeleteClose = () => {
    if (!deleteLoading) {
      setDeleteOpen(false)
      setSelectedHorario(null)
    }
  }

  // Función para confirmar eliminación
  const handleDeleteConfirm = async () => {
    if (!selectedHorario) return

    setDeleteLoading(true)
    try {
      const result = await horarioService.delete(selectedHorario.id)
      
      if (result.success) {
        setDeleteOpen(false)
        setSelectedHorario(null)
        setRefresh(prev => !prev)
        setSnackbar({
          open: true,
          message: 'Horario eliminado correctamente. Los insumos han sido devueltos al stock.',
          severity: 'success'
        })
      } else {
        setSnackbar({
          open: true,
          message: result.message || 'Error al eliminar el horario',
          severity: 'error'
        })
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error de conexión al eliminar el horario',
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', padding: 0, margin: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Encabezado */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, px: 3, pt: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
            Horarios
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona las reservas de laboratorios y asignación de docentes
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Selector de vista */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newViewMode) => {
              if (newViewMode !== null) {
                setViewMode(newViewMode)
              }
            }}
            size="small"
          >
            <ToggleButton value="calendar" aria-label="vista calendario">
              <CalendarMonth fontSize="small" />
              Calendario
            </ToggleButton>
            <ToggleButton value="table" aria-label="vista tabla">
              <ViewList fontSize="small" />
              Tabla
            </ToggleButton>
          </ToggleButtonGroup>
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleNewHorario}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Nuevo Horario
          </Button>
          
          <Button
            variant="outlined"
            onClick={async () => {
              try {
                const result = await horarioService.debug()
                console.log('🔍 DEBUG RESULT:', result)
                if (result.success) {
                  const info = result.debug_info
                  const mensaje = `
DEBUG COMPLETO:
• Total reservas: ${info.total_reservas}
• Con JOINs: ${info.reservas_con_joins}
• Registros huérfanos: ${info.registros_huerfanos}
• IDs inválidos: ${info.registros_con_ids_invalidos}

${info.registros_huerfanos > 0 ? `⚠️ HAY ${info.registros_huerfanos} REGISTROS HUÉRFANOS` : '✅ TODOS LOS REGISTROS TIENEN DATOS COMPLETOS'}
${info.registros_con_ids_invalidos > 0 ? `⚠️ HAY ${info.registros_con_ids_invalidos} REGISTROS CON IDs INVÁLIDOS` : '✅ TODOS LOS IDs SON VÁLIDOS'}
                  `
                  alert(mensaje)
                  
                  // Mostrar detalles en consola
                  if (info.registros_huerfanos > 0) {
                    console.log('🔍 Registros huérfanos:', info.registros_huerfanos_detalle)
                  }
                  if (info.registros_con_ids_invalidos > 0) {
                    console.log('🔍 Registros con IDs inválidos:', info.registros_con_ids_invalidos_detalle)
                  }
                } else {
                  alert('Error en debug: ' + result.message)
                }
              } catch (err) {
                console.error('Debug error:', err)
                alert('Error en debug')
              }
            }}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Debug
          </Button>
        </Box>
      </Box>

      {/* Contenido según el modo de vista */}
      {viewMode === 'calendar' ? (
        <CalendarioSemanal
          onEdit={handleEditHorario}
          onDelete={handleDeleteHorario}
          onView={handleViewHorario}
          onNewHorario={handleNewHorario}
          refresh={refresh}
          onRefreshComplete={handleRefreshComplete}
        />
      ) : (
        <Card>
          <CardContent sx={{ p: 0 }}>
            <HorariosTable 
              onEdit={handleEditHorario}
              onDelete={handleDeleteHorario}
              onView={handleViewHorario}
              refresh={refresh}
              onRefreshComplete={handleRefreshComplete}
            />
          </CardContent>
        </Card>
      )}

      {/* Formulario de horario */}
      <HorarioForm 
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        horario={selectedHorario}
      />

      {/* Diálogo de detalles */}
      <HorarioDetalle
        open={detalleOpen}
        onClose={handleDetalleClose}
        horarioId={selectedHorarioId}
      />

      {/* Diálogo de eliminación */}
      <Dialog open={deleteOpen} onClose={handleDeleteClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Warning color="error" />
            Confirmar Eliminación de Horario
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            ¿Estás seguro de que quieres eliminar este horario?
          </Typography>
          
          {selectedHorario && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Schedule fontSize="small" />
                {selectedHorario.laboratorio}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Docente:</strong> {selectedHorario.docente}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Grupo:</strong> {selectedHorario.grupo} ({selectedHorario.escuela})
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Fecha:</strong> {formatDateTime(selectedHorario.fecha_inicio)} - {formatDateTime(selectedHorario.fecha_fin)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Descripción:</strong> {selectedHorario.descripcion}
              </Typography>
              {selectedHorario.insumos && selectedHorario.insumos.length > 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  <strong>Insumos:</strong> {selectedHorario.insumos.length} elementos serán devueltos al stock
                </Typography>
              )}
            </Box>
          )}
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            <strong>Esta acción:</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" component="ul" sx={{ ml: 2 }}>
            <li>Eliminará el horario permanentemente del sistema</li>
            <li>Devolverá automáticamente todos los insumos utilizados al stock</li>
            <li>Registrará el movimiento en el historial de insumos</li>
            <li>No se puede deshacer</li>
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
              'Eliminar Horario'
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