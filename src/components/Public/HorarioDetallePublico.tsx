import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert
} from '@mui/material'
import {
  Close,
  Schedule,
  Person,
  LocationOn,
  School,
  Inventory,
  CalendarToday,
  People
} from '@mui/icons-material'
import dayjs from 'dayjs'

interface InsumoPublico {
  id: number
  nombre: string
  descripcion?: string
  cantidad_usada: number
  unidad_simbolo?: string
  unidad_nombre?: string
}

interface HorarioPublicoDetalle {
  id: number
  laboratorio: string
  docente: string
  grupo: string
  ciclo: string
  escuela: string
  descripcion: string
  fecha_inicio: string
  fecha_fin: string
  cantidad_alumnos?: number
  insumos?: InsumoPublico[]
}

interface HorarioDetallePublicoProps {
  open: boolean
  onClose: () => void
  horario: HorarioPublicoDetalle | null
}

export const HorarioDetallePublico: React.FC<HorarioDetallePublicoProps> = ({ 
  open, 
  onClose, 
  horario 
}) => {
  // Función para formatear hora
  const formatHora = (fecha: string) => {
    const fechaFormateada = typeof fecha === 'string' && 
                          fecha.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/) ?
                          dayjs(fecha, 'YYYY-MM-DD HH:mm:ss') :
                          dayjs(fecha)
    return fechaFormateada.format('HH:mm')
  }

  // Función para formatear fecha y hora
  const formatFechaHora = (fecha: string) => {
    const fechaFormateada = typeof fecha === 'string' && 
                          fecha.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/) ?
                          dayjs(fecha, 'YYYY-MM-DD HH:mm:ss') :
                          dayjs(fecha)
    return fechaFormateada.format('DD/MM/YYYY HH:mm')
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {horario ? (
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
                
                {horario.cantidad_alumnos && (
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
                )}
              </Box>
            </Paper>

            {/* Insumos requeridos */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Inventory color="primary" />
                Insumos Requeridos
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
                                label={`${insumo.cantidad_usada} ${insumo.unidad_simbolo || 'unidades'}`}
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
        <Button onClick={onClose} variant="outlined">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
