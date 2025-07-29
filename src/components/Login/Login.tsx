import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Avatar,
  Container,
} from '@mui/material'
import { LockOutlined } from '@mui/icons-material'
import { useAuth } from '../../context/authContext'

export const Login: React.FC = () => {
  const [usuario, setUsuario] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState('')
  
  const { login, loading } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    const result = await login({ usuario, contrasena })

    if (!result.success) {
      setError(result.message || 'Error al iniciar sesión')
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Card 
          elevation={24}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Avatar
                sx={{
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  width: 56,
                  height: 56,
                }}
              >
                <LockOutlined />
              </Avatar>
              <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
                Sistema Laboratorios
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Inicia sesión para acceder al sistema
              </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {/* Form */}
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Usuario"
                variant="outlined"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
                sx={{ mb: 2 }}
                disabled={loading}
              />
              
              <TextField
                fullWidth
                label="Contraseña"
                type="password"
                variant="outlined"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                required
                sx={{ mb: 3 }}
                disabled={loading}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: '1rem',
                }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </Box>

            {/* Footer */}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Universidad ABC - Sistema de Gestión de Laboratorios
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}