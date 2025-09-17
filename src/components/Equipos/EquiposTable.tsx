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
  TextField,
  Button
} from '@mui/material'
import { Edit, Delete, Build, Info, Search, Clear } from '@mui/icons-material'
import { equipoService, type Equipo } from '../../services/equipoService'
import { laboratorioService, type Laboratorio } from '../../services/laboratorioService'

interface EquiposTableProps {
  onEdit?: (equipo: Equipo) => void
  onDelete?: (equipo: Equipo) => void
  refresh?: boolean
  onRefreshComplete?: () => void
}

export const EquiposTable: React.FC<EquiposTableProps> = ({
  onEdit,
  onDelete,
  refresh,
  onRefreshComplete
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
      if (selectedLaboratorio === 'all') {
        equiposResponse = await equipoService.getAll()
      } else {
        equiposResponse = await equipoService.getByLaboratorio(selectedLaboratorio)
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

  // Efecto para recargar cuando cambia el laboratorio seleccionado
  useEffect(() => {
    if (laboratorios.length > 0) {
      loadData()
    }
  }, [selectedLaboratorio])

  // Función para formatear el inventario por laboratorio
  const formatInventarioPorLaboratorio = (inventarioString?: string) => {
    if (!inventarioString) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Sin inventario registrado
          </Typography>
        </Box>
      )
    }
    
    const inventarios = inventarioString.split('; ').map(item => {
      const [lab, disponibleTotal] = item.split(':')
      const [disponible, total] = disponibleTotal.split('/')
      return { 
        laboratorio: lab, 
        disponible: parseInt(disponible) || 0, 
        total: parseInt(total) || 0 
      }
    })
    
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {inventarios.map((inv, index) => (
          <Box 
            key={index} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              p: 1,
              borderRadius: 1,
              bgcolor: 'grey.50',
              border: 1,
              borderColor: 'grey.200'
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
              {inv.laboratorio}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={`${inv.disponible}/${inv.total}`}
                size="small"
                color={getDisponibilidadColor(inv.disponible, inv.total)}
                variant="filled"
                sx={{ 
                  minWidth: 'auto',
                  '& .MuiChip-label': { px: 1 }
                }}
              />
              {inv.disponible === 0 && inv.total > 0 && (
                <Typography variant="caption" color="error" sx={{ fontWeight: 600 }}>
                  NO DISPONIBLE
                </Typography>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    )
  }

  // Función para obtener el color del chip según la disponibilidad
  const getDisponibilidadColor = (disponible: number, total: number) => {
    if (disponible === 0) return 'error'
    if (disponible < total * 0.5) return 'warning'
    return 'success'
  }

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
              <TableCell sx={{ fontWeight: 600, width: '10%' }}>Código</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '20%' }}>Equipo</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '15%' }}>Marca/Modelo</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '12%' }}>N° Serie</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '10%' }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '15%' }}>Disponibilidad</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '13%' }}>Inventario por Lab</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '5%' }} align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEquipos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
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
                    {equipo.cantidad_disponible !== undefined && equipo.cantidad_total !== undefined ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label={`${equipo.cantidad_disponible}/${equipo.cantidad_total}`}
                          color={getDisponibilidadColor(equipo.cantidad_disponible, equipo.cantidad_total)}
                          variant="filled"
                          size="small"
                        />
                        {equipo.cantidad_en_uso && equipo.cantidad_en_uso > 0 && (
                          <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
                            {equipo.cantidad_en_uso} EN USO
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        No disponible
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatInventarioPorLaboratorio(equipo.inventario_por_laboratorio)}
                  </TableCell>
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
