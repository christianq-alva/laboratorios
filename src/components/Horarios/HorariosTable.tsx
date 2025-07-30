import React, { useState, useEffect } from 'react'
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Tooltip,
  Badge,
} from '@mui/material'
import {
  MoreVert,
  Edit,
  Delete,
  Schedule,
  Person,
  School,
  LocationOn,
  CalendarMonth,
  AccessTime,
  Inventory,
  Group,
} from '@mui/icons-material'
import { horarioService } from '../../services/horarioService'
import type { Horario } from '../../services/horarioService'

interface HorariosTableProps {
  onEdit: (horario: Horario) => void
  onDelete: (horario: Horario) => void
  refresh: boolean
  onRefreshComplete: () => void
}

export const HorariosTable: React.FC<HorariosTableProps> = ({
  onEdit,
  onDelete,
  refresh,
  onRefreshComplete,
}) => {
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedHorario, setSelectedHorario] = useState<Horario | null>(null)

  const fetchHorarios = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Iniciando fetchHorarios...')
      const result = await horarioService.getAll()
      console.log('🔍 Respuesta completa del servidor:', result)
      
      if (result.success) {
        console.log('📋 Horarios recibidos en frontend:', {
          total: result.data?.length || 0,
          primer_horario: result.data?.[0] ? {
            id: result.data[0].id,
            laboratorio: result.data[0].laboratorio,
            docente: result.data[0].docente,
            grupo: result.data[0].grupo,
            escuela: result.data[0].escuela,
            ciclo: result.data[0].ciclo,
            insumos_count: result.data[0].insumos?.length || 0
          } : null,
          user_role: result.user_role,
          laboratorios_asignados: result.laboratorios_asignados
        })
        setHorarios(result.data || [])
      } else {
        console.error('❌ Error en respuesta:', result.message)
        setError(result.message || 'Error al cargar horarios')
      }
    } catch (err: any) {
      console.error('❌ Error de conexión:', err)
      setError('Error de conexión al servidor')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHorarios()
  }, [])

  useEffect(() => {
    if (refresh) {
      fetchHorarios().then(() => {
        onRefreshComplete()
      })
    }
  }, [refresh])

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, horario: Horario) => {
    setAnchorEl(event.currentTarget)
    setSelectedHorario(horario)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedHorario(null)
  }

  const handleEdit = () => {
    if (selectedHorario) {
      onEdit(selectedHorario)
    }
    handleMenuClose()
  }

  const handleDelete = () => {
    if (selectedHorario) {
      onDelete(selectedHorario)
    }
    handleMenuClose()
  }

  // Formatear fecha y hora
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    )
  }

  if (horarios.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Schedule sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No hay horarios registrados
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Crea el primer horario usando el botón "Nuevo Horario"
        </Typography>
      </Box>
    )
  }

  return (
    <>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600 }}>Laboratorio</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Docente</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Fecha & Hora</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Grupo</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Descripción</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Insumos</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {horarios.map((horario) => {
              const fechaInicio = formatDateTime(horario.fecha_inicio)
              const fechaFin = formatDateTime(horario.fecha_fin)
              const isActive = new Date(horario.fecha_fin) > new Date()
              
              return (
                <TableRow key={horario.id} hover>
                  {/* Laboratorio */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn fontSize="small" color="primary" />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {horario.laboratorio}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {horario.laboratorio_id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Docente */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person fontSize="small" color="action" />
                      <Typography variant="body2">
                        {horario.docente}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Fecha & Hora */}
                  <TableCell>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <CalendarMonth fontSize="small" color="action" />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {fechaInicio.date}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTime fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {fechaInicio.time} - {fechaFin.time}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Grupo */}
                  <TableCell>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Group fontSize="small" color="action" />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {horario.grupo}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {horario.escuela} • {horario.ciclo}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Descripción */}
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={horario.descripcion}
                    >
                      {horario.descripcion}
                    </Typography>
                  </TableCell>

                  {/* Insumos */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Inventory fontSize="small" color="action" />
                      <Badge 
                        badgeContent={horario.insumos?.length || 0} 
                        color="primary"
                        showZero
                      >
                        <Chip 
                          label="Ver" 
                          size="small" 
                          variant="outlined"
                          sx={{ cursor: 'pointer' }}
                        />
                      </Badge>
                    </Box>
                  </TableCell>

                  {/* Estado */}
                  <TableCell>
                    <Chip 
                      label={isActive ? "Activo" : "Finalizado"}
                      color={isActive ? "success" : "default"}
                      size="small" 
                      variant="outlined" 
                    />
                  </TableCell>

                  {/* Acciones */}
                  <TableCell align="center">
                    <Tooltip title="Más opciones">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, horario)}
                        sx={{ color: 'grey.600' }}
                      >
                        <MoreVert />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Menú contextual */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { boxShadow: 3, borderRadius: 2 }
        }}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar horario</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Eliminar horario</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
} 