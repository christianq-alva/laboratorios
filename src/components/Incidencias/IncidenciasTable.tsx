import React, { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  TextField
} from '@mui/material'
import {
  Visibility,
  ReportProblem,
  Search,
  Clear,
  Schedule,
  Person,
  LocationOn,
  CalendarToday
} from '@mui/icons-material'
import { incidenciaService, type Incidencia } from '../../services/incidenciaService'
import dayjs from 'dayjs'

interface IncidenciasTableProps {
  onView?: (incidencia: Incidencia) => void
  refresh?: boolean
  onRefreshComplete?: () => void
}

export const IncidenciasTable: React.FC<IncidenciasTableProps> = ({
  onView,
  refresh,
  onRefreshComplete
}) => {
  const [incidencias, setIncidencias] = useState<Incidencia[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar datos
  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await incidenciaService.getAll()
      if (response.success) {
        setIncidencias(response.data)
      } else {
        setError(response.message || 'Error al cargar incidencias')
      }
    } catch (err: any) {
      setError(err.message)
      console.error('Error al cargar datos:', err)
    } finally {
      setLoading(false)
      onRefreshComplete?.()
    }
  }

  // Efecto para cargar datos iniciales
  useEffect(() => {
    loadData()
  }, [])

  // Efecto para refrescar cuando cambia el refresh prop
  useEffect(() => {
    if (refresh !== undefined) {
      loadData()
    }
  }, [refresh])

  // Función para filtrar incidencias por término de búsqueda
  const filteredIncidencias = incidencias.filter(incidencia => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      incidencia.titulo.toLowerCase().includes(searchLower) ||
      incidencia.descripcion.toLowerCase().includes(searchLower) ||
      incidencia.laboratorio.toLowerCase().includes(searchLower) ||
      incidencia.docente.toLowerCase().includes(searchLower) ||
      incidencia.reportado_por.toLowerCase().includes(searchLower)
    )
  })

  // Función para limpiar búsqueda
  const handleClearSearch = () => {
    setSearchTerm('')
  }

  // Función para formatear fecha
  const formatFecha = (fecha: string) => {
    return dayjs(fecha).format('DD/MM/YYYY HH:mm')
  }

  // Función para obtener el color del chip según la fecha
  const getFechaColor = (fecha: string) => {
    const fechaIncidencia = dayjs(fecha)
    const ahora = dayjs()
    const diferencia = ahora.diff(fechaIncidencia, 'day')
    
    if (diferencia <= 1) return 'error' // Últimas 24 horas
    if (diferencia <= 7) return 'warning' // Última semana
    return 'default' // Más antigua
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    )
  }

  return (
    <Box>
      {/* Barra de búsqueda */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReportProblem color="primary" />
            Incidencias Reportadas
          </Typography>
          
          {/* Resumen de incidencias */}
          {incidencias.length > 0 && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Chip 
                label={`${filteredIncidencias.length} de ${incidencias.length} incidencia${incidencias.length !== 1 ? 's' : ''}`}
                color="primary"
                variant="outlined"
                size="small"
              />
              <Chip 
                label={`${incidencias.filter(i => dayjs().diff(dayjs(i.fecha_reporte), 'day') <= 1).length} recientes`}
                color="error"
                variant="outlined"
                size="small"
              />
            </Box>
          )}
        </Box>

        {/* Barra de búsqueda */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            placeholder="Buscar incidencias por título, descripción, laboratorio, docente..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <Search sx={{ color: 'text.secondary', mr: 1 }} />
              ),
              endAdornment: searchTerm && (
                <IconButton
                  size="small"
                  onClick={handleClearSearch}
                  sx={{ color: 'text.secondary' }}
                >
                  <Clear />
                </IconButton>
              )
            }}
          />
          {searchTerm && (
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              {filteredIncidencias.length} resultado{filteredIncidencias.length !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Tabla de incidencias */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600, width: '25%' }}>Título</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '15%' }}>Laboratorio</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '15%' }}>Docente</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '15%' }}>Fecha Clase</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '15%' }}>Fecha Reporte</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '10%' }}>Reportado Por</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '5%' }} align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredIncidencias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <ReportProblem sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No hay incidencias registradas
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {searchTerm 
                        ? `No se encontraron incidencias que coincidan con "${searchTerm}"`
                        : 'No se han reportado incidencias en el sistema'
                      }
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredIncidencias.map((incidencia) => (
                <TableRow key={incidencia.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ReportProblem color="error" fontSize="small" />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                          {incidencia.titulo}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {incidencia.descripcion}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="body2">
                        {incidencia.laboratorio}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person fontSize="small" color="action" />
                      <Typography variant="body2">
                        {incidencia.docente}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Schedule fontSize="small" color="action" />
                      <Typography variant="body2">
                        {formatFecha(incidencia.fecha_clase)}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Chip 
                      label={formatFecha(incidencia.fecha_reporte)}
                      color={getFechaColor(incidencia.fecha_reporte)}
                      size="small"
                      variant="outlined"
                      icon={<CalendarToday fontSize="small" />}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {incidencia.reportado_por}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      {onView && (
                        <Tooltip title="Ver detalles">
                          <IconButton 
                            size="small" 
                            onClick={() => onView(incidencia)}
                            color="primary"
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Información adicional */}
      {filteredIncidencias.length > 0 && (
        <Box sx={{ p: 2, backgroundColor: 'grey.50', borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            Mostrando {filteredIncidencias.length} de {incidencias.length} incidencia{incidencias.length !== 1 ? 's' : ''}
            {searchTerm && (
              <> que coinciden con "{searchTerm}"</>
            )}
          </Typography>
        </Box>
      )}
    </Box>
  )
} 