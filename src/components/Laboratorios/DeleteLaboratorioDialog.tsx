import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material'
import { Warning } from '@mui/icons-material'
import { laboratorioService } from '../../services/laboratorioService'
import type { Laboratorio } from '../../services/laboratorioService'

interface DeleteLaboratorioDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  laboratorio: Laboratorio | null
}

export const DeleteLaboratorioDialog: React.FC<DeleteLaboratorioDialogProps> = ({
  open,
  onClose,
  onSuccess,
  laboratorio,
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!laboratorio) return

    setLoading(true)
    setError(null)

    try {
      const result = await laboratorioService.delete(laboratorio.id)

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.message || 'Error al eliminar el laboratorio')
      }
    } catch (err: any) {
      setError('Error de conexión al servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setError(null)
      onClose()
    }
  }

  if (!laboratorio) return null

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Warning color="warning" />
          Confirmar Eliminación
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="body1" sx={{ mb: 2 }}>
          ¿Estás seguro de que deseas eliminar el siguiente laboratorio?
        </Typography>

        <Box 
          sx={{ 
            p: 2, 
            bgcolor: 'grey.50', 
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'grey.200'
          }}
        >
          <Typography variant="h6" gutterBottom>
            {laboratorio.nombre}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Ubicación:</strong> {laboratorio.ubicacion}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Capacidad:</strong> {laboratorio.capacidad} estudiantes
          </Typography>
        </Box>

        <Typography variant="body2" color="error.main" sx={{ mt: 2 }}>
          <strong>¡Advertencia!</strong> Esta acción no se puede deshacer. Se eliminará permanentemente el laboratorio y toda su información relacionada.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          color="inherit"
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleDelete}
          disabled={loading}
          variant="contained"
          color="error"
          sx={{ minWidth: 120 }}
        >
          {loading ? (
            <CircularProgress size={20} />
          ) : (
            'Eliminar'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
} 