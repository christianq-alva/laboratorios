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
  const [grupos, setGrupos] = useState(1)
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
      const h = response.data.data
      setHorario(h)
      setGrupos(h.num_grupos || 1)
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
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>

                {/* Columna 1: Insumos Requeridos agrupados por categoría */}
                <Box sx={{ pr: { md: 3 }, borderRight: { md: 1 }, borderColor: { md: 'divider' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Inventory fontSize="small" />
                      Insumos Requeridos
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {grupos === 1
                        ? <Person fontSize="small" color="action" />
                        : <People fontSize="small" color="primary" />
                      }
                      <Typography variant="body2" sx={{ fontWeight: 600, color: grupos === 1 ? 'text.secondary' : 'primary.main' }}>
                        {grupos} {grupos === 1 ? 'grupo' : 'grupos'}
                      </Typography>
                    </Box>
                  </Box>
                  {(() => {
                    const items = horario.insumos ?? []
                    if (items.length === 0) {
                      return (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          No se registraron insumos requeridos
                        </Typography>
                      )
                    }
                    // Cálculo en centavos para evitar errores de punto flotante
                    const toCents = (precio: number) => Math.round(precio * 100)
                    const calcCostoCents = (precio: number, cantidad: number, g: number) =>
                      toCents(precio) * cantidad * g
                    const formatS = (cents: number) => `S/. ${(cents / 100).toFixed(2)}`

                    const hayPrecios = items.some(i => Number(i.precio_unitario) > 0)
                    const totalCentsGeneral = hayPrecios
                      ? items.reduce((acc, i) =>
                          acc + calcCostoCents(Number(i.precio_unitario ?? 0), i.cantidad_usada, grupos)
                        , 0)
                      : 0

                    const CATEGORY_ORDER = ['Reactivos', 'Materiales', 'Material_Biologico', 'Farmacos']
                    const CATEGORY_COLOR: Record<string, string> = {
                      Reactivos: '#ff9800',
                      Materiales: '#2196f3',
                      Material_Biologico: '#4caf50',
                      Farmacos: '#9c27b0',
                    }
                    const CATEGORY_LABEL: Record<string, string> = {
                      Material_Biologico: 'Material Biológico',
                      Farmacos: 'Fármacos',
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
                        {sortedCats.map(cat => {
                          const catItems = grouped[cat]
                          const catTienePrecios = catItems.some(i => Number(i.precio_unitario) > 0)
                          return (
                            <Box key={cat}>
                              <Chip
                                label={CATEGORY_LABEL[cat] || cat}
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
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pl: 1 }}>
                                {/* Cabecera de columnas */}
                                {(grupos > 1 || catTienePrecios) && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                    <Typography variant="caption" sx={{ flex: 2 }} />
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, flex: 1 }}>
                                      {grupos > 1 ? 'Por Grupo' : 'Cantidad'}
                                    </Typography>
                                    {grupos > 1 && (
                                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, flex: 1 }}>
                                        Total
                                      </Typography>
                                    )}
                                    {catTienePrecios && (
                                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, flex: 1 }}>
                                        P. Unit.
                                      </Typography>
                                    )}
                                    {catTienePrecios && (
                                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, flex: 1 }}>
                                        Costo
                                      </Typography>
                                    )}
                                  </Box>
                                )}
                                {[...catItems].sort((a, b) => a.nombre.localeCompare(b.nombre)).map(insumo => {
                                  const precio = Number(insumo.precio_unitario ?? 0)
                                  const costoCents = precio > 0
                                    ? calcCostoCents(precio, insumo.cantidad_usada, grupos)
                                    : 0
                                  return (
                                    <Box key={insumo.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 500, flex: 2 }}>
                                        {insumo.nombre}
                                      </Typography>
                                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', flex: 1 }}>
                                        {insumo.cantidad_usada} {insumo.unidad_nombre || 'u.'}
                                      </Typography>
                                      {grupos > 1 && (
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', flex: 1 }}>
                                          {insumo.cantidad_usada * grupos} {insumo.unidad_nombre || 'u.'}
                                        </Typography>
                                      )}
                                      {catTienePrecios && (
                                        <Typography variant="caption" sx={{ color: 'text.secondary', flex: 1 }}>
                                          {precio > 0 ? `S/. ${precio.toFixed(2)}` : '—'}
                                        </Typography>
                                      )}
                                      {catTienePrecios && (
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.main', flex: 1 }}>
                                          {precio > 0 ? formatS(costoCents) : '—'}
                                        </Typography>
                                      )}
                                    </Box>
                                  )
                                })}
                              </Box>
                            </Box>
                          )
                        })}
                        {/* Total general estimado */}
                        {hayPrecios && (
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                              Costo estimado{grupos > 1 ? ` (${grupos} grupos)` : ''}:
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.main' }}>
                              {formatS(totalCentsGeneral)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )
                  })()}
                </Box>

                {/* Columna 2: Equipos Requeridos (compacto) */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Build color="primary" sx={{ fontSize: 16 }} />
                    Equipos Requeridos
                    {horario.equipos && horario.equipos.length > 0 && (
                      <Chip label={horario.equipos.length} size="small" color="primary" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                    )}
                  </Typography>

                  {!horario.equipos || horario.equipos.length === 0 ? (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      No se registraron equipos
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {horario.equipos.map((equipo, index) => (
                        <React.Fragment key={equipo.id}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, py: 0.25 }}>
                            <Build color="action" sx={{ fontSize: 14, mt: 0.25, flexShrink: 0 }} />
                            <Box>
                              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', lineHeight: 1.3 }}>
                                {equipo.nombre}
                              </Typography>
                              {(equipo.marca || equipo.modelo) && (
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                  {[equipo.marca, equipo.modelo].filter(Boolean).join(' ')}
                                </Typography>
                              )}
                              {equipo.codigo && (
                                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.65rem', display: 'block' }}>
                                  {equipo.codigo}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                          {index < horario.equipos!.length - 1 && <Divider sx={{ my: 0.25 }} />}
                        </React.Fragment>
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 0 }} />

            {/* Insumos Consumidos agrupados por categoría (solo horarios cerrados con movimiento) */}
            {horario.estado === 'C' && horario.tiene_consumo_insumos === 1 && (() => {
              const items = horario.insumos_consumidos ?? []
              if (items.length === 0) return null
              const CATEGORY_ORDER = ['Reactivos', 'Materiales', 'Material_Biologico', 'Farmacos']
              const CATEGORY_COLOR: Record<string, string> = {
                Reactivos: '#ff9800',
                Materiales: '#2196f3',
                Material_Biologico: '#4caf50',
                Farmacos: '#9c27b0',
              }
              const CATEGORY_LABEL: Record<string, string> = {
                Material_Biologico: 'Material Biológico',
                Farmacos: 'Fármacos',
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
                            label={CATEGORY_LABEL[cat] || cat}
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
        numGrupos={grupos}
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