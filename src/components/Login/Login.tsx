import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  InputAdornment,
  IconButton,
  Divider,
  Link,
} from '@mui/material'
import {
  LockOutlined,
  PersonOutline,
  Visibility,
  VisibilityOff,
  Science,
} from '@mui/icons-material'
import { useAuth } from '../../hooks/useAuth'

export const Login: React.FC = () => {
  const [usuario, setUsuario] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const errorRef = useRef('')

  const { login, isLoggingIn } = useAuth()

  // Sincronizar ref con estado
  useEffect(() => {
    errorRef.current = error
  }, [error])

  // Restaurar error desde ref si el componente se re-monta (síncrono antes del render)
  useLayoutEffect(() => {
    if (errorRef.current && !error) {
      setError(errorRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Solo al montar

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    errorRef.current = ''

    const result = await login({ usuario, contrasena })

    if (!result.success) {
      const errorMessage = result.message || 'Error al iniciar sesión'
      errorRef.current = errorMessage
      setError(errorMessage)
    }
  }

  const handleTogglePassword = () => {
    setShowPassword(!showPassword)
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f6f8fa',
        backgroundImage: 'linear-gradient(135deg, #f6f8fa 0%, #e1e8ed 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Card
          elevation={1}
          sx={{
            borderRadius: 3,
            border: '1px solid #d0d7de',
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Header simplificado */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
                <Science sx={{ color: '#1e3a5f', fontSize: 32 }} />
                <Typography variant="h4" component="h1" fontWeight={600} color="#1e3a5f">
                  Iniciar sesión
                </Typography>
              </Box>
              <Typography variant="body1" color="#656d76" sx={{ mb: 2 }}>
                Sistema de Gestión de Laboratorios
              </Typography>
              <Typography variant="h6" color="#2e5984" fontWeight={500}>
                UPeU
              </Typography>
            </Box>

            {/* Error Alert */}
            {error ? (
              <Alert
                severity="error"
                onClose={() => setError('')}
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  border: '1px solid #cf222e',
                  backgroundColor: '#ffebe9',
                  color: '#cf222e',
                  '& .MuiAlert-icon': {
                    color: '#cf222e'
                  },
                  '& .MuiAlert-message': {
                    color: '#cf222e',
                    fontWeight: 500
                  }
                }}
              >
                {error}
              </Alert>
            ) : null}

            {/* Formulario */}
            <Box component="form" onSubmit={handleSubmit}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" component="label" sx={{
                  display: 'block',
                  mb: 1,
                  fontWeight: 600,
                  color: '#24292f',
                  fontSize: '0.875rem'
                }}>
                  Usuario
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  required
                  disabled={isLoggingIn}
                  placeholder="Ingresa tu usuario"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutline sx={{ color: '#656d76', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: '#f6f8fa',
                      border: '1px solid #d0d7de',
                      fontSize: '0.875rem',
                      '&:hover': {
                        backgroundColor: '#f3f4f6',
                        borderColor: '#0969da',
                      },
                      '&.Mui-focused': {
                        backgroundColor: '#ffffff',
                        borderColor: '#0969da',
                        borderWidth: 2,
                        boxShadow: '0 0 0 3px rgba(9, 105, 218, 0.1)',
                      },
                      '& fieldset': {
                        border: 'none',
                      },
                    },
                    '& .MuiInputBase-input': {
                      padding: '8px 12px',
                      '&::placeholder': {
                        color: '#656d76',
                        opacity: 1,
                      },
                    },
                  }}
                />
              </Box>

              <Box sx={{ mb: 4 }}>
                <Typography variant="body2" component="label" sx={{
                  display: 'block',
                  mb: 1,
                  fontWeight: 600,
                  color: '#24292f',
                  fontSize: '0.875rem'
                }}>
                  Contraseña
                </Typography>
                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  required
                  disabled={isLoggingIn}
                  placeholder="Ingresa tu contraseña"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined sx={{ color: '#656d76', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleTogglePassword}
                          edge="end"
                          size="small"
                          sx={{
                            color: '#656d76',
                            '&:hover': {
                              backgroundColor: 'rgba(9, 105, 218, 0.1)',
                            }
                          }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: '#f6f8fa',
                      border: '1px solid #d0d7de',
                      fontSize: '0.875rem',
                      '&:hover': {
                        backgroundColor: '#f3f4f6',
                        borderColor: '#0969da',
                      },
                      '&.Mui-focused': {
                        backgroundColor: '#ffffff',
                        borderColor: '#0969da',
                        borderWidth: 2,
                        boxShadow: '0 0 0 3px rgba(9, 105, 218, 0.1)',
                      },
                      '& fieldset': {
                        border: 'none',
                      },
                    },
                    '& .MuiInputBase-input': {
                      padding: '8px 12px',
                      '&::placeholder': {
                        color: '#656d76',
                        opacity: 1,
                      },
                    },
                  }}
                />
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoggingIn}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  textTransform: 'none',
                  backgroundColor: '#1e3a5f',
                  border: '1px solid #1e3a5f',
                  boxShadow: '0 1px 0 rgba(27, 31, 36, 0.04)',
                  '&:hover': {
                    backgroundColor: '#0f1e2d',
                    borderColor: '#0f1e2d',
                    boxShadow: '0 1px 0 rgba(27, 31, 36, 0.1)',
                  },
                  '&:disabled': {
                    backgroundColor: '#1e3a5f',
                    opacity: 0.6,
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {isLoggingIn ? (
                  <>
                    <CircularProgress size={16} sx={{ mr: 2, color: 'white' }} />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar sesión'
                )}
              </Button>
            </Box>

            <Divider sx={{ my: 4, borderColor: '#d0d7de' }} />

            {/* Footer */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="#656d76" sx={{ mb: 2 }}>
                Universidad Peruana Unión
              </Typography>
              <Typography variant="body2" color="#656d76" sx={{ fontWeight: 500 }}>
                Plataforma de Laboratorios
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Información adicional */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="#656d76" sx={{ mb: 1 }}>
            ¿Necesitas ayuda?
          </Typography>
          <Link
            href="#"
            sx={{
              color: '#0969da',
              textDecoration: 'none',
              fontWeight: 500,
              '&:hover': {
                textDecoration: 'underline',
              }
            }}
          >
            Contacta al administrador del sistema
          </Link>
        </Box>
      </Container>
    </Box>
  )
}