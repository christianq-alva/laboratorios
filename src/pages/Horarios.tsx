import React from 'react'
import { Box, Typography, Card, CardContent, Button, Chip } from '@mui/material'
import { Add, Schedule } from '@mui/icons-material'

export const Horarios: React.FC = () => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>Horarios</Typography>
          <Typography variant="body1" color="text.secondary">
            Administra las reservas de laboratorio
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />}>Nuevo Horario</Button>
      </Box>

      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Schedule sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>Gestión de Horarios</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Programa y gestiona las reservas de laboratorio
          </Typography>
          <Chip label="En desarrollo" color="warning" variant="outlined" />
        </CardContent>
      </Card>
    </Box>
  )
} 