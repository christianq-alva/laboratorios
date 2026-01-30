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
  CheckCircle,
} from '@mui/icons-material'
import { usuarioService, type Usuario } from '../../../services/usuarioService'
import { laboratorioService, type Laboratorio } from '../../../services/laboratorioService'
import { useApi } from '../../../hooks/useApi'
import { rolService, type Rol } from '../../../services/rolService'

interface UsuarioFormProps {
  open: boolean
  onClose: () => void
  onSuccess: (message?: string) => void
  usuario: Usuario | null
}

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
  const [roles, setRoles] = useState<Rol[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)
  // Cargar laboratorios al abrir el formulario
  useEffect(() => {
    if (open) {
      loadLaboratorios()
      loadRoles()
    }
  }, [open])

  const loadLaboratorios = async () => {
    setLoadingLaboratorios(true)
    const response = await execute(() => laboratorioService.getAll())
    if (response.error) {
      console.error('Error al cargar laboratorios:', response.error)
    } else if (response.data) {
      setLaboratorios(response.data.data)
    }
    setLoadingLaboratorios(false)
  }

  const loadRoles = async () => {
    setLoadingRoles(true)
    const response = await execute(() => rolService.getAll())
    if (response.error) {
      console.error('Error al cargar roles:', response.error)
    } else if (response.data) {
      setRoles(response.data.data)
    }
    setLoadingRoles(false)
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

  // Validar formulario
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
    const selectedRol = roles.find(r => r.id === formData.rol_id)
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

  const selectedRol = roles.find(r => r.id === formData.rol_id)

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
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {usuario ? 'Editar Usuario' : 'Nuevo Usuario'}
          <IconButton onClick={handleClose} disabled={loading}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {errors.submit && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.submit}
          </Alert>
        )}
        
        <TextField
          fullWidth
          label="Nombre Completo"
          value={formData.nombre_completo}
          onChange={(e) => handleChange('nombre_completo', e.target.value)}
          error={!!errors.nombre_completo}
          required
          disabled={loading}
          sx={{ mb: 2 }}
          placeholder="Ej.: Juan Pérez García"
        />

        <TextField
          fullWidth
          label="Nombre de Usuario"
          value={formData.usuario}
          onChange={(e) => handleChange('usuario', e.target.value)}
          error={!!errors.usuario}
          required
          disabled={loading}
          sx={{ mb: 2 }}
          placeholder="Ej.: jperez"
        />

        <TextField
          fullWidth
          type={showPassword ? 'text' : 'password'}
          label={usuario ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
          value={formData.contrasena}
          onChange={(e) => handleChange('contrasena', e.target.value)}
          error={!!errors.contrasena}
          required={!usuario}
          disabled={loading}
          sx={{ mb: 2 }}
          placeholder="Mínimo 6 caracteres"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  size="small"
                  disabled={loading}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <FormControl fullWidth sx={{ mb: 2 }} error={!!errors.rol_id} required>
          <InputLabel>Rol</InputLabel>
          <Select
            value={formData.rol_id}
            label="Rol"
            onChange={(e) => handleChange('rol_id', Number(e.target.value))}
            disabled={loadingRoles || loading}
          >
            <MenuItem value={0}>
              <em>Seleccionar rol</em>
            </MenuItem>
            {roles.map((rol: Rol) => (
              <MenuItem key={rol.id} value={rol.id}>
                {rol.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedRol?.nombre === 'Jefe de Laboratorio' && (
          <FormControl fullWidth sx={{ mb: 2 }} error={!!errors.laboratorio_ids}>
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
                disabled={loading}
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
              >
                {laboratorios.map((lab) => (
                  <MenuItem key={lab.id} value={lab.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      {formData.laboratorio_ids.includes(lab.id) && (
                        <CheckCircle 
                          color="primary" 
                          fontSize="small" 
                          sx={{ flexShrink: 0 }}
                        />
                      )}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2">
                          {lab.nombre}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {lab.codigo}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            )}
          </FormControl>
        )}

        <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
          {selectedRol?.nombre === 'Administrador' && 'Los administradores tienen acceso completo al sistema.'}
          {selectedRol?.nombre === 'Jefe de Laboratorio' && 'Los jefes de laboratorio solo pueden gestionar los laboratorios asignados.'}
          {!selectedRol && 'Selecciona un rol para ver más información.'}
        </Alert>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={loading} color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{ minWidth: 120 }}
        >
          {loading ? (
            <CircularProgress size={20} />
          ) : (
            usuario ? 'Actualizar' : 'Crear'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

