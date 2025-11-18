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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'
import { 
  Science,
  CheckCircle,
  FilterList,
  CompareArrows,
  Inventory
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

// Mock data para tabla de cantidad requerida vs consumida
const mockTablaRequeridoVsConsumido = [
  { 
    laboratorio: 'Laboratorio Multifuncional I', 
    escuela: 'Medicina', 
    ciclo: 'I ciclo', 
    insumo: 'Alcohol 70%', 
    cantidadRequerida: 500, 
    cantidadConsumida: 520,
    unidad: 'ml'
  },
  { 
    laboratorio: 'Laboratorio de Química', 
    escuela: 'Enfermería', 
    ciclo: 'II ciclo', 
    insumo: 'Guantes de látex', 
    cantidadRequerida: 100, 
    cantidadConsumida: 95,
    unidad: 'unidades'
  },
  { 
    laboratorio: 'Laboratorio Multifuncional I', 
    escuela: 'Medicina', 
    ciclo: 'I ciclo', 
    insumo: 'Jeringa 5ml', 
    cantidadRequerida: 50, 
    cantidadConsumida: 55,
    unidad: 'unidades'
  }
]

// Mock data para tabla de stock actual vs cantidad requerida
const mockTablaStockVsRequerido = [
  { 
    laboratorio: 'Laboratorio Multifuncional I', 
    escuela: 'Medicina', 
    ciclo: 'I ciclo', 
    insumo: 'Alcohol 70%', 
    stockActual: 1500, 
    cantidadRequerida: 500,
    unidad: 'ml'
  },
  { 
    laboratorio: 'Laboratorio de Química', 
    escuela: 'Enfermería', 
    ciclo: 'II ciclo', 
    insumo: 'Guantes de látex', 
    stockActual: 200, 
    cantidadRequerida: 100,
    unidad: 'unidades'
  },
  { 
    laboratorio: 'Laboratorio Multifuncional I', 
    escuela: 'Medicina', 
    ciclo: 'I ciclo', 
    insumo: 'Jeringa 5ml', 
    stockActual: 80, 
    cantidadRequerida: 50,
    unidad: 'unidades'
  }
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

      {/* Tablas en una fila */}
      <Box 
        sx={{ 
          display: 'flex', 
          gap: 2, 
          width: '100%',
          flexDirection: { xs: 'column', lg: 'row' },
          mt: 3
        }}
      >
        {/* Tabla 1: Cantidad Requerida vs Cantidad Consumida */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Paper elevation={1} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CompareArrows color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Cantidad Requerida vs Cantidad Consumida
                </Typography>
              </Box>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Laboratorio</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Escuela</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Ciclo</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Insumo</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Cantidad Requerida</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Cantidad Consumida</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Diferencia</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockTablaRequeridoVsConsumido.map((row, index) => {
                    const diferencia = row.cantidadConsumida - row.cantidadRequerida
                    const esPositivo = diferencia > 0
                    return (
                      <TableRow 
                        key={index}
                        hover
                        sx={{ '&:last-child td': { border: 0 } }}
                      >
                        <TableCell>{row.laboratorio}</TableCell>
                        <TableCell>{row.escuela}</TableCell>
                        <TableCell>{row.ciclo}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {row.insumo}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 500 }}>
                            {row.cantidadRequerida} {row.unidad}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 500 }}>
                            {row.cantidadConsumida} {row.unidad}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${esPositivo ? '+' : ''}${diferencia} ${row.unidad}`}
                            size="small"
                            color={esPositivo ? 'warning' : 'success'}
                            variant="outlined"
                            sx={{ fontWeight: 500, fontSize: '0.7rem' }}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>

        {/* Tabla 2: Stock Actual vs Cantidad Requerida */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Paper elevation={1} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Inventory color="success" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Stock Actual vs Cantidad Requerida
                </Typography>
              </Box>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Laboratorio</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Escuela</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Ciclo</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Insumo</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Stock Actual</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Cantidad Requerida</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockTablaStockVsRequerido.map((row, index) => {
                    const diferencia = row.stockActual - row.cantidadRequerida
                    const esSuficiente = diferencia >= 0
                    return (
                      <TableRow 
                        key={index}
                        hover
                        sx={{ '&:last-child td': { border: 0 } }}
                      >
                        <TableCell>{row.laboratorio}</TableCell>
                        <TableCell>{row.escuela}</TableCell>
                        <TableCell>{row.ciclo}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {row.insumo}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ color: 'info.main', fontWeight: 500 }}>
                            {row.stockActual} {row.unidad}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 500 }}>
                            {row.cantidadRequerida} {row.unidad}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={esSuficiente ? 'Suficiente' : 'Insuficiente'}
                            size="small"
                            color={esSuficiente ? 'success' : 'error'}
                            variant="outlined"
                            sx={{ fontWeight: 500, fontSize: '0.7rem' }}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </Box>
    </Box>
  )
}

