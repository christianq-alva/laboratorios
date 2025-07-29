import React from 'react'
import { Box, Typography, Card, CardContent, Button, Chip } from '@mui/material'
import { Add, ReportProblem } from '@mui/icons-material'

export const Incidencias: React.FC = () => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>Incidencias</Typography>
          <Typography variant="body1" color="text.secondary">
            Reporta y gestiona incidencias
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />}>Nueva Incidencia</Button>
      </Box>

      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <ReportProblem sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>Gestión de Incidencias</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Reporta y da seguimiento a problemas en los laboratorios
          </Typography>
          <Chip label="En desarrollo" color="warning" variant="outlined" />
        </CardContent>
      </Card>
    </Box>
  )
} 