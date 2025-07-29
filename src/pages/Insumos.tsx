import React from 'react'
import { Box, Typography, Card, CardContent, Button, Chip } from '@mui/material'
import { Add, Inventory } from '@mui/icons-material'

export const Insumos: React.FC = () => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>Insumos</Typography>
          <Typography variant="body1" color="text.secondary">
            Controla el inventario de materiales
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />}>Nuevo Insumo</Button>
      </Box>

      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Inventory sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>Gestión de Insumos</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Administra el inventario y stock de materiales
          </Typography>
          <Chip label="En desarrollo" color="warning" variant="outlined" />
        </CardContent>
      </Card>
    </Box>
  )
} 