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
  Refresh,
  Warning,
  Lock
} from '@mui/icons-material'
import { horarioService, type HorarioFull } from '../../services/horarioService'
import { RegistrarInsumosUsadosModal } from './RegistrarInsumosUsadosModal'
import dayjs from 'dayjs'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../hooks/useAuth'
interface HorarioDetalleProps {
  open: boolean
  onClose: () => void
  horarioId: number
  onHorarioUpdated?: () => void
}

export const HorarioDetalle: React.FC<HorarioDetalleProps> = ({
  open,
  onClose,
  horarioId,
  onHorarioUpdated
}) => {
  const { execute } = useApi()
  const [horario, setHorario] = useState<HorarioFull | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registrarInsumosOpen, setRegistrarInsumosOpen] = useState(false)
  const [confirmacionDialogOpen, setConfirmacionDialogOpen] = useState(false)
  const [confirmarReabrirOpen, setConfirmarReabrirOpen] = useState(false)
  const [tieneMovimiento, setTieneMovimiento] = useState(false)
  const { user } = useAuth()
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
    if (horario && horario.insumos && horario.insumos.length > 0) {
      // Si tiene insumos, abrir el modal directamente
      setRegistrarInsumosOpen(true)
    } else {
      // Si no tiene insumos, mostrar diálogo de confirmación
      setConfirmacionDialogOpen(true)
    }
  }

  const handleCerrarHorario = async () => {

    setConfirmacionDialogOpen(false)
    const response = await execute(() => horarioService.cerrarHorario(horarioId))
    if (response.error) {
      setError(response.error)
    } else {
      loadHorario() // Recargar datos
      onHorarioUpdated?.()
    }
  }
  // Función para cerrar modal y recargar (maqueta)
  const handleRegistrarInsumosSuccess = () => {
    setRegistrarInsumosOpen(false)
    loadHorario() // Recargar datos
    onHorarioUpdated?.()
  }

  // Función para verificar si tiene movimiento y mostrar modal de confirmación
  const handleReabrirClick = () => {
    // El campo tiene_consumo_insumos es TINYINT(1), devuelve 0 o 1 como número
    const tieneMovimiento = horario?.tiene_consumo_insumos === 1
    setTieneMovimiento(tieneMovimiento)
    setConfirmarReabrirOpen(true)
  }

  // Función para reabrir horario
  const handleReabrirHorario = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await execute(() => horarioService.reabrirHorario(horarioId))

      if (response.error) {
        setError(response.error)
      } else {
        // Recargar horario
        await loadHorario()
        setConfirmarReabrirOpen(false)
        setTieneMovimiento(false)
        onHorarioUpdated?.()
      }
    } catch (err) {
      setError('Error al reabrir el horario')
    } finally {
      setLoading(false)
    }
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
            <Box sx={{ p: 3, bgcolor: 'primary.50', border: 1, borderColor: 'primary.200' }}>
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
            </Box>

            {/* Alerta de consumo de insumos */}
            {horario.estado === 'C' && horario.tiene_consumo_insumos === 1 && (
              <>
                <Divider sx={{ my: 0 }} />
                <Box sx={{ p: 3 }}>
                  <Alert
                    severity="info"
                    icon={<Inventory />}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                      Este horario tiene un movimiento de inventario asociado
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Se registró el consumo real de insumos al cerrar este horario.
                      Los saldos de inventario fueron actualizados según el consumo registrado.
                    </Typography>
                  </Alert>
                </Box>
              </>
            )}

            <Divider sx={{ my: 0 }} />

            {/* Información de la clase */}
            <Box sx={{ p: 3 }}>
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
            </Box>

            <Divider sx={{ my: 0 }} />

            {/* Insumos Requeridos + Equipos en grid de dos columnas */}
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>

                {/* Columna 1: Insumos Requeridos agrupados por categoría */}
                <Box sx={{ pr: { md: 3 }, borderRight: { md: 1 }, borderColor: { md: 'divider' } }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Inventory fontSize="small" />
                    Insumos Requeridos
                  </Typography>
                  {(() => {
                    const items = horario.insumos ?? []
                    if (items.length === 0) {
                      return (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          No se registraron insumos requeridos
                        </Typography>
                      )
                    }
                    const CATEGORY_ORDER = ['Reactivos', 'Materiales', 'Material Biológico']
                    const CATEGORY_COLOR: Record<string, string> = {
                      Reactivos: '#ff9800',
                      Materiales: '#2196f3',
                      'Material Biológico': '#4caf50',
                    }
                    const grouped: Record<string, typeof items> = {}
                    for (const insumo of items) {
                      const cat = insumo.categoria || 'Otros'
                      if (!grouped[cat]) grouped[cat] = []
                      grouped[cat].push(insumo)
                    }
                    const sortedCats = [
                      ...CATEGORY_ORDER.filter(c => grouped[c]),
                      ...Object.keys(grouped).filter(c => !CATEGORY_ORDER.includes(c)).sort(),
                    ]
                    return (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {sortedCats.map(cat => (
                          <Box key={cat}>
                            <Chip
                              label={cat}
                              size="small"
                              sx={{
                                bgcolor: CATEGORY_COLOR[cat] || '#757575',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.65rem',
                                height: 18,
                                mb: 1,
                              }}
                            />
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pl: 1 }}>
                              {[...grouped[cat]].sort((a, b) => a.nombre.localeCompare(b.nombre)).map(insumo => (
                                <Box key={insumo.id}>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {insumo.nombre}
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <Typography variant="caption" color="text.secondary">
                                      {insumo.codigo}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      •
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                      {insumo.cantidad_usada} {insumo.unidad_nombre || 'unidades'}
                                    </Typography>
                                  </Box>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )
                  })()}
                </Box>

                {/* Columna 2: Equipos Requeridos */}
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Build color="primary" fontSize="small" />
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
                    <List disablePadding>
                      {horario.equipos.map((equipo, index) => (
                        <React.Fragment key={equipo.id}>
                          <ListItem sx={{ px: 0, py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <Build color="action" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {equipo.nombre}
                                </Typography>
                              }
                              secondary={
                                <Box>
                                  {equipo.marca && equipo.modelo && (
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      {equipo.marca} {equipo.modelo}
                                    </Typography>
                                  )}
                                  {equipo.codigo && (
                                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                      {equipo.codigo}
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
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 0 }} />

            {/* Insumos Consumidos agrupados por categoría (solo horarios cerrados con movimiento) */}
            {horario.estado === 'C' && horario.tiene_consumo_insumos === 1 && (() => {
              const items = horario.insumos_consumidos ?? []
              if (items.length === 0) return null
              const CATEGORY_ORDER = ['Reactivos', 'Materiales', 'Material Biológico']
              const CATEGORY_COLOR: Record<string, string> = {
                Reactivos: '#ff9800',
                Materiales: '#2196f3',
                'Material Biológico': '#4caf50',
              }
              const grouped: Record<string, typeof items> = {}
              for (const insumo of items) {
                const cat = insumo.categoria || 'Otros'
                if (!grouped[cat]) grouped[cat] = []
                grouped[cat].push(insumo)
              }
              const sortedCats = [
                ...CATEGORY_ORDER.filter(c => grouped[c]),
                ...Object.keys(grouped).filter(c => !CATEGORY_ORDER.includes(c)).sort(),
              ]
              return (
                <>
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle fontSize="small" color="success" />
                      Insumos Consumidos
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fill, minmax(200px, 1fr))' }, gap: 3 }}>
                      {sortedCats.map(cat => (
                        <Box key={cat}>
                          <Chip
                            label={cat}
                            size="small"
                            sx={{
                              bgcolor: CATEGORY_COLOR[cat] || '#757575',
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.65rem',
                              height: 18,
                              mb: 1,
                            }}
                          />
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pl: 1 }}>
                            {[...grouped[cat]].sort((a, b) => a.nombre.localeCompare(b.nombre)).map(insumo => (
                              <Box key={insumo.id}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {insumo.nombre}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                  <Typography variant="caption" color="text.secondary">
                                    {insumo.codigo}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    •
                                  </Typography>
                                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                    {insumo.cantidad_consumida} {insumo.unidad_simbolo || insumo.unidad_nombre || 'unidades'}
                                  </Typography>
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                  <Divider sx={{ my: 0 }} />
                </>
              )
            })()}

            {/* Información adicional */}
            <Box sx={{ p: 3 }}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>ID de Horario:</strong> #{horario.id} |
                  <strong>Fecha de Creación:</strong> {formatFechaHora(horario.fecha_creacion)}
                </Typography>
              </Alert>
            </Box>
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
        {horario && horario.estado === 'P' && (
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircle />}
            onClick={handleOpenRegistrarInsumos}
          >
            Cerrar Horario
          </Button>
        )}
        {horario && horario.estado === 'C' && user?.rol === 'Administrador' && (
          <Button
            variant="contained"
            color="success"
            startIcon={<Refresh />}
            onClick={handleReabrirClick}
            disabled={loading}
          >
            Reabrir Horario
          </Button>
        )}
        {horario && horario.estado === 'C' && user?.rol === 'Jefe de Laboratorio' && (
          <Button
            variant="contained"
            startIcon={<Lock />}
            disabled={true}
          >
            Horario Cerrado
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

      {/* Diálogo de confirmación para horarios sin insumos */}
      <Dialog
        open={confirmacionDialogOpen}
        onClose={() => setConfirmacionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Inventory color="warning" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Sin Insumos Registrados
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Este horario no tiene insumos requeridos asignados.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            ¿Deseas registrar los insumos consumidos durante la clase antes de cerrar el horario?
            Esto te permitirá documentar adecuadamente el consumo de inventario.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ gap: 1 }}>
          <Button
            onClick={() => {
              setConfirmacionDialogOpen(false)
              handleCerrarHorario()
            }}
            variant="outlined"
          >
            Cerrar sin registrar
          </Button>
          <Button
            onClick={() => {
              setConfirmacionDialogOpen(false)
              setRegistrarInsumosOpen(true)
            }}
            variant="contained"
            color="warning"
          >
            Registrar insumos
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación para reabrir horario */}
      <Dialog
        open={confirmarReabrirOpen}
        onClose={() => setConfirmarReabrirOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning color="warning" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Confirmar Reapertura
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            ¿Estás seguro de que deseas reabrir este horario?
          </Typography>
          {tieneMovimiento && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Advertencia:</strong> Este horario tiene un movimiento de inventario asociado
                que será eliminado al reabrir. Los saldos de los insumos serán revertidos automáticamente.
              </Typography>
            </Alert>
          )}
          <Typography variant="body2" color="text.secondary">
            Al reabrir el horario, podrás editarlo nuevamente.
            {tieneMovimiento && ' El movimiento de inventario será eliminado y los saldos revertidos.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ gap: 1 }}>
          <Button
            onClick={() => setConfirmarReabrirOpen(false)}
            variant="outlined"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleReabrirHorario}
            variant="contained"
            color="success"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}
          >
            {loading ? 'Reabriendo...' : 'Reabrir Horario'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
} 