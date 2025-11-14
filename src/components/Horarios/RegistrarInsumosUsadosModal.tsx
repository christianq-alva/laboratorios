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
  Alert
} from '@mui/material'
import { Close, CheckCircle, Inventory, Info } from '@mui/icons-material'

interface InsumoRequeridoMock {
  id: number
  nombre: string
  cantidad: number
  unidad: string
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

  // Datos mock de insumos requeridos
  const insumosRequeridos: InsumoRequeridoMock[] = [
    {
      id: 1,
      nombre: 'Insumo de prueba',
      cantidad: 10,
      unidad: 'unidades'
    }
  ]

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
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
                {insumosRequeridos.map((insumo) => (
                  <Paper
                    key={insumo.id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      bgcolor: 'background.paper'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Inventory sx={{ color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {insumo.nombre}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${insumo.cantidad} ${insumo.unidad}`}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  </Paper>
                ))}
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

              {/* Área vacía para insumos agregados (maqueta) */}
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
          No hay insumos agregados
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={onClose} sx={{ minWidth: 120 }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleGuardar}
            disabled
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

