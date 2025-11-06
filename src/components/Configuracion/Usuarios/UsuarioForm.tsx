import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  IconButton,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Alert,
  InputAdornment,
  CircularProgress,
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material'
import {
  Close,
  Visibility,
  VisibilityOff,
  Person,
  Lock,
  School,
} from '@mui/icons-material'
import { usuarioService, type Usuario } from '../../../services/usuarioService'
import { laboratorioService, type Laboratorio } from '../../../services/laboratorioService'
import { useApi } from '../../../hooks/useApi'

interface UsuarioFormProps {
  open: boolean
  onClose: () => void
  onSuccess: (message?: string) => void
  usuario: Usuario | null
}

interface Rol {
  id: number
  nombre: string
}

const ROLES: Rol[] = [
  { id: 1, nombre: 'Administrador' },
  { id: 2, nombre: 'Jefe de Laboratorio' },
]

export const UsuarioForm: React.FC<UsuarioFormProps> = ({
  open,
  onClose,
  onSuccess,
  usuario,
}) => {
  const { execute } = useApi()
  const [formData, setFormData] = useState({
    nombre_completo: '',
    usuario: '',
    rol_id: 0,
    laboratorio_ids: [] as number[],
    contrasena: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [loadingLaboratorios, setLoadingLaboratorios] = useState(false)

  // Cargar laboratorios al abrir el formulario
  useEffect(() => {
    if (open) {
      loadLaboratorios()
    }
  }, [open])

  const loadLaboratorios = async () => {
    setLoadingLaboratorios(true)
    try {
      const response = await laboratorioService.getAll()
      if (response.data) {
        setLaboratorios(response.data)
      }
    } catch (error) {
      console.error('Error al cargar laboratorios:', error)
    } finally {
      setLoadingLaboratorios(false)
    }
  }

  useEffect(() => {
    if (open) {
      if (usuario) {
        setFormData({
          nombre_completo: usuario.nombre_completo || '',
          usuario: usuario.usuario || '',
          rol_id: usuario.rol_id || 0,
          laboratorio_ids: usuario.laboratorio_ids || [],
          contrasena: '', // No mostrar contraseña al editar
        })
      } else {
        setFormData({
          nombre_completo: '',
          usuario: '',
          rol_id: 0,
          laboratorio_ids: [],
          contrasena: '',
        })
      }
      setErrors({})
    }
  }, [usuario, open])

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleLaboratoriosChange = (event: SelectChangeEvent<number[]>) => {
    const value = event.target.value
    setFormData(prev => ({
      ...prev,
      laboratorio_ids: typeof value === 'string' ? [] : value,
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre_completo.trim()) {
      newErrors.nombre_completo = 'El nombre completo es requerido'
    }
    if (!formData.usuario.trim()) {
      newErrors.usuario = 'El nombre de usuario es requerido'
    }
    if (!formData.rol_id || formData.rol_id === 0) {
      newErrors.rol_id = 'Debe seleccionar un rol'
    }
    if (!usuario && !formData.contrasena) {
      newErrors.contrasena = 'La contraseña es requerida'
    }
    if (formData.contrasena && formData.contrasena.length < 6) {
      newErrors.contrasena = 'La contraseña debe tener al menos 6 caracteres'
    }
    const selectedRol = ROLES.find(r => r.id === formData.rol_id)
    if (selectedRol?.nombre === 'Jefe de Laboratorio' && formData.laboratorio_ids.length === 0) {
      newErrors.laboratorio_ids = 'Debe asignar al menos un laboratorio'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    setErrors({})

    const data: any = {
      nombre_completo: formData.nombre_completo.trim(),
      usuario: formData.usuario.trim(),
      rol_id: formData.rol_id,
      laboratorio_ids: formData.laboratorio_ids,
    }

    // Solo incluir contraseña si se está creando o si se proporcionó una nueva
    if (!usuario || formData.contrasena) {
      data.contrasena = formData.contrasena
    }

    let result
    if (usuario) {
      // Editar
      result = await execute(() => usuarioService.update(usuario.id, data))
    } else {
      // Crear
      result = await execute(() => usuarioService.create(data))
    }

    if (result.error) {
      setErrors({ submit: result.error })
      if (result.validationErrors) {
        // Mapear errores de validación a campos específicos
        Object.keys(result.validationErrors).forEach(field => {
          setErrors(prev => ({ ...prev, [field]: result.validationErrors![field][0] }))
        })
      }
    } else {
      onSuccess()
      onClose()
    }

    setLoading(false)
  }

  const handleClose = () => {
    setFormData({
      nombre_completo: '',
      usuario: '',
      rol_id: 0,
      laboratorio_ids: [],
      contrasena: '',
    })
    setErrors({})
    onClose()
  }

  const selectedRol = ROLES.find(r => r.id === formData.rol_id)

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
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid',
        borderColor: 'divider',
        pb: 2,
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Person color="primary" />
          <Typography variant="h6" component="span">
            {usuario ? 'Editar Usuario' : 'Nuevo Usuario'}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {errors.submit && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.submit}
          </Alert>
        )}
        <Box display="flex" flexDirection="column" gap={2.5}>
          {/* Nombre Completo */}
          <TextField
            fullWidth
            label="Nombre Completo"
            value={formData.nombre_completo}
            onChange={(e) => handleChange('nombre_completo', e.target.value)}
            error={!!errors.nombre_completo}
            helperText={errors.nombre_completo}
            placeholder="Ej: Juan Pérez García"
            required
          />

          {/* Nombre de Usuario */}
          <TextField
            fullWidth
            label="Nombre de Usuario"
            value={formData.usuario}
            onChange={(e) => handleChange('usuario', e.target.value)}
            error={!!errors.usuario}
            helperText={errors.usuario || 'Será usado para iniciar sesión'}
            placeholder="Ej: jperez"
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          {/* Contraseña */}
          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            label={usuario ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
            value={formData.contrasena}
            onChange={(e) => handleChange('contrasena', e.target.value)}
            error={!!errors.contrasena}
            helperText={errors.contrasena || (usuario ? 'Dejar en blanco para mantener la actual' : 'Mínimo 6 caracteres')}
            required={!usuario}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Rol */}
          <FormControl fullWidth error={!!errors.rol_id} required>
            <InputLabel>Rol</InputLabel>
            <Select
              value={formData.rol_id}
              label="Rol"
              onChange={(e) => handleChange('rol_id', Number(e.target.value))}
            >
              <MenuItem value={0}>
                <em>Seleccionar rol</em>
              </MenuItem>
              {ROLES.map((rol) => (
                <MenuItem key={rol.id} value={rol.id}>
                  {rol.nombre}
                </MenuItem>
              ))}
            </Select>
            {errors.rol_id && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                {errors.rol_id}
              </Typography>
            )}
          </FormControl>

          {/* Laboratorios Asignados - Solo para Jefe de Laboratorio */}
          {selectedRol?.nombre === 'Jefe de Laboratorio' && (
            <FormControl fullWidth error={!!errors.laboratorio_ids}>
              <InputLabel>Laboratorios Asignados</InputLabel>
              {loadingLaboratorios ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <Select
                  multiple
                  value={formData.laboratorio_ids}
                  onChange={handleLaboratoriosChange}
                  input={<OutlinedInput label="Laboratorios Asignados" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const lab = laboratorios.find(l => l.id === value)
                        return (
                          <Chip
                            key={value}
                            label={lab?.codigo || value}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )
                      })}
                    </Box>
                  )}
                  startAdornment={
                    <InputAdornment position="start">
                      <School fontSize="small" />
                    </InputAdornment>
                  }
                >
                  {laboratorios.map((lab) => (
                    <MenuItem key={lab.id} value={lab.id}>
                      <Box>
                        <Typography variant="body2">
                          {lab.nombre}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {lab.codigo}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              )}
              {errors.laboratorio_ids && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                  {errors.laboratorio_ids}
                </Typography>
              )}
            </FormControl>
          )}

          {/* Información adicional */}
          <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
            {selectedRol?.nombre === 'Administrador' && 'Los administradores tienen acceso completo al sistema.'}
            {selectedRol?.nombre === 'Jefe de Laboratorio' && 'Los jefes de laboratorio solo pueden gestionar los laboratorios asignados.'}
            {!selectedRol && 'Selecciona un rol para ver más información.'}
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{
        px: 3,
        py: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}>
        <Button onClick={handleClose} variant="outlined" disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Guardando...' : usuario ? 'Actualizar' : 'Crear'} Usuario
        </Button>
      </DialogActions>
    </Dialog>
  )
}

