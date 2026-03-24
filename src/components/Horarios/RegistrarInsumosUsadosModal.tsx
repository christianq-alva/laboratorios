import React, { useEffect, useState } from 'react'
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Tabs,
  Tab,
  Paper,
  Chip,
  Alert,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress
} from '@mui/material'
import { Close, CheckCircle, Inventory, Info, Add, Delete, Search } from '@mui/icons-material'
import { horarioService, type InsumoHorario } from '../../services/horarioService'
import { useApi } from '../../hooks/useApi'
import { inventarioService, type InsumoSaldo, type LoteInsumo } from '../../services/inventarioService'

interface RegistroLote {
  id: number
  cantidad: number
}

interface InsumoUsado {
  id: number
  nombre: string
  codigo: string
  categoria: string
  unidad_nombre: string
  cantidad_usada: number
  stock_disponible: number
  registrosLotes: RegistroLote[]
  lotesDisponibles: LoteInsumo[]
}

interface RegistrarInsumosUsadosModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  horarioId: number
  laboratorioId: number
  fecha: string
}

// Tabs
interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`insumos-tabpanel-${index}`}
      aria-labelledby={`insumos-tab-${index}`}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  )
}

export const RegistrarInsumosUsadosModal: React.FC<RegistrarInsumosUsadosModalProps> = ({
  open,
  onClose,
  onSuccess,
  horarioId,
  laboratorioId,
  fecha
}) => {
  const { execute } = useApi()
  const [tabValue, setTabValue] = useState(0)
  const [insumosRequeridos, setInsumosRequeridos] = useState<InsumoHorario[]>([])
  const [insumosUsados, setInsumosUsados] = useState<InsumoUsado[]>([])
  const [insumosDisponibles, setInsumosDisponibles] = useState<InsumoSaldo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Estados para tab de insumos adicionales
  const [busquedaInsumo, setBusquedaInsumo] = useState<string>('')

  useEffect(() => {
    if (open) {
      setError(null) // Limpiar error al abrir el modal
      loadInsumosRequeridos()
      if (laboratorioId) {
        loadInsumosDisponibles(laboratorioId)
      }
    }
  }, [open])

  const loadInsumosRequeridos = async () => {
    const response = await execute(() => horarioService.getInsumosRequeridosById(horarioId))
    if (response.error) {
      setError(response.error)
    } else if (response.data) {
      setInsumosRequeridos(response.data.data)
    }
  }
  const loadLotesDisponibles = async (insumoId: number) => {
    try {
      const response = await execute(() => inventarioService.getLotesConSaldo(laboratorioId, insumoId))
      if (response.error) {
        setError(`Error al cargar lotes: ${response.error}`)
        return []
      }
      // Validar que la respuesta tenga la estructura correcta
      const lotes = response.data?.data || response.data || []
      // Filtrar lotes inválidos
      return Array.isArray(lotes)
        ? lotes.filter(lote => lote && typeof lote.detalle_id === 'number' && lote.detalle_id > 0)
        : []
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error inesperado al cargar lotes'
      setError(errorMessage)
      return []
    }
  }

  const loadInsumosDisponibles = async (laboratorioId: number) => {
    const response = await execute(() => inventarioService.getWithStock(laboratorioId))
    if (response.error) {
      setError(response.error)
    } else if (response.data) {
      setInsumosDisponibles(response.data.data)
    }
  }
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleAgregarInsumo = async (insumo: InsumoHorario) => {
    // Verificar si ya está agregado
    const yaExiste = insumosUsados.find(i => i.id === insumo.id)
    if (yaExiste) return

    const insumoDisponible = insumosDisponibles.find(i => i.id === insumo.id)
    if (!insumoDisponible) {
      setError('Insumo no disponible en el inventario')
      return
    }

    const lotesDisponibles = await loadLotesDisponibles(insumo.id)

    if (lotesDisponibles.length === 0) {
      return
    }

    // Validar que el primer lote tenga detalle_id válido
    const primerLote = lotesDisponibles[0]
    if (!primerLote || !primerLote.detalle_id) {
      return
    }

    const nuevoInsumo: InsumoUsado = {
      id: insumo.id,
      nombre: insumo.nombre,
      codigo: insumo.codigo,
      categoria: insumo.categoria,
      unidad_nombre: insumo.unidad_nombre,
      cantidad_usada: insumo.cantidad_usada,
      stock_disponible: insumoDisponible.stock_disponible,
      registrosLotes: [{
        id: primerLote.detalle_id,
        cantidad: insumo.cantidad_usada
      }],
      lotesDisponibles: lotesDisponibles
    }


    setInsumosUsados([...insumosUsados, nuevoInsumo])
  }

  const handleAgregarRegistroLote = (insumoId: number) => {
    setInsumosUsados(prev =>
      prev.map(insumo => {
        if (insumo.id === insumoId) {
          // ✅ Busca el primer lote que NO esté ya usado
          const loteDisponible = insumo.lotesDisponibles.find(
            lote => !insumo.registrosLotes.some(r => r.id === lote.detalle_id)
          )
          // Si no hay lotes disponibles, no agregues nada
          if (!loteDisponible) {
            setError('No hay más lotes disponibles para este insumo')
            return insumo
          }
          return {
            ...insumo,
            registrosLotes: [
              ...insumo.registrosLotes,
              {
                id: loteDisponible.detalle_id,  // ✅ Lote no usado
                cantidad: 1
              }
            ]
          }
        }
        return insumo
      })
    )
  }

  const handleEliminarRegistroLote = (insumoId: number, registroId: number) => {
    setInsumosUsados(prev =>
      prev.map(insumo =>
        insumo.id === insumoId
          ? {
            ...insumo,
            registrosLotes: insumo.registrosLotes.filter(r => r.id !== registroId)
          }
          : insumo
      ).filter(insumo => insumo.registrosLotes.length > 0)
    )
  }

  const handleCambiarLote = (insumoId: number, registroIdAntiguo: number, nuevoLoteId: number) => {
    setInsumosUsados(prev =>
      prev.map(insumo => {
        if (insumo.id === insumoId) {
          const loteYaUsado = insumo.registrosLotes.some(
            r => r.id === nuevoLoteId && r.id !== registroIdAntiguo
          )

          if (loteYaUsado) {
            //setError('Este lote ya está siendo usado')
            return insumo
          }

          return {
            ...insumo,
            registrosLotes: insumo.registrosLotes.map(r =>
              r.id === registroIdAntiguo
                ? { ...r, id: nuevoLoteId }
                : r
            )
          }
        }
        return insumo
      })
    )
  }

  const handleCambiarCantidad = (insumoId: number, registroId: number, cantidad: number) => {

    setInsumosUsados(prev =>
      prev.map(insumo =>
        insumo.id === insumoId
          ? {
            ...insumo,
            registrosLotes: insumo.registrosLotes.map(r =>
              r.id === registroId ? { ...r, cantidad: Math.max(0, cantidad) } : r
            )
          }
          : insumo
      )
    )
  }

  const calcularTotalUsado = (insumoId: number): number => {
    const insumo = insumosUsados.find(i => i.id === insumoId)
    if (!insumo) return 0
    return insumo.registrosLotes.reduce((sum, r) => sum + Number(r.cantidad), 0)
  }

  const handleAgregarInsumoAdicional = async (insumo: InsumoSaldo) => {
    // Verificar si ya está agregado
    const yaExiste = insumosUsados.find(i => i.id === insumo.id)
    if (yaExiste) return

    const lotesDisponibles = await loadLotesDisponibles(insumo.id)
    if (lotesDisponibles.length === 0) {
      return
    }

    // Validar que el primer lote tenga detalle_id válido
    const primerLote = lotesDisponibles[0]
    if (!primerLote || !primerLote.detalle_id) {
      return
    }

    // Agregar el insumo adicional a la lista de usados con cantidad por defecto de 1
    const nuevoInsumo: InsumoUsado = {
      id: insumo.id,
      nombre: insumo.nombre,
      codigo: insumo.codigo,
      categoria: insumo.categoria,
      unidad_nombre: insumo.unidad_nombre,
      cantidad_usada: 0,
      stock_disponible: insumo.stock_disponible,
      registrosLotes: [
        {
          id: primerLote.detalle_id,
          cantidad: 1
        }
      ],
      lotesDisponibles: lotesDisponibles
    }

    setInsumosUsados([...insumosUsados, nuevoInsumo])
  }

  const handleGuardar = async () => {
    setLoading(true)
    setError(null) // Limpiar error antes de guardar

    const response = await execute(() => horarioService.cerrarHorarioConInsumos({
      laboratorio_id: laboratorioId,
      tipo_movimiento: 'salida',
      observaciones: `Consumo de inventario en horarioId: ${horarioId!}`,
      reserva_id: horarioId!,
      fecha_movimiento: fecha,
      detalles: insumosUsados.flatMap(c => c.registrosLotes.map(r => ({
        insumo_id: c.id,
        cantidad: r.cantidad,
        lote: null,
        fecha_vencimiento: null,
        entrada_detalle_id: r.id
      })))
    }))
    if (response.error) {
      setError(response.error)
    } else if (response.data) {
      onSuccess?.()
      onClose?.()
    }
    setLoading(false)
  }

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 1,
        '& .MuiBackdrop-root': {
          zIndex: (theme) => theme.zIndex.modal,
          pointerEvents: 'auto'
        }
      }}
      PaperProps={{
        sx: {
          height: '80vh',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: '80vh',
          overflow: 'auto',
          zIndex: (theme) => theme.zIndex.modal + 1
        }
      }}
      ModalProps={{
        keepMounted: false,
        disablePortal: false
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CheckCircle sx={{ color: 'success.main', fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Registrar Insumos Usados
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'grey.500' }}>
          <Close />
        </IconButton>
      </Box>

      {/* Alert de Error */}
      {error && (
        <Box sx={{ px: 3, pt: 2 }}>
          <Alert 
            severity="error" 
            onClose={() => setError(null)}
            sx={{
              borderRadius: 2,
              '& .MuiAlert-message': {
                fontWeight: 500
              }
            }}
          >
            {error}
          </Alert>
        </Box>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="insumos tabs"
          sx={{ px: 3 }}
        >
          <Tab
            label="INSUMOS REQUERIDOS"
            id="insumos-tab-0"
            aria-controls="insumos-tabpanel-0"
            sx={{ fontWeight: 600 }}
          />
          <Tab
            label="AGREGAR INSUMOS ADICIONALES"
            id="insumos-tab-1"
            aria-controls="insumos-tabpanel-1"
            sx={{ fontWeight: 600 }}
          />
        </Tabs>
      </Box>

      {/* Content - Layout de 2 columnas */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 3, position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, py: 1.5 }}>
          {/* Columna izquierda: Contenido de los tabs */}
          <Box>
            {/* Tab Panel: Insumos Requeridos */}
            <TabPanel value={tabValue} index={0}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'grey.50'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Inventory color="primary" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Insumos Requeridos
                  </Typography>
                  <Chip
                    label={insumosRequeridos.length}
                    size="small"
                    color="primary"
                    sx={{ ml: 'auto' }}
                  />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {insumosRequeridos.map((insumo) => {
                    const yaAgregado = insumosUsados.find(i => i.id === insumo.id)
                    return (
                      <Paper
                        key={insumo.id}
                        variant="outlined"
                        sx={{
                          p: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          bgcolor: yaAgregado ? 'success.lighter' : 'background.paper',
                          cursor: yaAgregado ? 'default' : 'pointer',
                          opacity: yaAgregado ? 0.6 : 1,
                          transition: 'all 0.2s',
                          '&:hover': yaAgregado ? {} : {
                            bgcolor: 'action.hover',
                            boxShadow: 1
                          }
                        }}
                        onClick={() => !yaAgregado && handleAgregarInsumo(insumo)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Inventory sx={{ color: 'text.secondary', fontSize: 20 }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {insumo.nombre}
                          </Typography>
                        </Box>
                        <Chip
                          label={yaAgregado ? 'Agregado' : `${insumo.cantidad_usada} ${insumo.unidad_nombre}`}
                          size="small"
                          variant={yaAgregado ? 'filled' : 'outlined'}
                          color={yaAgregado ? 'success' : 'primary'}
                        />
                      </Paper>
                    )
                  })}
                </Box>
              </Paper>
            </TabPanel>

            {/* Tab Panel: Agregar Insumos Adicionales */}
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Alerta informativa */}
                <Alert severity="info" icon={<Info />} sx={{ py: 1 }}>
                  <Typography variant="body2">
                    Agrega insumos adicionales que no estaban en los requeridos inicialmente. Selecciona el insumo, cantidad y lote.
                  </Typography>
                </Alert>

                {/* Lista de Insumos Disponibles con buscador integrado */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                    bgcolor: 'grey.50'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Inventory color="primary" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Insumos Disponibles ({insumosDisponibles.filter(insumo => {
                        const esRequerido = insumosRequeridos.some(req => req.id === insumo.id)
                        if (esRequerido) return false
                        if (busquedaInsumo) {
                          return insumo.nombre.toLowerCase().includes(busquedaInsumo.toLowerCase()) ||
                            insumo.codigo.toLowerCase().includes(busquedaInsumo.toLowerCase())
                        }
                        return true
                      }).length})
                    </Typography>
                  </Box>

                  {/* Buscador */}
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Escribe para buscar..."
                    value={busquedaInsumo}
                    onChange={(e) => setBusquedaInsumo(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search fontSize="small" />
                        </InputAdornment>
                      )
                    }}
                    sx={{ mb: 2 }}
                  />

                  {/* Lista de insumos */}
                  <Box
                    sx={{
                      maxHeight: 400,
                      overflow: 'auto',
                      '&::-webkit-scrollbar': {
                        width: '6px'
                      },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        borderRadius: '4px'
                      }
                    }}
                  >
                    <List sx={{ p: 0 }}>
                      {insumosDisponibles
                        .filter(insumo => {
                          // Excluir insumos que ya están en requeridos
                          const esRequerido = insumosRequeridos.some(req => req.id === insumo.id)
                          if (esRequerido) return false

                          // Filtrar por búsqueda
                          if (busquedaInsumo) {
                            return insumo.nombre.toLowerCase().includes(busquedaInsumo.toLowerCase()) ||
                              insumo.codigo.toLowerCase().includes(busquedaInsumo.toLowerCase())
                          }
                          return true
                        })
                        .map((insumo) => {
                          const yaAgregado = insumosUsados.find(i => i.id === insumo.id)
                          return (
                            <ListItem
                              key={insumo.id}
                              sx={{
                                mb: 0.75,
                                p: 1.5,
                                bgcolor: yaAgregado ? 'success.lighter' : 'background.paper',
                                borderRadius: 1,
                                border: 1,
                                borderColor: 'divider',
                                cursor: yaAgregado ? 'default' : 'pointer',
                                opacity: yaAgregado ? 0.6 : 1,
                                transition: 'all 0.2s',
                                '&:hover': yaAgregado ? {} : {
                                  boxShadow: 1,
                                  borderColor: 'primary.main',
                                  bgcolor: 'action.hover'
                                }
                              }}
                              onClick={() => !yaAgregado && insumo.stock_disponible > 0 && handleAgregarInsumoAdicional(insumo)}
                            >
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <Inventory sx={{ color: 'text.secondary', fontSize: 20 }} />
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      {insumo.nombre}
                                    </Typography>
                                    <Chip label={insumo.codigo} size="small" variant="outlined" />
                                    <Chip
                                      label={insumo.categoria}
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                    />
                                    <Chip
                                      label={`Stock: ${insumo.stock_disponible ? insumo.stock_disponible : 0} ${insumo.unidad_nombre}`}
                                      size="small"
                                      color={insumo.stock_disponible ? 'success' : 'error'}
                                      variant="outlined"
                                    />
                                    {yaAgregado && (
                                      <Chip
                                        label="Agregado"
                                        size="small"
                                        color="success"
                                        variant="filled"
                                      />
                                    )}
                                  </Box>
                                }
                                secondary={
                                  <Typography variant="caption" color="text.secondary">
                                    {insumo.description}
                                  </Typography>
                                }
                              />
                            </ListItem>
                          )
                        })}
                    </List>
                  </Box>
                </Paper>
              </Box>
            </TabPanel>
          </Box>

          {/* Columna derecha: Insumos Usados Realmente (siempre visible) */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'grey.50',
              position: 'sticky',
              top: 0,
              alignSelf: 'flex-start',
              maxHeight: 'calc(80vh - 200px)',
              overflow: 'visible',
              zIndex: 10,
              '& > *': {
                overflow: 'visible'
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <CheckCircle color="success" />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Insumos Usados Realmente
              </Typography>
            </Box>

            {insumosUsados.length === 0 ? (
              <>
                <Alert
                  severity="info"
                  icon={<Info />}
                  sx={{
                    bgcolor: 'info.lighter',
                    '& .MuiAlert-icon': {
                      color: 'info.main'
                    }
                  }}
                >
                  <Typography variant="body2">
                    Selecciona insumos de la lista izquierda para agregarlos aquí y modificar su
                    cantidad y lote.
                  </Typography>
                </Alert>

                <Box
                  sx={{
                    mt: 3,
                    p: 4,
                    border: 2,
                    borderStyle: 'dashed',
                    borderColor: 'divider',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 200
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No hay insumos agregados
                  </Typography>
                </Box>
              </>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {insumosUsados.map((insumoUsado, insumoIndex) => {
                  const totalUsado = calcularTotalUsado(insumoUsado.id)
                  return (
                    <Paper
                      key={insumoUsado.id}
                      variant="outlined"
                      sx={{
                        p: 2.5,
                        bgcolor: 'background.paper',
                        position: 'relative',
                        overflow: 'visible',
                        zIndex: insumosUsados.length - insumoIndex
                      }}
                    >
                      {/* Header del insumo */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <Inventory sx={{ color: 'primary.main', fontSize: 20 }} />
                        <Typography variant="body1" sx={{ fontWeight: 600, flex: 1 }}>
                          {insumoUsado.nombre}
                        </Typography>
                        <Chip
                          label={`Requerido: ${insumoUsado.cantidad_usada} ${insumoUsado.unidad_nombre}`}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                        <Chip
                          label={`Disponible: ${insumoUsado.stock_disponible} ${insumoUsado.unidad_nombre}`}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                        <Chip
                          label={`Total: ${totalUsado} ${insumoUsado.unidad_nombre}`}
                          size="small"
                          color={totalUsado === insumoUsado.cantidad_usada ? 'success' : 'warning'}
                        />
                      </Box>

                      {/* Registros de lotes */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, position: 'relative', overflow: 'visible' }}>
                        {insumoUsado.registrosLotes.map((registro) => {
                          return (
                            <Box
                              key={registro.id}
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr auto',
                                gap: 2,
                                alignItems: 'start',
                                position: 'relative',
                                overflow: 'visible'
                              }}
                            >
                              <Box sx={{ position: 'relative', overflow: 'visible' }}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ mb: 0.5, display: 'block' }}
                                >
                                  Lote
                                </Typography>
                                <FormControl fullWidth size="small">
                                  <Select
                                    value={registro.id ? String(registro.id) : ''}
                                    onChange={(e) => {
                                      const nuevoLoteId = Number(e.target.value)
                                      if (nuevoLoteId && nuevoLoteId > 0) {
                                        handleCambiarLote(
                                          insumoUsado.id,
                                          registro.id,
                                          nuevoLoteId
                                        )
                                      }
                                    }}
                                    displayEmpty
                                    error={!registro.id}
                                    MenuProps={{
                                      disablePortal: true,
                                      PaperProps: {
                                        sx: {
                                          maxHeight: 300,
                                          zIndex: 10000,
                                          boxShadow: '0px 4px 20px rgba(0,0,0,0.15)',
                                          mt: 0.5,
                                          position: 'absolute'
                                        }
                                      },
                                      anchorOrigin: {
                                        vertical: 'bottom',
                                        horizontal: 'left'
                                      },
                                      transformOrigin: {
                                        vertical: 'top',
                                        horizontal: 'left'
                                      },
                                      disableScrollLock: true,
                                      disableAutoFocusItem: true
                                    }}
                                  >
                                    {insumoUsado.lotesDisponibles.length === 0 ? (
                                      <MenuItem value="">
                                        <em>No hay lotes disponibles</em>
                                      </MenuItem>
                                    ) : (
                                      [
                                        <MenuItem key="placeholder" value="" disabled>
                                          <em>Selecciona un lote</em>
                                        </MenuItem>,
                                        ...insumoUsado.lotesDisponibles.map((lote) => {
                                          const loteId = String(lote.detalle_id)
                                          return (
                                            <MenuItem
                                              key={lote.detalle_id}
                                              value={loteId}
                                            >
                                              <Box
                                                sx={{
                                                  display: 'flex',
                                                  justifyContent: 'space-between',
                                                  width: '100%'
                                                }}
                                              >
                                                <span>{lote.lote || `Lote #${lote.detalle_id}`}</span>
                                                <Typography
                                                  variant="caption"
                                                  color="text.secondary"
                                                  sx={{ ml: 2 }}
                                                >
                                                  Saldo: {lote.saldo || 0}
                                                </Typography>
                                              </Box>
                                            </MenuItem>
                                          )
                                        })
                                      ]
                                    )}
                                  </Select>
                                </FormControl>
                              </Box>
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ mb: 0.5, display: 'block' }}
                                >
                                  Cantidad Usada
                                </Typography>
                                <TextField
                                  type="number"
                                  size="small"
                                  fullWidth
                                  value={registro.cantidad}
                                  onChange={(e) => {
                                    handleCambiarCantidad(
                                      insumoUsado.id,
                                      registro.id,
                                      Number(e.target.value) || 0
                                    )
                                  }
                                  }
                                  InputProps={{
                                    endAdornment: (
                                      <Typography variant="body2" color="text.secondary">
                                        {insumoUsado.unidad_nombre}
                                      </Typography>
                                    )
                                  }}
                                  inputProps={{ min: 0, step: 0.01 }}
                                />
                              </Box>

                              <IconButton
                                color="error"
                                onClick={() =>
                                  handleEliminarRegistroLote(insumoUsado.id, registro.id)
                                }
                                sx={{ mt: 2.5 }}
                              >
                                <Delete />
                              </IconButton>
                            </Box>
                          )
                        })}

                        {/* Botón para agregar más registros de lote */}
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Add />}
                          onClick={() => handleAgregarRegistroLote(insumoUsado.id)}
                          sx={{ alignSelf: 'flex-start', mt: 0.5 }}
                        >
                          Agregar lote
                        </Button>
                      </Box>
                    </Paper>
                  )
                })}
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Footer con botones */}
      <Box
        sx={{
          px: 3,
          py: 2,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {insumosUsados.length === 0
            ? 'No hay insumos agregados'
            : `${insumosUsados.length} insumo${insumosUsados.length > 1 ? 's' : ''} agregado${insumosUsados.length > 1 ? 's' : ''}`}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" onClick={onClose} size="small" sx={{ minWidth: 100 }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleGuardar}
            disabled={insumosUsados.length === 0}
            size="small"
            sx={{ minWidth: 160 }}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
          >
            {loading ? 'Guardando...' : 'Guardar Insumos Usados'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

