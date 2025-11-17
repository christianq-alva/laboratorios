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
  Inventory,
  Build,
  CalendarToday,
  People,
  CheckCircle,
  LockOpen
} from '@mui/icons-material'
import { horarioService, type HorarioFull } from '../../services/horarioService'
import { RegistrarInsumosUsadosModal } from './RegistrarInsumosUsadosModal'
import dayjs from 'dayjs'
import { useApi } from '../../hooks/useApi'
interface HorarioDetalleProps {
  open: boolean
  onClose: () => void
  horarioId: number
}

export const HorarioDetalle: React.FC<HorarioDetalleProps> = ({
  open,
  onClose,
  horarioId
}) => {
  const { execute } = useApi()
  const [horario, setHorario] = useState<HorarioFull | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registrarInsumosOpen, setRegistrarInsumosOpen] = useState(false)

  // Cargar detalles del horario
  const loadHorario = async () => {
    if (!horarioId) return

    setLoading(true)
    setError(null)

    const response = await execute(() => horarioService.getById(horarioId))
    if (response.error) {
      setError(response.error)
    } else if (response.data) {
      setHorario(response.data.data)
    }
    setLoading(false)
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

  // Función para abrir modal de registrar insumos
  const handleOpenRegistrarInsumos = () => {
    setRegistrarInsumosOpen(true)
  }

  // Función para cerrar modal y recargar (maqueta)
  const handleRegistrarInsumosSuccess = () => {
    setRegistrarInsumosOpen(false)
    loadHorario() // Recargar datos
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
                                label={`${insumo.cantidad_usada} ${insumo.unidad_medida || 'unidades'}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={null}
                        />
                      </ListItem>
                      {index < horario.insumos!.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>

            {/* Equipos requeridos */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Build color="primary" />
                Equipos Requeridos
                {horario.equipos && horario.equipos.length > 0 && (
                  <Chip
                    label={horario.equipos.length}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Typography>

              {!horario.equipos || horario.equipos.length === 0 ? (
                <Alert severity="info">
                  <Typography variant="body2">
                    No se registraron equipos para este horario
                  </Typography>
                </Alert>
              ) : (
                <List>
                  {horario.equipos.map((equipo, index) => (
                    <React.Fragment key={equipo.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Build color="action" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {equipo.nombre}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box>
                              {equipo.marca && equipo.modelo && (
                                <Typography variant="body2" color="text.secondary">
                                  {equipo.marca} {equipo.modelo}
                                </Typography>
                              )}
                              {equipo.codigo && (
                                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                  Código: {equipo.codigo}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < horario.equipos!.length - 1 && <Divider />}
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

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined">
          Cerrar
        </Button>
        {horario && horario.insumos && horario.insumos.length > 0 && (
          <Button
            variant="contained"
            color="success"
            startIcon={horario.estado === 'A' ? <CheckCircle /> : <LockOpen />}
            onClick={handleOpenRegistrarInsumos}
            disabled={horario.estado === 'C'}
          >{horario.estado === 'A' ? 'Cerrar Horario' : 'Horario Cerrado'}
          </Button>
        )}
      </DialogActions>

      {/* Modal para registrar insumos usados */}
      <RegistrarInsumosUsadosModal
        open={registrarInsumosOpen}
        onClose={() => setRegistrarInsumosOpen(false)}
        onSuccess={handleRegistrarInsumosSuccess}
        horarioId={horarioId}
        laboratorioId={horario?.laboratorio_id || 0}
        fecha={dayjs(horario?.fecha_inicio).format('YYYY-MM-DD')}
      />
    </Dialog>
  )
} 