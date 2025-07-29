import React, { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Snackbar,
  Alert,
} from '@mui/material'
import { Add, School } from '@mui/icons-material'
import { LaboratoriosTable } from '../components/Laboratorios/LaboratoriosTable'
import { LaboratorioForm } from '../components/Laboratorios/LaboratorioForm'
import { DeleteLaboratorioDialog } from '../components/Laboratorios/DeleteLaboratorioDialog'
import type { Laboratorio } from '../services/laboratorioService'

export const Laboratorios: React.FC = () => {
  // Estados para los diálogos
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedLaboratorio, setSelectedLaboratorio] = useState<Laboratorio | null>(null)
  
  // Estados para la tabla
  const [refresh, setRefresh] = useState(false)
  
  // Estados para notificaciones
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  })

  // Funciones para manejar el formulario
  const handleNewLaboratorio = () => {
    setSelectedLaboratorio(null)
    setFormOpen(true)
  }

  const handleEditLaboratorio = (laboratorio: Laboratorio) => {
    setSelectedLaboratorio(laboratorio)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setSelectedLaboratorio(null)
  }

  const handleFormSuccess = () => {
    setRefresh(true)
    setSnackbar({
      open: true,
      message: selectedLaboratorio 
        ? 'Laboratorio actualizado correctamente' 
        : 'Laboratorio creado correctamente',
      severity: 'success'
    })
  }

  // Funciones para manejar eliminación
  const handleDeleteLaboratorio = (laboratorio: Laboratorio) => {
    setSelectedLaboratorio(laboratorio)
    setDeleteOpen(true)
  }

  const handleDeleteClose = () => {
    setDeleteOpen(false)
    setSelectedLaboratorio(null)
  }

  const handleDeleteSuccess = () => {
    setRefresh(true)
    setSnackbar({
      open: true,
      message: 'Laboratorio eliminado correctamente',
      severity: 'success'
    })
  }

  // Función para manejar el refresh completado
  const handleRefreshComplete = () => {
    setRefresh(false)
  }

  // Función para cerrar notificaciones
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Laboratorios
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona los laboratorios de la universidad
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleNewLaboratorio}
          sx={{ borderRadius: 2, px: 3 }}
        >
          Nuevo Laboratorio
        </Button>
      </Box>

      {/* Contenido principal */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <LaboratoriosTable
            onEdit={handleEditLaboratorio}
            onDelete={handleDeleteLaboratorio}
            refresh={refresh}
            onRefreshComplete={handleRefreshComplete}
          />
        </CardContent>
      </Card>

      {/* Formulario de crear/editar */}
      <LaboratorioForm
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        laboratorio={selectedLaboratorio}
      />

      {/* Diálogo de eliminación */}
      <DeleteLaboratorioDialog
        open={deleteOpen}
        onClose={handleDeleteClose}
        onSuccess={handleDeleteSuccess}
        laboratorio={selectedLaboratorio}
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
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
} 