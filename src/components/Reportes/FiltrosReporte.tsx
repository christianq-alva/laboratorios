import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  Stack,
  Typography
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/es'
import FilterListIcon from '@mui/icons-material/FilterList'
import ClearIcon from '@mui/icons-material/Clear'
import SearchIcon from '@mui/icons-material/Search'
import { laboratorioService, type Laboratorio as LaboratorioType } from '../../services/laboratorioService'
import { type FiltrosReporte as FiltrosReporteType } from '../../services/reporteService'

dayjs.locale('es')

interface FiltrosReporteProps {
  onFiltrosChange: (filtros: FiltrosReporteType) => void
  filtrosIniciales?: FiltrosReporteType
  mostrarTipoPeriodo?: boolean
  mostrarCategoria?: boolean
  mostrarLimite?: boolean
}


const FiltrosReporte: React.FC<FiltrosReporteProps> = ({
  onFiltrosChange,
  filtrosIniciales = {},
  mostrarTipoPeriodo = true,
  mostrarCategoria = true,
  mostrarLimite = false
}) => {
  const [filtros, setFiltros] = useState<FiltrosReporteType>(filtrosIniciales)
  const [laboratorios, setLaboratorios] = useState<LaboratorioType[]>([])
  const [escuelas, setEscuelas] = useState<string[]>([])
  const [categorias] = useState<string[]>([
    'Reactivos', 'Materiales', 'Equipos', 'Consumibles', 'Herramientas'
  ])

  useEffect(() => {
    cargarLaboratorios()
  }, [])

  const cargarLaboratorios = async () => {
    try {
      const response = await laboratorioService.getAll()
      if (response.success) {
        setLaboratorios(response.data)
        
        // Extraer escuelas únicas
        const escuelasUnicas = [...new Set(response.data.map((lab: LaboratorioType) => lab.escuela).filter(Boolean))] as string[]
        setEscuelas(escuelasUnicas)
      }
    } catch (error) {
      console.error('Error al cargar laboratorios:', error)
    }
  }

  const handleFiltroChange = (key: keyof FiltrosReporteType, value: any) => {
    const nuevosFiltros = { ...filtros, [key]: value }
    setFiltros(nuevosFiltros)
  }

  const aplicarFiltros = () => {
    onFiltrosChange(filtros)
  }

  const limpiarFiltros = () => {
    const filtrosVacios: FiltrosReporteType = {}
    setFiltros(filtrosVacios)
    onFiltrosChange(filtrosVacios)
  }

  const obtenerRangosFecha = () => {
    const hoy = dayjs()
    return {
      'Último mes': {
        inicio: hoy.subtract(1, 'month').startOf('month'),
        fin: hoy.subtract(1, 'month').endOf('month')
      },
      'Últimos 3 meses': {
        inicio: hoy.subtract(3, 'month').startOf('month'),
        fin: hoy.endOf('month')
      },
      'Este año': {
        inicio: hoy.startOf('year'),
        fin: hoy.endOf('year')
      },
      'Año pasado': {
        inicio: hoy.subtract(1, 'year').startOf('year'),
        fin: hoy.subtract(1, 'year').endOf('year')
      }
    }
  }

  const aplicarRangoFecha = (rango: string) => {
    const rangos = obtenerRangosFecha()
    const rangoSeleccionado = rangos[rango as keyof typeof rangos]
    
    if (rangoSeleccionado) {
      handleFiltroChange('fecha_inicio', rangoSeleccionado.inicio.format('YYYY-MM-DD'))
      handleFiltroChange('fecha_fin', rangoSeleccionado.fin.format('YYYY-MM-DD'))
    }
  }

  const contarFiltrosActivos = () => {
    return Object.values(filtros).filter(valor => 
      valor !== undefined && valor !== null && valor !== ''
    ).length
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={3}>
            <FilterListIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" component="h2" sx={{ flexGrow: 1, fontWeight: 600 }}>
              Filtros de Reporte
            </Typography>
            {contarFiltrosActivos() > 0 && (
              <Chip 
                label={`${contarFiltrosActivos()} filtros activos`} 
                color="primary" 
                size="small" 
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {/* Tipo de Período */}
            {mostrarTipoPeriodo && (
              <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' } }}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Período</InputLabel>
                  <Select
                    value={filtros.tipo_periodo || ''}
                    label="Tipo de Período"
                    onChange={(e) => handleFiltroChange('tipo_periodo', e.target.value)}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="mensual">Mensual</MenuItem>
                    <MenuItem value="anual">Anual</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}

            {/* Escuela */}
            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' } }}>
              <FormControl fullWidth>
                <InputLabel>Escuela</InputLabel>
                <Select
                  value={filtros.escuela_id || ''}
                  label="Escuela"
                  onChange={(e) => handleFiltroChange('escuela_id', e.target.value)}
                >
                  <MenuItem value="">Todas las escuelas</MenuItem>
                  {escuelas.map((escuela) => (
                    <MenuItem key={escuela} value={escuela}>
                      {escuela}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Laboratorio */}
            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' } }}>
              <FormControl fullWidth>
                <InputLabel>Laboratorio</InputLabel>
                <Select
                  value={filtros.laboratorio_id || ''}
                  label="Laboratorio"
                  onChange={(e) => handleFiltroChange('laboratorio_id', e.target.value)}
                >
                  <MenuItem value="">Todos los laboratorios</MenuItem>
                  {laboratorios
                    .filter(lab => !filtros.escuela_id || lab.escuela === filtros.escuela_id)
                    .map((laboratorio) => (
                      <MenuItem key={laboratorio.id} value={laboratorio.id}>
                        {laboratorio.nombre}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Box>

            {/* Categoría de Insumo */}
            {mostrarCategoria && (
              <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' } }}>
                <FormControl fullWidth>
                  <InputLabel>Categoría de Insumo</InputLabel>
                  <Select
                    value={filtros.categoria_insumo || ''}
                    label="Categoría de Insumo"
                    onChange={(e) => handleFiltroChange('categoria_insumo', e.target.value)}
                  >
                    <MenuItem value="">Todas las categorías</MenuItem>
                    {categorias.map((categoria) => (
                      <MenuItem key={categoria} value={categoria}>
                        {categoria}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}

            {/* Límite de resultados */}
            {mostrarLimite && (
              <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' } }}>
                <TextField
                  fullWidth
                  label="Límite de resultados"
                  type="number"
                  value={filtros.limite || ''}
                  onChange={(e) => handleFiltroChange('limite', parseInt(e.target.value) || undefined)}
                  inputProps={{ min: 1, max: 100 }}
                />
              </Box>
            )}

            {/* Fecha Inicio */}
            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' } }}>
              <DatePicker
                label="Fecha Inicio"
                value={filtros.fecha_inicio ? dayjs(filtros.fecha_inicio) : null}
                onChange={(newValue: Dayjs | null) => 
                  handleFiltroChange('fecha_inicio', newValue?.format('YYYY-MM-DD'))
                }
                slotProps={{
                  textField: { fullWidth: true }
                }}
              />
            </Box>

            {/* Fecha Fin */}
            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' } }}>
              <DatePicker
                label="Fecha Fin"
                value={filtros.fecha_fin ? dayjs(filtros.fecha_fin) : null}
                onChange={(newValue: Dayjs | null) => 
                  handleFiltroChange('fecha_fin', newValue?.format('YYYY-MM-DD'))
                }
                slotProps={{
                  textField: { fullWidth: true }
                }}
              />
            </Box>
          </Box>

          {/* Rangos de fecha rápidos */}
          <Box mt={3}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Rangos rápidos:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {Object.keys(obtenerRangosFecha()).map((rango) => (
                <Chip
                  key={rango}
                  label={rango}
                  variant="outlined"
                  size="small"
                  onClick={() => aplicarRangoFecha(rango)}
                  sx={{ cursor: 'pointer', mb: 1 }}
                />
              ))}
            </Stack>
          </Box>

          {/* Botones de acción */}
          <Box display="flex" gap={2} mt={3} justifyContent="flex-end">
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={limpiarFiltros}
              disabled={contarFiltrosActivos() === 0}
            >
              Limpiar
            </Button>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={aplicarFiltros}
            >
              Aplicar Filtros
            </Button>
          </Box>
        </CardContent>
      </Card>
    </LocalizationProvider>
  )
}

export default FiltrosReporte
