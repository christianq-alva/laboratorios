import React, { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Chip
} from '@mui/material'
import { 
  Science,
  CheckCircle,
  FilterList
} from '@mui/icons-material'

// Mock data para la maqueta
const mockLaboratorios = [
  { id: 1, nombre: 'Laboratorio Multifuncional I' },
  { id: 2, nombre: 'Laboratorio de Química' },
  { id: 3, nombre: 'Laboratorio de Biología' }
]

const mockEscuelas = [
  { id: 1, nombre: 'Medicina' },
  { id: 2, nombre: 'Enfermería' },
  { id: 3, nombre: 'Ingeniería de Sistemas' }
]

const mockCiclos = [
  { id: 1, nombre: 'I ciclo' },
  { id: 2, nombre: 'II ciclo' },
  { id: 3, nombre: 'III ciclo' }
]

const mockInsumosRequeridos = [
  { id: 1, nombre: 'Insumo A', tipo: 'Reactivo', cantidad: 50, unidad: 'ml' },
  { id: 2, nombre: 'Insumo B', tipo: 'Reactivo', cantidad: 40, unidad: 'ml' },
  { id: 3, nombre: 'Insumo C', tipo: 'Reactivo', cantidad: 30, unidad: 'ml' },
  { id: 4, nombre: 'Insumo D', tipo: 'Reactivo', cantidad: 90, unidad: 'ml' }
]

const mockInsumosUtilizados = [
  { id: 1, nombre: 'Insumo A', tipo: 'Reactivo', cantidad: 60, unidad: 'ml', diferencia: 10 },
  { id: 2, nombre: 'Insumo B', tipo: 'Reactivo', cantidad: 80, unidad: 'ml', diferencia: 40 },
  { id: 3, nombre: 'Insumo C', tipo: 'Reactivo', cantidad: 60, unidad: 'ml', diferencia: 30 },
  { id: 4, nombre: 'Insumo D', tipo: 'Reactivo', cantidad: 100, unidad: 'ml', diferencia: 10 }
]

export const ComparacionInsumos: React.FC = () => {
  const [laboratorio, setLaboratorio] = useState<number>(1)
  const [escuela, setEscuela] = useState<number>(1)
  const [ciclo, setCiclo] = useState<number>(1)
  const [fechaInicio, setFechaInicio] = useState<string>('')
  const [fechaFin, setFechaFin] = useState<string>('')

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
          Comparación de Insumos
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Análisis de insumos requeridos vs utilizados realmente
        </Typography>
      </Box>

      {/* Filtros */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterList color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Filtros de Búsqueda
          </Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Laboratorio</InputLabel>
              <Select
                value={laboratorio}
                label="Laboratorio"
                onChange={(e) => setLaboratorio(e.target.value as number)}
              >
                {mockLaboratorios.map((lab) => (
                  <MenuItem key={lab.id} value={lab.id}>
                    {lab.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Escuela</InputLabel>
              <Select
                value={escuela}
                label="Escuela"
                onChange={(e) => setEscuela(e.target.value as number)}
              >
                {mockEscuelas.map((esc) => (
                  <MenuItem key={esc.id} value={esc.id}>
                    {esc.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Ciclo</InputLabel>
              <Select
                value={ciclo}
                label="Ciclo"
                onChange={(e) => setCiclo(e.target.value as number)}
              >
                {mockCiclos.map((cic) => (
                  <MenuItem key={cic.id} value={cic.id}>
                    {cic.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="Fecha Inicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              InputLabelProps={{
                shrink: true
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="Fecha Fin"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              InputLabelProps={{
                shrink: true
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Cuadro Comparativo - Dos Columnas */}
      <Box 
        sx={{ 
          display: 'flex', 
          gap: 2, 
          width: '100%',
          flexDirection: { xs: 'column', md: 'row' }
        }}
      >
        {/* Columna Izquierda: Insumos Requeridos */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Paper 
            elevation={1} 
            sx={{ 
              borderRadius: 2, 
              height: '100%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            {/* Header */}
            <Box 
              sx={{ 
                p: 2.5, 
                bgcolor: 'primary.main',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}
            >
              <Science sx={{ fontSize: 22 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Insumos Requeridos
              </Typography>
            </Box>

            {/* Contenido */}
            <Box sx={{ flex: 1, p: 0 }}>
              {mockInsumosRequeridos.map((insumo, index) => (
                <Box
                  key={insumo.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    px: 3,
                    py: 2.5,
                    borderBottom: index < mockInsumosRequeridos.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    transition: 'background-color 0.15s',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 500, 
                        mb: 0.5,
                        color: 'text.primary'
                      }}
                    >
                      {insumo.nombre}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ fontSize: '0.75rem' }}
                    >
                      {insumo.tipo}
                    </Typography>
                  </Box>
                  <Box sx={{ ml: 2, textAlign: 'right' }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600, 
                        color: 'primary.main',
                        lineHeight: 1.2
                      }}
                    >
                      {insumo.cantidad} {insumo.unidad}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>

        {/* Columna Derecha: Insumos Utilizados */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Paper 
            elevation={1} 
            sx={{ 
              borderRadius: 2, 
              height: '100%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            {/* Header */}
            <Box 
              sx={{ 
                p: 2.5, 
                bgcolor: 'success.main',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}
            >
              <CheckCircle sx={{ fontSize: 22 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Insumos Utilizados
              </Typography>
            </Box>

            {/* Contenido */}
            <Box sx={{ flex: 1, p: 0 }}>
              {mockInsumosUtilizados.map((insumo, index) => (
                <Box
                  key={insumo.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    px: 3,
                    py: 2.5,
                    borderBottom: index < mockInsumosUtilizados.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    transition: 'background-color 0.15s',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 500, 
                        mb: 0.5,
                        color: 'text.primary'
                      }}
                    >
                      {insumo.nombre}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ fontSize: '0.75rem' }}
                    >
                      {insumo.tipo}
                    </Typography>
                  </Box>
                  <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600, 
                        color: 'success.main',
                        lineHeight: 1.2
                      }}
                    >
                      {insumo.cantidad} {insumo.unidad}
                    </Typography>
                    <Chip
                      label={`+${insumo.diferencia}${insumo.unidad}`}
                      size="small"
                      color="warning"
                      variant="outlined"
                      sx={{ 
                        fontWeight: 500, 
                        fontSize: '0.7rem',
                        height: 22,
                        borderColor: 'warning.main',
                        color: 'warning.dark'
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  )
}

