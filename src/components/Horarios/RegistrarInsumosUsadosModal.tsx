import React, { useState } from 'react'
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
  InputLabel
} from '@mui/material'
import { Close, CheckCircle, Inventory, Info, Add, Delete } from '@mui/icons-material'

interface InsumoRequeridoMock {
  id: number
  nombre: string
  cantidad: number
  unidad: string
}

interface LoteMock {
  id: number
  nombre: string
  saldo: number
}

interface RegistroLote {
  id: string
  loteId: number | null
  cantidad: number
}

interface InsumoUsado {
  insumo: InsumoRequeridoMock
  registrosLotes: RegistroLote[]
}

interface RegistrarInsumosUsadosModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
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
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

export const RegistrarInsumosUsadosModal: React.FC<RegistrarInsumosUsadosModalProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const [tabValue, setTabValue] = useState(0)
  const [insumosUsados, setInsumosUsados] = useState<InsumoUsado[]>([])

  // Datos mock de insumos requeridos
  const insumosRequeridos: InsumoRequeridoMock[] = [
    {
      id: 1,
      nombre: 'Insumo de prueba',
      cantidad: 10,
      unidad: 'unidades'
    }
  ]

  // Datos mock de lotes disponibles
  const lotesMock: LoteMock[] = [
    { id: 1, nombre: 'Lote A-001', saldo: 50 },
    { id: 2, nombre: 'Lote B-002', saldo: 30 },
    { id: 3, nombre: 'Lote C-003', saldo: 20 }
  ]

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleAgregarInsumo = (insumo: InsumoRequeridoMock) => {
    // Verificar si ya está agregado
    const yaExiste = insumosUsados.find(i => i.insumo.id === insumo.id)
    if (yaExiste) return

    const nuevoInsumo: InsumoUsado = {
      insumo,
      registrosLotes: [
        {
          id: `${insumo.id}-${Date.now()}`,
          loteId: null,
          cantidad: insumo.cantidad
        }
      ]
    }
    setInsumosUsados([...insumosUsados, nuevoInsumo])
  }

  const handleAgregarRegistroLote = (insumoId: number) => {
    setInsumosUsados(prev =>
      prev.map(insumo =>
        insumo.insumo.id === insumoId
          ? {
              ...insumo,
              registrosLotes: [
                ...insumo.registrosLotes,
                {
                  id: `${insumoId}-${Date.now()}`,
                  loteId: null,
                  cantidad: 0
                }
              ]
            }
          : insumo
      )
    )
  }

  const handleEliminarRegistroLote = (insumoId: number, registroId: string) => {
    setInsumosUsados(prev =>
      prev.map(insumo =>
        insumo.insumo.id === insumoId
          ? {
              ...insumo,
              registrosLotes: insumo.registrosLotes.filter(r => r.id !== registroId)
            }
          : insumo
      ).filter(insumo => insumo.registrosLotes.length > 0)
    )
  }

  const handleCambiarLote = (insumoId: number, registroId: string, loteId: number) => {
    setInsumosUsados(prev =>
      prev.map(insumo =>
        insumo.insumo.id === insumoId
          ? {
              ...insumo,
              registrosLotes: insumo.registrosLotes.map(r =>
                r.id === registroId ? { ...r, loteId } : r
              )
            }
          : insumo
      )
    )
  }

  const handleCambiarCantidad = (insumoId: number, registroId: string, cantidad: number) => {
    setInsumosUsados(prev =>
      prev.map(insumo =>
        insumo.insumo.id === insumoId
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
    const insumo = insumosUsados.find(i => i.insumo.id === insumoId)
    if (!insumo) return 0
    return insumo.registrosLotes.reduce((sum, r) => sum + r.cantidad, 0)
  }

  const handleGuardar = () => {
    // Maqueta: solo cerrar el modal
    if (onSuccess) {
      onSuccess()
    }
    onClose()
  }

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 1
      }}
      PaperProps={{
        sx: {
          height: '65vh',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: '65vh'
        }
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

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 3 }}>
        {/* Tab Panel: Insumos Requeridos */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            {/* Columna izquierda: Insumos Requeridos */}
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
                  const yaAgregado = insumosUsados.find(i => i.insumo.id === insumo.id)
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
                        label={yaAgregado ? 'Agregado' : `${insumo.cantidad} ${insumo.unidad}`}
                        size="small"
                        variant={yaAgregado ? 'filled' : 'outlined'}
                        color={yaAgregado ? 'success' : 'primary'}
                      />
                    </Paper>
                  )
                })}
              </Box>
            </Paper>

            {/* Columna derecha: Insumos Usados Realmente */}
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
                  {insumosUsados.map((insumoUsado) => {
                    const totalUsado = calcularTotalUsado(insumoUsado.insumo.id)
                    return (
                      <Paper
                        key={insumoUsado.insumo.id}
                        variant="outlined"
                        sx={{ p: 2.5, bgcolor: 'background.paper' }}
                      >
                        {/* Header del insumo */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                          <Inventory sx={{ color: 'primary.main', fontSize: 20 }} />
                          <Typography variant="body1" sx={{ fontWeight: 600, flex: 1 }}>
                            {insumoUsado.insumo.nombre}
                          </Typography>
                          <Chip
                            label={`Requerido: ${insumoUsado.insumo.cantidad} ${insumoUsado.insumo.unidad}`}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                          <Chip
                            label={`Total: ${totalUsado} ${insumoUsado.insumo.unidad}`}
                            size="small"
                            color={totalUsado === insumoUsado.insumo.cantidad ? 'success' : 'warning'}
                          />
                        </Box>

                        {/* Registros de lotes */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          {insumoUsado.registrosLotes.map((registro) => (
                            <Box
                              key={registro.id}
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr auto',
                                gap: 2,
                                alignItems: 'start'
                              }}
                            >
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
                                  onChange={(e) =>
                                    handleCambiarCantidad(
                                      insumoUsado.insumo.id,
                                      registro.id,
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  InputProps={{
                                    endAdornment: (
                                      <Typography variant="body2" color="text.secondary">
                                        {insumoUsado.insumo.unidad}
                                      </Typography>
                                    )
                                  }}
                                  inputProps={{ min: 0 }}
                                />
                              </Box>

                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ mb: 0.5, display: 'block' }}
                                >
                                  Lote
                                </Typography>
                                <FormControl fullWidth size="small">
                                  <Select
                                    value={registro.loteId || ''}
                                    onChange={(e) =>
                                      handleCambiarLote(
                                        insumoUsado.insumo.id,
                                        registro.id,
                                        Number(e.target.value)
                                      )
                                    }
                                    displayEmpty
                                  >
                                    <MenuItem value="" disabled>
                                      Selecciona un lote
                                    </MenuItem>
                                    {lotesMock.map((lote) => (
                                      <MenuItem key={lote.id} value={lote.id}>
                                        <Box
                                          sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            width: '100%'
                                          }}
                                        >
                                          <span>{lote.nombre}</span>
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ ml: 2 }}
                                          >
                                            Saldo: {lote.saldo}
                                          </Typography>
                                        </Box>
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Box>

                              <IconButton
                                color="error"
                                onClick={() =>
                                  handleEliminarRegistroLote(insumoUsado.insumo.id, registro.id)
                                }
                                sx={{ mt: 2.5 }}
                              >
                                <Delete />
                              </IconButton>
                            </Box>
                          ))}

                          {/* Botón para agregar más registros de lote */}
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Add />}
                            onClick={() => handleAgregarRegistroLote(insumoUsado.insumo.id)}
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
        </TabPanel>

        {/* Tab Panel: Agregar Insumos Adicionales */}
        <TabPanel value={tabValue} index={1}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 300,
              p: 4
            }}
          >
            <Alert severity="info" sx={{ maxWidth: 600 }}>
              <Typography variant="body2">
                En esta sección podrás agregar insumos adicionales que no estaban contemplados en
                la planificación original del horario.
              </Typography>
            </Alert>
            <Box
              sx={{
                mt: 4,
                p: 6,
                border: 2,
                borderStyle: 'dashed',
                borderColor: 'divider',
                borderRadius: 2,
                width: '100%',
                maxWidth: 800
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                align="center"
                sx={{ fontStyle: 'italic' }}
              >
                Funcionalidad disponible próximamente
              </Typography>
            </Box>
          </Box>
        </TabPanel>
      </Box>

      {/* Footer con botones */}
      <Box
        sx={{
          p: 3,
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
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={onClose} sx={{ minWidth: 120 }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleGuardar}
            disabled={insumosUsados.length === 0}
            sx={{ minWidth: 180 }}
            startIcon={<CheckCircle />}
          >
            Guardar Insumos Usados
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

