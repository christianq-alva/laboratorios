import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Paper
} from '@mui/material'
import {
  Close,
  ReportProblem,
  Schedule,
  Person,
  LocationOn,
  Group,
  CalendarToday,
  Description
} from '@mui/icons-material'
import { incidenciaService, type IncidenciaDetalle } from '../../services/incidenciaService'
import dayjs from 'dayjs'

interface IncidenciaDetalleProps {
  open: boolean
  onClose: () => void
  incidenciaId: number | null
}

export const IncidenciaDetalleDialog: React.FC<IncidenciaDetalleProps> = ({ 
  open, 
  onClose, 
  incidenciaId 
}) => {
  const [incidencia, setIncidencia] = useState<IncidenciaDetalle | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar detalles de la incidencia
  const loadIncidencia = async () => {
    if (!incidenciaId) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await incidenciaService.getById(incidenciaId)
      if (response.success) {
        setIncidencia(response.data)
      } else {
        setError(response.message || 'Error al cargar incidencia')
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión')
      console.error('Error al cargar incidencia:', err)
    } finally {
      setLoading(false)
    }
  }

  // Efecto para cargar incidencia cuando se abre el diálogo
  useEffect(() => {
    if (open && incidenciaId) {
      loadIncidencia()
    }
  }, [open, incidenciaId])

  // Función para cerrar el diálogo
  const handleClose = () => {
    setIncidencia(null)
    setError(null)
    onClose()
  }

  // Función para formatear fecha
  const formatFecha = (fecha: string) => {
    return dayjs(fecha).format('DD/MM/YYYY HH:mm')
  }

  // Función para obtener el color del chip según la fecha
  const getFechaColor = (fecha: string) => {
    const fechaIncidencia = dayjs(fecha)
    const ahora = dayjs()
    const diferencia = ahora.diff(fechaIncidencia, 'day')
    
    if (diferencia <= 1) return 'error' // Últimas 24 horas
    if (diferencia <= 7) return 'warning' // Última semana
    return 'default' // Más antigua
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReportProblem color="error" />
            Detalles de la Incidencia
          </Typography>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : incidencia ? (
          <Box>
            {/* Título y estado */}
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'error.50', border: 1, borderColor: 'error.200' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <ReportProblem color="error" sx={{ fontSize: 32 }} />
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'error.main' }}>
                    {incidencia.titulo}
                  </Typography>
                  <Chip 
                    label={formatFecha(incidencia.fecha_reporte)}
                    color={getFechaColor(incidencia.fecha_reporte)}
                    size="small"
                    variant="outlined"
                    icon={<CalendarToday fontSize="small" />}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Box>
              
              <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                {incidencia.descripcion}
              </Typography>
            </Paper>

            {/* Información del horario */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Schedule color="primary" />
                Información de la Clase
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CalendarToday color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Fecha y Hora
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatFecha(incidencia.fecha_clase)}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LocationOn color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Laboratorio
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {incidencia.laboratorio}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Person color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Docente
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {incidencia.docente}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Group color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Cantidad de Alumnos
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {incidencia.cantidad_alumnos}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>

            {/* Información del reporte */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Description color="primary" />
                Información del Reporte
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Person color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Reportado Por
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {incidencia.reportado_por}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CalendarToday color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Fecha de Reporte
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatFecha(incidencia.fecha_reporte)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>

            {/* Información adicional */}
            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>ID de Incidencia:</strong> #{incidencia.id} | 
                <strong>ID de Reserva:</strong> #{incidencia.reserva_id}
              </Typography>
            </Alert>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <ReportProblem sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Incidencia no encontrada
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No se pudo cargar la información de la incidencia
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} variant="outlined">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
} 