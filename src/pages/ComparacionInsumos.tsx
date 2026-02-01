import React, { useState, useEffect } from 'react'
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
  Tab,
  CircularProgress,
  Alert
} from '@mui/material'
import {
  CompareArrows,
  Inventory
} from '@mui/icons-material'
import { reporteService, type RequeridoVsConsumido, type StockVsRequerido, type FiltrosComparacion } from '../services/reporteService'
import { laboratorioService, type Laboratorio } from '../services/laboratorioService'
import { escuelaService, type Escuela } from '../services/escuelaService'
import { useApi } from '../hooks/useApi'

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

  // Estados para datos de filtros
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [escuelas, setEscuelas] = useState<Escuela[]>([])

  // Estados para el primer reporte: Cantidad Requerida vs Consumida
  const [laboratorio1, setLaboratorio1] = useState<number | ''>('')
  const [escuela1, setEscuela1] = useState<number | ''>('')
  const [fechaInicio1, setFechaInicio1] = useState<string>('')
  const [fechaFin1, setFechaFin1] = useState<string>('')
  const [datosRequeridoVsConsumido, setDatosRequeridoVsConsumido] = useState<RequeridoVsConsumido[]>([])

  // Estados para el segundo reporte: Stock Actual vs Cantidad Requerida
  const [laboratorio2, setLaboratorio2] = useState<number | ''>('')
  const [fechaInicio2, setFechaInicio2] = useState<string>('')
  const [fechaFin2, setFechaFin2] = useState<string>('')
  const [datosStockVsRequerido, setDatosStockVsRequerido] = useState<StockVsRequerido[]>([])

  const { execute } = useApi()
  const [loadingLabs, setLoadingLabs] = useState(false)
  const [loadingEscuelas, setLoadingEscuelas] = useState(false)

  // Funciones para cargar datos
  const loadLaboratorios = async () => {
    setLoadingLabs(true)
    const response = await execute(() => laboratorioService.getAll())
    if (response.data && response.data.data && response.data.data.length > 0) {
      const sortedLaboratorios = [...response.data.data].sort((a, b) => a.nombre.localeCompare(b.nombre))
      setLaboratorios(sortedLaboratorios)
      if (!laboratorio1 && !laboratorio2) {
        setLaboratorio1(sortedLaboratorios[0].id)
        setLaboratorio2(sortedLaboratorios[0].id)
      }
    }
    setLoadingLabs(false)
  }

  const loadEscuelas = async () => {
    setLoadingEscuelas(true)
    const response = await execute(() => escuelaService.getAll())
    if (response.data && response.data.data && response.data.data.length > 0) {
      const sortedEscuelas = [...response.data.data].sort((a, b) => a.nombre.localeCompare(b.nombre))
      setEscuelas(sortedEscuelas)
      if (!escuela1) {
        setEscuela1(sortedEscuelas[0].id)
      }
    }
    setLoadingEscuelas(false)
  }

  // Función para establecer fechas por defecto (30 días atrás hasta hoy)
  const establecerFechasPorDefecto = () => {
    const hoy = new Date()
    const hace30Dias = new Date()
    hace30Dias.setDate(hace30Dias.getDate() - 30)

    const fechaFin = hoy.toISOString().split('T')[0]
    const fechaInicio = hace30Dias.toISOString().split('T')[0]

    if (!fechaInicio1 && !fechaFin1) {
      setFechaInicio1(fechaInicio)
      setFechaFin1(fechaFin)
    }
    if (!fechaInicio2 && !fechaFin2) {
      setFechaInicio2(fechaInicio)
      setFechaFin2(fechaFin)
    }
  }

  const [loadingReporte1, setLoadingReporte1] = useState(false)
  const [loadingReporte2, setLoadingReporte2] = useState(false)

  // Cargar datos del reporte 1
  const loadRequeridoVsConsumido = async () => {
    setLoadingReporte1(true)
    const filtros: FiltrosComparacion = {}
    if (laboratorio1) filtros.laboratorio_id = Number(laboratorio1)
    if (escuela1) filtros.escuela_id = Number(escuela1)
    if (fechaInicio1) filtros.fecha_inicio = fechaInicio1
    if (fechaFin1) filtros.fecha_fin = fechaFin1

    const response = await execute(() => reporteService.getRequeridoVsConsumido(filtros))
    if (response.data && response.data.data) {
      setDatosRequeridoVsConsumido(response.data.data)
    }
    setLoadingReporte1(false)
  }

  // Cargar datos del reporte 2
  const loadStockVsRequerido = async () => {
    setLoadingReporte2(true)
    const filtros: FiltrosComparacion = {}
    if (laboratorio2) filtros.laboratorio_id = Number(laboratorio2)
    if (fechaInicio2) filtros.fecha_inicio = fechaInicio2
    if (fechaFin2) filtros.fecha_fin = fechaFin2

    const response = await execute(() => reporteService.getStockVsRequerido(filtros))
    if (response.data && response.data.data) {
      setDatosStockVsRequerido(response.data.data)
    }
    setLoadingReporte2(false)
  }

  // Cargar datos iniciales
  useEffect(() => {
    loadLaboratorios()
    loadEscuelas()
    establecerFechasPorDefecto()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cargar reporte 1 cuando cambien los filtros
  useEffect(() => {
    if (laboratorio1 && escuela1 && fechaInicio1 && fechaFin1) {
      loadRequeridoVsConsumido()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [laboratorio1, escuela1, fechaInicio1, fechaFin1])

  // Cargar reporte 2 cuando cambien los filtros
  useEffect(() => {
    if (laboratorio2 && fechaInicio2 && fechaFin2) {
      loadStockVsRequerido()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [laboratorio2, fechaInicio2, fechaFin2])

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
                    disabled={loadingLabs}
                  >
                    {laboratorios.map((lab) => (
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
                    disabled={loadingEscuelas}
                  >
                    {escuelas.map((esc) => (
                      <MenuItem key={esc.id} value={esc.id}>
                        {esc.nombre}
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
          {loadingReporte1 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : datosRequeridoVsConsumido.length === 0 ? (
            <Box sx={{ p: 3 }}>
              <Alert severity="info">No hay datos disponibles para los filtros seleccionados</Alert>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Laboratorio</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Escuela</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Insumo</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Cantidad Requerida</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Cantidad Consumida</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Diferencia</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {datosRequeridoVsConsumido.map((row, index) => {
                    const diferencia = row.cantidad_consumida - row.cantidad_requerida
                    const esPositivo = diferencia > 0
                    const unidad = row.unidad_simbolo || row.unidad_nombre || 'unidades'
                    return (
                      <TableRow
                        key={`${row.laboratorio_id}-${row.insumo_id}-${index}`}
                        hover
                        sx={{ '&:last-child td': { border: 0 } }}
                      >
                        <TableCell>{row.laboratorio_nombre}</TableCell>
                        <TableCell>{row.escuela_nombre}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {row.insumo_nombre}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 500 }}>
                            {row.cantidad_requerida.toFixed(2)} {unidad}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 500 }}>
                            {row.cantidad_consumida.toFixed(2)} {unidad}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${esPositivo ? '+' : ''}${diferencia.toFixed(2)} ${unidad}`}
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
          )}
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
                    disabled={loadingLabs}
                  >
                    {laboratorios.map((lab) => (
                      <MenuItem key={lab.id} value={lab.id}>
                        {lab.nombre}
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
          {loadingReporte2 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : datosStockVsRequerido.length === 0 ? (
            <Box sx={{ p: 3 }}>
              <Alert severity="info">No hay datos disponibles para los filtros seleccionados</Alert>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Laboratorio</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Insumo</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Cantidad Requerida</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Stock Actual</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {datosStockVsRequerido.map((row, index) => {
                    const diferencia = row.stock_actual - row.cantidad_requerida
                    const esSuficiente = diferencia >= 0
                    const unidad = row.unidad_simbolo || row.unidad_nombre || 'unidades'
                    return (
                      <TableRow
                        key={`${row.laboratorio_id}-${row.insumo_id}-${index}`}
                        hover
                        sx={{ '&:last-child td': { border: 0 } }}
                      >
                        <TableCell>{row.laboratorio_nombre}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {row.insumo_nombre}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 500 }}>
                            {row.cantidad_requerida.toFixed(2)} {unidad}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ color: 'info.main', fontWeight: 500 }}>
                            {row.stock_actual.toFixed(2)} {unidad}
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
          )}
        </TabPanel>
      </Paper>
    </Box>
  )
}

