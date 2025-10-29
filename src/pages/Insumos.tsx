import React, { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Snackbar,
  Alert
} from '@mui/material'
import { History,  CloudUpload, SwapHoriz } from '@mui/icons-material'
import { InventarioTable } from '../components/Insumos/InventarioTable'
import { ActividadInsumos } from '../components/Insumos/ActividadInsumos'
import { CargaMasivaModal } from '../components/Insumos/CargaMasivaModal'
import { NuevoMovimientoModal } from '../components/Insumos/NuevoMovimientoModal'

export const Insumos: React.FC = () => {
  // Estados para formulario y eliminación
  const [refresh, setRefresh] = useState(false)
  const [actividadOpen, setActividadOpen] = useState(false)
  const [cargaMasivaOpen, setCargaMasivaOpen] = useState(false)
  const [nuevoMovimientoOpen, setNuevoMovimientoOpen] = useState(false)

  // Estados para notificaciones
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  })

  // Función para cerrar snackbar
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  // Funciones para el manejo de Movimientos. Open, Close
  const handleActividadOpen = () => {
    setActividadOpen(true)
  }
  const handleActividadClose = () => {
    setActividadOpen(false)
  }

  // Funciones para el manejo de Carga masiva. Open, Close, Success
  const handleCargaMasivaOpen = () => {
    setCargaMasivaOpen(true)
  }
  const handleCargaMasivaClose = () => {
    setCargaMasivaOpen(false)
  }
  const handleCargaMasivaSuccess = () => {
    setRefresh(prev => !prev)
    setSnackbar({
      open: true,
      message: 'Carga masiva procesada correctamente',
      severity: 'success'
    })
  }

  // Funciones para el manejo de Nuevo Movimiento. Open, Close, Success
  const handleNuevoMovimientoOpen = () => {
    setNuevoMovimientoOpen(true)
  }

  const handleNuevoMovimientoClose = () => {
    setNuevoMovimientoOpen(false)
  }

  const handleNuevoMovimientoSuccess = () => {
    setRefresh(prev => !prev)
    setSnackbar({
      open: true,
      message: 'Movimiento registrado correctamente',
      severity: 'success'
    })
  }

  return (
    <Box>
      {/* Encabezado */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
            Insumos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Controla el inventario de materiales por laboratorio
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<SwapHoriz />}
            onClick={handleNuevoMovimientoOpen}
            sx={{ borderRadius: 2, px: 3 }}
            color="primary"
          >
            Nuevo Movimiento
          </Button>

          <Button
            variant="outlined"
            startIcon={<CloudUpload />}
            onClick={handleCargaMasivaOpen}
            sx={{ borderRadius: 2, px: 3 }}
            color="info"
          >
            Carga Masiva
          </Button>

          <Button
            variant="outlined"
            startIcon={<History />}
            onClick={handleActividadOpen}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Movimientos
          </Button>
        </Box>
      </Box>

      {/* Tabla de insumos */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <InventarioTable
            refresh={refresh}
          />
        </CardContent>
      </Card>

      {/* Actividad de insumos */}
      <ActividadInsumos
        open={actividadOpen}
        onClose={handleActividadClose}
      />
      {/* Modal de carga masiva */}
      <CargaMasivaModal
        open={cargaMasivaOpen}
        onClose={handleCargaMasivaClose}
        onSuccess={handleCargaMasivaSuccess}
      />

      {/* Modal de nuevo movimiento */}
      <NuevoMovimientoModal
        open={nuevoMovimientoOpen}
        onClose={handleNuevoMovimientoClose}
        onSuccess={handleNuevoMovimientoSuccess}
      />

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