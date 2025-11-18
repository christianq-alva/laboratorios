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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab
} from '@mui/material'
import { 
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

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reporte-tabpanel-${index}`}
      aria-labelledby={`reporte-tab-${index}`}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

export const ComparacionInsumos: React.FC = () => {
  const [tabValue, setTabValue] = useState(0)
  // Estados para el primer reporte: Cantidad Requerida vs Consumida
  const [laboratorio1, setLaboratorio1] = useState<number>(1)
  const [escuela1, setEscuela1] = useState<number>(1)
  const [ciclo1, setCiclo1] = useState<number>(1)
  const [fechaInicio1, setFechaInicio1] = useState<string>('')
  const [fechaFin1, setFechaFin1] = useState<string>('')

  // Estados para el segundo reporte: Stock Actual vs Cantidad Requerida
  const [laboratorio2, setLaboratorio2] = useState<number>(1)
  const [escuela2, setEscuela2] = useState<number>(1)
  const [ciclo2, setCiclo2] = useState<number>(1)
  const [fechaInicio2, setFechaInicio2] = useState<string>('')
  const [fechaFin2, setFechaFin2] = useState<string>('')

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
          Comparación de Insumos
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Análisis detallado de insumos: requeridos, consumidos y disponibilidad
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper elevation={1} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="reportes tabs"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              minHeight: 56
            }
          }}
        >
          <Tab 
            label="Cantidad Requerida vs Consumida" 
            icon={<CompareArrows />}
            iconPosition="start"
            id="reporte-tab-0"
            aria-controls="reporte-tabpanel-0"
          />
          <Tab 
            label="Stock Actual vs Cantidad Requerida" 
            icon={<Inventory />}
            iconPosition="start"
            id="reporte-tab-1"
            aria-controls="reporte-tabpanel-1"
          />
        </Tabs>

        {/* TabPanel 0: Cantidad Requerida vs Cantidad Consumida */}
        <TabPanel value={tabValue} index={0}>
          {/* Filtros del Reporte 1 */}
          <Box sx={{ p: 2.5, bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(20% - 13px)' }, minWidth: 150 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Laboratorio</InputLabel>
                <Select
                  value={laboratorio1}
                  label="Laboratorio"
                  onChange={(e) => setLaboratorio1(e.target.value as number)}
                >
                  {mockLaboratorios.map((lab) => (
                    <MenuItem key={lab.id} value={lab.id}>
                      {lab.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(20% - 13px)' }, minWidth: 150 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Escuela</InputLabel>
                <Select
                  value={escuela1}
                  label="Escuela"
                  onChange={(e) => setEscuela1(e.target.value as number)}
                >
                  {mockEscuelas.map((esc) => (
                    <MenuItem key={esc.id} value={esc.id}>
                      {esc.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(20% - 13px)' }, minWidth: 150 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Ciclo</InputLabel>
                <Select
                  value={ciclo1}
                  label="Ciclo"
                  onChange={(e) => setCiclo1(e.target.value as number)}
                >
                  {mockCiclos.map((cic) => (
                    <MenuItem key={cic.id} value={cic.id}>
                      {cic.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(20% - 13px)' }, minWidth: 150 }}>
              <TextField
                fullWidth
                size="small"
                label="Fecha Inicio"
                type="date"
                value={fechaInicio1}
                onChange={(e) => setFechaInicio1(e.target.value)}
                InputLabelProps={{
                  shrink: true
                }}
              />
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(20% - 13px)' }, minWidth: 150 }}>
              <TextField
                fullWidth
                size="small"
                label="Fecha Fin"
                type="date"
                value={fechaFin1}
                onChange={(e) => setFechaFin1(e.target.value)}
                InputLabelProps={{
                  shrink: true
                }}
              />
            </Box>
            </Box>
          </Box>

          {/* Tabla del Reporte 1 */}
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
        </TabPanel>

        {/* TabPanel 1: Stock Actual vs Cantidad Requerida */}
        <TabPanel value={tabValue} index={1}>
          {/* Filtros del Reporte 2 */}
          <Box sx={{ p: 2.5, bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(20% - 13px)' }, minWidth: 150 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Laboratorio</InputLabel>
                <Select
                  value={laboratorio2}
                  label="Laboratorio"
                  onChange={(e) => setLaboratorio2(e.target.value as number)}
                >
                  {mockLaboratorios.map((lab) => (
                    <MenuItem key={lab.id} value={lab.id}>
                      {lab.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(20% - 13px)' }, minWidth: 150 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Escuela</InputLabel>
                <Select
                  value={escuela2}
                  label="Escuela"
                  onChange={(e) => setEscuela2(e.target.value as number)}
                >
                  {mockEscuelas.map((esc) => (
                    <MenuItem key={esc.id} value={esc.id}>
                      {esc.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(20% - 13px)' }, minWidth: 150 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Ciclo</InputLabel>
                <Select
                  value={ciclo2}
                  label="Ciclo"
                  onChange={(e) => setCiclo2(e.target.value as number)}
                >
                  {mockCiclos.map((cic) => (
                    <MenuItem key={cic.id} value={cic.id}>
                      {cic.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(20% - 13px)' }, minWidth: 150 }}>
              <TextField
                fullWidth
                size="small"
                label="Fecha Inicio"
                type="date"
                value={fechaInicio2}
                onChange={(e) => setFechaInicio2(e.target.value)}
                InputLabelProps={{
                  shrink: true
                }}
              />
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(20% - 13px)' }, minWidth: 150 }}>
              <TextField
                fullWidth
                size="small"
                label="Fecha Fin"
                type="date"
                value={fechaFin2}
                onChange={(e) => setFechaFin2(e.target.value)}
                InputLabelProps={{
                  shrink: true
                }}
              />
            </Box>
            </Box>
          </Box>

          {/* Tabla del Reporte 2 */}
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
        </TabPanel>
      </Paper>
    </Box>
  )
}

