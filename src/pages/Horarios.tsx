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
import { Add, Schedule, Warning, ViewList, CalendarMonth, Repeat, History } from '@mui/icons-material'
import { HorariosTable } from '../components/Horarios/HorariosTable'
import { CalendarioSimple } from '../components/Horarios/CalendarioSimple'
import { HorarioFormSimple as HorarioForm } from '../components/Horarios/HorarioFormSimple'
import { HorarioRecurrente } from '../components/Horarios/HorarioRecurrente'
import { HorarioDetalle } from '../components/Horarios/HorarioDetalle'
import { ActividadHorarios } from '../components/Horarios/ActividadHorarios'
import { ShareModal } from '../components/Share/ShareModal'
import { ExportModal } from '../components/Export/ExportModal'
import { horarioService } from '../services/horarioService'
import type { HorarioSimple } from '../services/horarioService'
import { useApi } from '../hooks/useApi'

export const Horarios: React.FC = () => {
  const { execute } = useApi()
  // Estados para formulario y eliminación
  const [formOpen, setFormOpen] = useState(false)
  const [recurrenteOpen, setRecurrenteOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [detalleOpen, setDetalleOpen] = useState(false)
  const [actividadOpen, setActividadOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [selectedHorario, setSelectedHorario] = useState<HorarioSimple | null>(null)
  const [selectedHorarioId, setSelectedHorarioId] = useState<number | null>(null)
  const [selectedLaboratorioId, setSelectedLaboratorioId] = useState<number | undefined>()
  const [currentWeek] = useState<Date>(new Date())
  const [currentLaboratorioName] = useState<string>('')
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

  // Función para abrir formulario de horarios recurrentes
  const handleNewHorarioRecurrente = () => {
    setRecurrenteOpen(true)
  }

  // Función para cerrar formulario de horarios recurrentes
  const handleRecurrenteClose = () => {
    setRecurrenteOpen(false)
  }

  // Función cuando el formulario recurrente tiene éxito
  const handleRecurrenteSuccess = () => {
    setRefresh(prev => !prev)
    setSnackbar({
      open: true,
      message: 'Horarios recurrentes creados correctamente',
      severity: 'success'
    })
  }

  // Función para editar horario
  const handleEditHorario = (horario: HorarioSimple) => {
    setSelectedHorario(horario)
    setFormOpen(true)
  }

  // Función para cerrar formulario
  const handleFormClose = () => {
    setFormOpen(false)
    setSelectedHorario(null)
  }

  // Función cuando el formulario tiene éxito
  const handleFormSuccess = ( message: string ) => {
    setRefresh(prev => !prev)
    setSnackbar({
      open: true,
      message: message,
      severity: 'success'
    })
  }

  // Función para ver detalles del horario
  const handleViewHorario = (horario: HorarioSimple) => {
    setSelectedHorarioId(horario.id)
    setDetalleOpen(true)
  }

  // Función para cerrar detalles
  const handleDetalleClose = () => {
    setDetalleOpen(false)
    setSelectedHorarioId(null)
  }

  // Función para abrir modal de actividad
  const handleActividad = () => {
    setActividadOpen(true)
  }

  // Función para cerrar modal de actividad
  const handleActividadClose = () => {
    setActividadOpen(false)
  }

  // Función para abrir modal de compartir
  const handleShare = (laboratorioId?: number) => {
    setSelectedLaboratorioId(laboratorioId)
    setShareOpen(true)
  }

  // Función para cerrar modal de compartir
  const handleShareClose = () => {
    setShareOpen(false)
    setSelectedLaboratorioId(undefined)
  }

  // Función para abrir modal de exportar
  const handleExport = () => {
    setExportOpen(true)
  }

  // Función para cerrar modal de exportar
  const handleExportClose = () => {
    setExportOpen(false)
  }

  // Función para confirmar eliminación
  const handleDeleteHorario = (horario: HorarioSimple) => {
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
    const result = await execute(() => horarioService.delete(selectedHorario.id))

    if (result.error) {
      setDeleteOpen(false)
      setSelectedHorario(null)
      setRefresh(prev => !prev)
      setSnackbar({
        open: true,
        message: result.error,
        severity: 'error'
      })
    } else if (result.data) {
      setDeleteOpen(false)
      setSelectedHorario(null)
      setRefresh(prev => !prev)
      setSnackbar({
        open: true,
        message: result.data.message,
        severity: 'success'
      })
    }
    setDeleteLoading(false)

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
      {/* Encabezado compacto */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: 2,
        py: 1.5,
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#fafafa'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
            Horarios
          </Typography>

          {/* Selector de vista compacto */}
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
            </ToggleButton>
            <ToggleButton value="table" aria-label="vista tabla">
              <ViewList fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleNewHorario}
            size="small"
          >
            Nuevo
          </Button>

          <Button
            variant="outlined"
            startIcon={<Repeat />}
            onClick={handleNewHorarioRecurrente}
            size="small"
            color="secondary"
          >
            Recurrente
          </Button>

          <Button
            variant="outlined"
            startIcon={<History />}
            onClick={handleActividad}
            size="small"
            color="info"
          >
            Actividad
          </Button>
        </Box>
      </Box>

      {/* Contenido según el modo de vista */}
      {viewMode === 'calendar' ? (
        <CalendarioSimple
          onEdit={handleEditHorario}
          onDelete={handleDeleteHorario}
          onView={handleViewHorario}
          onNewHorario={handleNewHorario}
          onShare={handleShare}
          onExport={handleExport}
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

      {/* Formulario de horarios recurrentes */}
      <HorarioRecurrente
        open={recurrenteOpen}
        onClose={handleRecurrenteClose}
        onSuccess={handleRecurrenteSuccess}
      />

      {/* Diálogo de detalles */}
      <HorarioDetalle
        open={detalleOpen}
        onClose={handleDetalleClose}
        horarioId={selectedHorarioId || 0}
      />

      {/* Modal de actividad */}
      <ActividadHorarios
        open={actividadOpen}
        onClose={handleActividadClose}
      />

      {/* Modal de compartir */}
      <ShareModal
        open={shareOpen}
        onClose={handleShareClose}
        selectedLaboratorioId={selectedLaboratorioId}
      />

      {/* Modal de exportar */}
      <ExportModal
        open={exportOpen}
        onClose={handleExportClose}
        elementId="calendario-exportable"
        laboratorioNombre={currentLaboratorioName || 'Horarios Semanales'}
        semanaInicio={currentWeek}
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