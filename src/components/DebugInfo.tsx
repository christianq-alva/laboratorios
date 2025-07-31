import React, { useState, useEffect } from 'react'
import { Box, Typography, Paper, Button, Alert, CircularProgress } from '@mui/material'
import { api } from '../services/api'

// Tipos para Network Information API
interface NetworkInformation {
  effectiveType: string
  downlink: number
  rtt: number
}

declare global {
  interface Navigator {
    connection?: NetworkInformation
  }
}

export const DebugInfo: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testConnection = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/health')
      setDebugInfo({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        connection: navigator.connection ? {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt
        } : 'No disponible'
      })
    } catch (error: any) {
      setError(error.message)
      setDebugInfo({
        success: false,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        connection: navigator.connection ? {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt
        } : 'No disponible'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <Paper sx={{ p: 2, m: 2, maxWidth: 600 }}>
      <Typography variant="h6" gutterBottom>
        🔧 Debug Info - Dispositivos Móviles
      </Typography>
      
      <Button 
        onClick={testConnection} 
        disabled={loading}
        variant="contained"
        sx={{ mb: 2 }}
      >
        {loading ? <CircularProgress size={20} /> : '🔄 Test Connection'}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {debugInfo && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            📊 Información de Conexión:
          </Typography>
          <Typography variant="body2" component="pre" sx={{ 
            bgcolor: 'grey.100', 
            p: 1, 
            borderRadius: 1,
            fontSize: '0.75rem',
            overflow: 'auto'
          }}>
            {JSON.stringify(debugInfo, null, 2)}
          </Typography>
        </Box>
      )}
    </Paper>
  )
} 