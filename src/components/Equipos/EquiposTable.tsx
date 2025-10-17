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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  TextField
} from '@mui/material'
import { Edit, Delete, Build, Info, Search, Clear } from '@mui/icons-material'
import { equipoService, type Equipo } from '../../services/equipoService'
import { laboratorioService, type Laboratorio } from '../../services/laboratorioService'

interface EquiposTableProps {
  onEdit?: (equipo: Equipo) => void
  onDelete?: (equipo: Equipo) => void
  refresh?: boolean
  onRefreshComplete?: () => void
  vistaSimple?: boolean
}

export const EquiposTable: React.FC<EquiposTableProps> = ({
  onEdit,
  onDelete,
  refresh,
  onRefreshComplete,
  vistaSimple = false
}) => {
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [selectedLaboratorio, setSelectedLaboratorio] = useState<number | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar datos
  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Cargar laboratorios para el filtro
      const laboratoriosResponse = await laboratorioService.getAll()
      setLaboratorios(laboratoriosResponse.data)

      // Cargar equipos
      let equiposResponse
      if (vistaSimple) {
        // Usar vista simple (sin agrupar)
        equiposResponse = await equipoService.getAllSimple()
      } else {
        // Usar vista normal (agrupada)
        if (selectedLaboratorio === 'all') {
          equiposResponse = await equipoService.getAll()
        } else {
          equiposResponse = await equipoService.getByLaboratorio(selectedLaboratorio)
        }
      }
      
      setEquipos(equiposResponse.data)
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

  // Efecto para recargar cuando cambia la vista
  useEffect(() => {
    loadData()
  }, [vistaSimple])

  // Efecto para recargar cuando cambia el laboratorio seleccionado
  useEffect(() => {
    if (laboratorios.length > 0) {
      loadData()
    }
  }, [selectedLaboratorio])

  // Función para obtener el color del estado
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Operativo': return 'success'
      case 'En Mantenimiento': return 'warning'
      case 'Fuera de Servicio': return 'error'
      default: return 'default'
    }
  }

  // Función para filtrar equipos por término de búsqueda
  const filteredEquipos = equipos.filter(equipo => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      (equipo.codigo && equipo.codigo.toLowerCase().includes(searchLower)) ||
      equipo.nombre.toLowerCase().includes(searchLower) ||
      (equipo.descripcion && equipo.descripcion.toLowerCase().includes(searchLower)) ||
      (equipo.marca && equipo.marca.toLowerCase().includes(searchLower)) ||
      (equipo.modelo && equipo.modelo.toLowerCase().includes(searchLower))
    )
  })

  // Función para limpiar búsqueda
  const handleClearSearch = () => {
    setSearchTerm('')
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
      {/* Filtros y búsqueda */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        {/* Primera fila: Filtro de laboratorio y resumen */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filtrar por Laboratorio</InputLabel>
              <Select
                value={selectedLaboratorio}
                label="Filtrar por Laboratorio"
                onChange={(e) => setSelectedLaboratorio(e.target.value as number | 'all')}
              >
                <MenuItem value="all">Todos los Laboratorios</MenuItem>
                {laboratorios.map((lab) => (
                  <MenuItem key={lab.id} value={lab.id}>
                    {lab.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          {/* Resumen de equipos */}
          {equipos.length > 0 && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Chip 
                label={`${filteredEquipos.length} de ${equipos.length} equipo${equipos.length !== 1 ? 's' : ''}`}
                color="primary"
                variant="outlined"
                size="small"
              />
              <Chip 
                label={`${equipos.filter(e => e.estado === 'Operativo').length} operativo${equipos.filter(e => e.estado === 'Operativo').length !== 1 ? 's' : ''}`}
                color="success"
                variant="outlined"
                size="small"
              />
              <Chip 
                label={`${equipos.filter(e => e.estado === 'En Mantenimiento').length} en mantenimiento`}
                color="warning"
                variant="outlined"
                size="small"
              />
              <Tooltip title="Verde: Disponible | Amarillo: Parcialmente disponible | Rojo: No disponible">
                <IconButton size="small" color="default">
                  <Info fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>

        {/* Segunda fila: Barra de búsqueda */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            placeholder="Buscar equipos por código, nombre, descripción, marca o modelo..."
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
              {filteredEquipos.length} resultado{filteredEquipos.length !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Tabla de equipos */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600, width: '6%' }}>Cod. Activo</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '15%' }}>Equipo</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '10%' }}>Tipo</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '10%' }}>Ubicación (Lab)</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '10%' }}>Marca/Modelo</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '8%' }}>N° Serie</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '7%' }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '10%' }}>Fecha Adq.</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '8%' }}>Último Mant.</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '8%' }}>Próximo Mant.</TableCell>
              {vistaSimple && (
                <>
                  <TableCell sx={{ fontWeight: 600, width: '8%' }}>Movimientos</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: '10%' }}>Laboratorios</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: '12%' }}>Comentarios</TableCell>
                </>
              )}
              <TableCell sx={{ fontWeight: 600, width: '3%' }} align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEquipos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={vistaSimple ? 14 : 11} align="center" sx={{ py: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Build sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No hay equipos registrados
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {searchTerm 
                        ? `No se encontraron equipos que coincidan con "${searchTerm}"`
                        : selectedLaboratorio === 'all' 
                          ? 'No se han registrado equipos en el sistema'
                          : 'No hay equipos registrados en este laboratorio'
                      }
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredEquipos.map((equipo) => (
                <TableRow key={equipo.id} hover>
                  <TableCell>
                    <Chip 
                      label={equipo.codigo || 'N/A'} 
                      size="small" 
                      color="primary"
                      variant="outlined"
                      sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Build color="primary" />
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {equipo.nombre}
                        </Typography>
                        {equipo.descripcion && (
                          <Typography variant="caption" color="text.secondary">
                            {equipo.descripcion}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={equipo.tipo_equipo_nombre || 'Sin tipo'}
                      size="small"
                      color={equipo.tipo_equipo_nombre ? 'default' : 'warning'}
                      variant="outlined"
                      sx={{ fontWeight: 500 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={equipo.laboratorio_nombre || 'Sin asignar'}
                      size="small"
                      color={equipo.laboratorio_nombre ? 'primary' : 'default'}
                      variant="outlined"
                      sx={{ fontWeight: 500 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {equipo.marca || 'Sin marca'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {equipo.modelo || 'Sin modelo'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {equipo.numero_serie || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={equipo.estado}
                      color={getEstadoColor(equipo.estado)}
                      variant="filled"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {equipo.fecha_adquisicion ? (
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {new Date(equipo.fecha_adquisicion).toLocaleDateString('es-ES')}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        N/A
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {equipo.fecha_ultimo_mantenimiento ? (
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {new Date(equipo.fecha_ultimo_mantenimiento).toLocaleDateString('es-ES')}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        No registrado
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {equipo.fecha_proximo_mantenimiento ? (
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {new Date(equipo.fecha_proximo_mantenimiento).toLocaleDateString('es-ES')}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        No programado
                      </Typography>
                    )}
                  </TableCell>
                  {vistaSimple && (
                    <>
                      <TableCell>
                        <Chip 
                          label={equipo.total_movimientos || 0}
                          color={equipo.total_movimientos && equipo.total_movimientos > 0 ? "primary" : "default"}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {equipo.laboratorios_asignados || 0} laboratorio(s)
                          </Typography>
                          {equipo.laboratorios_nombres && (
                            <Typography variant="caption" color="text.secondary">
                              {equipo.laboratorios_nombres}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {equipo.comentarios ? (
                          <Tooltip title={equipo.comentarios}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                maxWidth: 150,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                cursor: 'help'
                              }}
                            >
                              {equipo.comentarios}
                            </Typography>
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            Sin comentarios
                          </Typography>
                        )}
                      </TableCell>
                    </>
                  )}
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      {onEdit && (
                        <Tooltip title="Editar equipo">
                          <IconButton 
                            size="small" 
                            onClick={() => onEdit(equipo)}
                            color="primary"
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                      )}
                      {onDelete && (
                        <Tooltip title="Eliminar equipo">
                          <IconButton 
                            size="small" 
                            onClick={() => onDelete(equipo)}
                            color="error"
                          >
                            <Delete />
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
      {filteredEquipos.length > 0 && (
        <Box sx={{ p: 2, backgroundColor: 'grey.50', borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            Mostrando {filteredEquipos.length} de {equipos.length} equipo{equipos.length !== 1 ? 's' : ''}
            {selectedLaboratorio !== 'all' && laboratorios.length > 0 && (
              <> en {laboratorios.find(l => l.id === selectedLaboratorio)?.nombre}</>
            )}
            {searchTerm && (
              <> que coinciden con "{searchTerm}"</>
            )}
          </Typography>
        </Box>
      )}
    </Box>
  )
}
