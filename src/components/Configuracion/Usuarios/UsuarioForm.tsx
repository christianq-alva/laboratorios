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

interface Usuario {
  id?: number
  nombre: string
  usuario: string
  rol: 'Administrador' | 'Jefe de Laboratorio' | ''
  laboratorios: number[]
  password?: string
}

interface UsuarioFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  usuario: Usuario | null
}

// Laboratorios mock para maquetación
const LABORATORIOS_MOCK = [
  { id: 1, nombre: 'Lab. de Química Analítica', codigo: 'LAB-001' },
  { id: 2, nombre: 'Lab. de Física', codigo: 'LAB-002' },
  { id: 3, nombre: 'Lab. de Biología', codigo: 'LAB-003' },
  { id: 4, nombre: 'Lab. de Microbiología', codigo: 'LAB-004' },
  { id: 5, nombre: 'Lab. de Computación', codigo: 'LAB-005' },
]

const ROLES = ['Administrador', 'Jefe de Laboratorio']

export const UsuarioForm: React.FC<UsuarioFormProps> = ({
  open,
  onClose,
  onSuccess,
  usuario,
}) => {
  const [formData, setFormData] = useState<Usuario>({
    nombre: '',
    usuario: '',
    rol: '',
    laboratorios: [],
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (usuario) {
      setFormData({
        ...usuario,
        password: '', // No mostrar contraseña al editar
      })
    } else {
      setFormData({
        nombre: '',
        usuario: '',
        rol: '',
        laboratorios: [],
        password: '',
      })
    }
    setErrors({})
  }, [usuario, open])

  const handleChange = (field: keyof Usuario, value: any) => {
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
      laboratorios: typeof value === 'string' ? [] : value,
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre completo es requerido'
    }
    if (!formData.usuario.trim()) {
      newErrors.usuario = 'El nombre de usuario es requerido'
    }
    if (!formData.rol) {
      newErrors.rol = 'Debe seleccionar un rol'
    }
    if (!usuario && !formData.password) {
      newErrors.password = 'La contraseña es requerida'
    }
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    }
    if (formData.rol === 'Jefe de Laboratorio' && formData.laboratorios.length === 0) {
      newErrors.laboratorios = 'Debe asignar al menos un laboratorio'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    // TODO: Implementar llamada a API
    // if (usuario) {
    //   await usuarioService.update(usuario.id, formData)
    // } else {
    //   await usuarioService.create(formData)
    // }

    console.log('Guardar usuario:', formData)
    onSuccess()
    onClose()
  }

  const handleClose = () => {
    setFormData({
      nombre: '',
      usuario: '',
      rol: '',
      laboratorios: [],
      password: '',
    })
    setErrors({})
    onClose()
  }

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
        <Box display="flex" flexDirection="column" gap={2.5}>
          {/* Nombre Completo */}
          <TextField
            fullWidth
            label="Nombre Completo"
            value={formData.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            error={!!errors.nombre}
            helperText={errors.nombre}
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
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            error={!!errors.password}
            helperText={errors.password || (usuario ? 'Dejar en blanco para mantener la actual' : 'Mínimo 6 caracteres')}
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
          <FormControl fullWidth error={!!errors.rol} required>
            <InputLabel>Rol</InputLabel>
            <Select
              value={formData.rol}
              label="Rol"
              onChange={(e) => handleChange('rol', e.target.value)}
            >
              <MenuItem value="">
                <em>Seleccionar rol</em>
              </MenuItem>
              {ROLES.map((rol) => (
                <MenuItem key={rol} value={rol}>
                  {rol}
                </MenuItem>
              ))}
            </Select>
            {errors.rol && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                {errors.rol}
              </Typography>
            )}
          </FormControl>

          {/* Laboratorios Asignados - Solo para Jefe de Laboratorio */}
          {formData.rol === 'Jefe de Laboratorio' && (
            <FormControl fullWidth error={!!errors.laboratorios}>
              <InputLabel>Laboratorios Asignados</InputLabel>
              <Select
                multiple
                value={formData.laboratorios}
                onChange={handleLaboratoriosChange}
                input={<OutlinedInput label="Laboratorios Asignados" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const lab = LABORATORIOS_MOCK.find(l => l.id === value)
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
                {LABORATORIOS_MOCK.map((lab) => (
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
              {errors.laboratorios && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                  {errors.laboratorios}
                </Typography>
              )}
            </FormControl>
          )}

          {/* Información adicional */}
          <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
            {formData.rol === 'Administrador' && 'Los administradores tienen acceso completo al sistema.'}
            {formData.rol === 'Jefe de Laboratorio' && 'Los jefes de laboratorio solo pueden gestionar los laboratorios asignados.'}
            {!formData.rol && 'Selecciona un rol para ver más información.'}
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        px: 3, 
        py: 2, 
        borderTop: '1px solid',
        borderColor: 'divider',
      }}>
        <Button onClick={handleClose} variant="outlined">
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
        >
          {usuario ? 'Actualizar' : 'Crear'} Usuario
        </Button>
      </DialogActions>
    </Dialog>
  )
}

