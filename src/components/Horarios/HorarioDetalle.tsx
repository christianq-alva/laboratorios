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
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material'
import {
  Close,
  Schedule,
  Person,
  LocationOn,
  School,
  Group,
  Inventory,
  CalendarToday,
  AccessTime,
  People,
  Description
} from '@mui/icons-material'
import { horarioService, type Horario } from '../../services/horarioService'
import dayjs from 'dayjs'

interface HorarioDetalleProps {
  open: boolean
  onClose: () => void
  horarioId: number | null
}

export const HorarioDetalle: React.FC<HorarioDetalleProps> = ({ 
  open, 
  onClose, 
  horarioId 
}) => {
  const [horario, setHorario] = useState<Horario | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar detalles del horario
  const loadHorario = async () => {
    if (!horarioId) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await horarioService.getById(horarioId)
      if (response.success) {
        setHorario(response.data)
      } else {
        setError(response.message || 'Error al cargar horario')
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión')
      console.error('Error al cargar horario:', err)
    } finally {
      setLoading(false)
    }
  }

  // Efecto para cargar horario cuando se abre el diálogo
  useEffect(() => {
    if (open && horarioId) {
      loadHorario()
    }
  }, [open, horarioId])

  // Función para cerrar el diálogo
  const handleClose = () => {
    setHorario(null)
    setError(null)
    onClose()
  }

  // Función para formatear fecha
  const formatFecha = (fecha: string) => {
    return dayjs(fecha).format('DD/MM/YYYY')
  }

  // Función para formatear hora
  const formatHora = (fecha: string) => {
    return dayjs(fecha).format('HH:mm')
  }

  // Función para formatear fecha y hora
  const formatFechaHora = (fecha: string) => {
    return dayjs(fecha).format('DD/MM/YYYY HH:mm')
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
            <Schedule color="primary" />
            Detalles del Horario
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
        ) : horario ? (
          <Box>
            {/* Información principal del horario */}
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.50', border: 1, borderColor: 'primary.200' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Schedule color="primary" sx={{ fontSize: 32 }} />
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    Horario #{horario.id}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    {formatFechaHora(horario.fecha_inicio)} - {formatHora(horario.fecha_fin)}
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                {horario.descripcion}
              </Typography>
            </Paper>

            {/* Información de la clase */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <School color="primary" />
                Información de la Clase
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LocationOn color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Laboratorio
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {horario.laboratorio}
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
                      {horario.docente}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Group color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Grupo
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {horario.grupo}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <School color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Escuela
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {horario.escuela}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CalendarToday color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Ciclo
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {horario.ciclo}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <People color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Cantidad de Alumnos
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {horario.cantidad_alumnos}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>

            {/* Insumos utilizados */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Inventory color="primary" />
                Insumos Utilizados
                {horario.insumos && horario.insumos.length > 0 && (
                  <Chip 
                    label={horario.insumos.length} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                )}
              </Typography>
              
              {!horario.insumos || horario.insumos.length === 0 ? (
                <Alert severity="info">
                  <Typography variant="body2">
                    No se registraron insumos para este horario
                  </Typography>
                </Alert>
              ) : (
                <List>
                  {horario.insumos.map((insumo, index) => (
                    <React.Fragment key={insumo.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Inventory color="action" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {insumo.nombre}
                              </Typography>
                              <Chip 
                                label={`${insumo.cantidad_usada} ${insumo.unidad_medida || 'unidades'}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            insumo.descripcion && (
                              <Typography variant="body2" color="text.secondary">
                                {insumo.descripcion}
                              </Typography>
                            )
                          }
                        />
                      </ListItem>
                      {index < horario.insumos!.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>

            {/* Información adicional */}
            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>ID de Horario:</strong> #{horario.id} | 
                <strong>Fecha de Creación:</strong> {formatFechaHora(horario.fecha_inicio)}
              </Typography>
            </Alert>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Schedule sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Horario no encontrado
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No se pudo cargar la información del horario
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