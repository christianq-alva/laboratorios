import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import { Close } from '@mui/icons-material'
import { type Grupo, type CreateGrupoData } from '../../../services/grupoService'
import { type Escuela } from '../../../services/escuelaService'
import { type Ciclo } from '../../../services/cicloService'

interface GrupoFormProps {
  open: boolean
  onClose: () => void
  onSuccess: (message?: string) => void
  grupo?: Grupo | null
}

export const GrupoForm: React.FC<GrupoFormProps> = ({ open, onClose, onSuccess, grupo }) => {
  const [nombre, setNombre] = useState('')
  const [escuelaId, setEscuelaId] = useState<number>(0)
  const [ciclosSeleccionados, setCiclosSeleccionados] = useState<number[]>([])

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // MAQUETA: Datos mock para escuelas y ciclos
  const [escuelas] = useState<Escuela[]>([
    { id: 1, nombre: 'Medicina Humana' },
    { id: 2, nombre: 'Ingeniería de Sistemas' },
    { id: 3, nombre: 'Enfermería' },
    { id: 4, nombre: 'Farmacia y Bioquímica' }
  ])
  
  const [ciclos] = useState<Ciclo[]>([
    { id: 1, nombre: 'Ciclo I' },
    { id: 2, nombre: 'Ciclo II' },
    { id: 3, nombre: 'Ciclo III' },
    { id: 4, nombre: 'Ciclo IV' },
    { id: 5, nombre: 'Ciclo V' }
  ])

  const isEditing = Boolean(grupo)

  // MAQUETA: Simular carga de datos
  useEffect(() => {
    if (open) {
      setLoadingData(true)
      // Simular delay de carga
      setTimeout(() => {
        setLoadingData(false)
      }, 300)
    }
  }, [open])

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (open) {
      if (grupo) {
        // Modo edición
        setNombre(grupo.nombre)
        setEscuelaId(grupo.escuela_id)
        setCiclosSeleccionados([grupo.ciclo_id])
      } else {
        // Modo creación
        setNombre('')
        setEscuelaId(0)
        setCiclosSeleccionados([])
      }
      setError(null)
    }
  }, [grupo, open])

  const handleNombreChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNombre(event.target.value)
  }

  const handleEscuelaChange = (event: any) => {
    setEscuelaId(parseInt(event.target.value) || 0)
  }

  const handleCiclosChange = (event: any) => {
    const value = event.target.value
    setCiclosSeleccionados(typeof value === 'string' ? [] : value.map((v: any) => parseInt(v)))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    // Validaciones
    if (!nombre.trim()) {
      setError('El nombre del grupo es requerido')
      setLoading(false)
      return
    }
    if (!escuelaId || escuelaId === 0) {
      setError('Debe seleccionar una escuela')
      setLoading(false)
      return
    }
    if (ciclosSeleccionados.length === 0) {
      setError('Debe seleccionar al menos un ciclo')
      setLoading(false)
      return
    }

    // MAQUETA: Simular guardado sin llamar al backend
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const escuelaNombre = escuelas.find(e => e.id === escuelaId)?.nombre || 'N/A'
    const ciclosNombres = ciclosSeleccionados
      .map(id => ciclos.find(c => c.id === id)?.nombre)
      .filter(Boolean)
      .join(', ')
    
    onSuccess(isEditing 
      ? `Grupo "${nombre}" actualizado exitosamente (maqueta)` 
      : `Grupo "${nombre}" creado exitosamente (maqueta) - Escuela: ${escuelaNombre}, Ciclos: ${ciclosNombres}`
    )
    onClose()
    setLoading(false)
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {isEditing ? 'Editar Grupo' : 'Nuevo Grupo'}
          </Typography>
          <IconButton onClick={handleClose} disabled={loading} sx={{ color: 'grey.500' }}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Nombre del Grupo"
            value={nombre}
            onChange={handleNombreChange}
            required
            disabled={loading || loadingData}
            autoFocus
            placeholder="Ej: G1, G2, Grupo A"
            helperText="Ingrese el nombre del grupo"
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth required sx={{ mb: 2 }} disabled={loading || loadingData}>
            <InputLabel>Escuela</InputLabel>
            <Select
              value={escuelaId || ''}
              onChange={handleEscuelaChange}
              label="Escuela"
            >
              <MenuItem value={0}>
                <em>Seleccione una escuela</em>
              </MenuItem>
              {escuelas.map((escuela) => (
                <MenuItem key={escuela.id} value={escuela.id}>
                  {escuela.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth required disabled={loading || loadingData}>
            <InputLabel>Ciclos</InputLabel>
            <Select
              multiple
              value={ciclosSeleccionados}
              onChange={handleCiclosChange}
              label="Ciclos"
              renderValue={(selected) => {
                if (selected.length === 0) return 'Seleccione uno o más ciclos'
                return selected
                  .map((id: number) => ciclos.find(c => c.id === id)?.nombre)
                  .filter(Boolean)
                  .join(', ')
              }}
            >
              {ciclos.map((ciclo) => (
                <MenuItem key={ciclo.id} value={ciclo.id}>
                  {ciclo.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || loadingData}
            variant="contained"
            sx={{ borderRadius: 2, px: 3 }}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              isEditing ? 'Actualizar' : 'Crear Grupo'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

