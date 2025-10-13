import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Alert,
  Snackbar,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material'
import { Add, LibraryBooks, Edit } from '@mui/icons-material'
import { InsumoForm } from '../components/Insumos/InsumoForm'
import { insumoService, type Insumo } from '../services/insumoService'

export const CatalogoInsumos: React.FC = () => {
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  useEffect(() => {
    loadInsumos()
  }, [])

  const loadInsumos = async () => {
    try {
      setLoading(true)
      const response = await insumoService.getAll()
      setInsumos(response.data || [])
    } catch (error) {
      console.error('Error al cargar insumos:', error)
      setSnackbar({
        open: true,
        message: 'Error al cargar el catálogo de insumos',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenForm = () => {
    setEditingInsumo(null)
    setFormOpen(true)
  }

  const handleEditInsumo = (insumo: Insumo) => {
    setEditingInsumo(insumo)
    setFormOpen(true)
  }

  const handleCloseForm = () => {
    setFormOpen(false)
    setEditingInsumo(null)
  }

  const handleFormSuccess = () => {
    setSnackbar({
      open: true,
      message: editingInsumo ? 'Insumo actualizado exitosamente' : 'Insumo creado exitosamente',
      severity: 'success'
    })
    loadInsumos()
    handleCloseForm()
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const getCategoriaColor = (categoria?: string) => {
    switch (categoria) {
      case 'Reactivos': return '#ff9800'
      case 'Materiales': return '#2196f3'
      case 'Material_Biologico': return '#4caf50'
      default: return '#9e9e9e'
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LibraryBooks sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" fontWeight={600}>
                Catálogo de Insumos
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gestiona el catálogo maestro de insumos del sistema
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenForm}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Nuevo Insumo
          </Button>
        </Box>
      </Box>

      {/* Tabla */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>Código</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Categoría</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Unidad</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Presentación</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Descripción</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {insumos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No hay insumos registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                insumos.map((insumo) => (
                  <TableRow key={insumo.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                        {insumo.codigo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {insumo.nombre}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={insumo.categoria?.replace('_', ' ')}
                        size="small"
                        sx={{
                          backgroundColor: getCategoriaColor(insumo.categoria),
                          color: 'white',
                          fontWeight: 500
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{insumo.unidad_medida}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {insumo.presentacion || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {insumo.descripcion || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar insumo">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditInsumo(insumo)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Form Modal */}
      <InsumoForm
        open={formOpen}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
        insumo={editingInsumo}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

