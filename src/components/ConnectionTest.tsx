import React, { useState, useEffect } from 'react'
import { Box, Typography, Paper, Button, Alert } from '@mui/material'
import { api } from '../services/api'

export const ConnectionTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Testing...')
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)

  const testConnection = async () => {
    setStatus('Testing...')
    setError(null)
    try {
      const response = await api.get('/health')
      setStatus('✅ Connected!')
      setData(response.data)
    } catch (err: any) {
      setStatus('❌ Connection failed')
      setError(err.message)
      console.error('Connection test failed:', err)
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <Paper sx={{ p: 2, m: 2, maxWidth: 400 }}>
      <Typography variant="h6" gutterBottom>
        🔗 Connection Test
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 2 }}>
        Status: {status}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {data && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" component="pre" sx={{ 
            bgcolor: 'grey.100', 
            p: 1, 
            borderRadius: 1,
            fontSize: '0.75rem'
          }}>
            {JSON.stringify(data, null, 2)}
          </Typography>
        </Box>
      )}

      <Button onClick={testConnection} variant="contained" sx={{ mt: 2 }}>
        🔄 Test Again
      </Button>
    </Paper>
  )
} 