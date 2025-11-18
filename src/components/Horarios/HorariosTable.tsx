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
  LocationOn,
  CalendarMonth,
  AccessTime,
  Inventory,
  Group,
  Visibility,
} from '@mui/icons-material'
import { horarioService } from '../../services/horarioService'
import type { HorarioSimple } from '../../services/horarioService'
import { useApi } from '../../hooks/useApi'

interface HorariosTableProps {
  onEdit: (horario: HorarioSimple) => void
  onDelete: (horario: HorarioSimple) => void
  onView?: (horario: HorarioSimple) => void
  refresh: boolean
  onRefreshComplete: () => void
}

export const HorariosTable: React.FC<HorariosTableProps> = ({
  onEdit,
  onDelete,
  onView,
  refresh,
  onRefreshComplete,
}) => {
  const [horarios, setHorarios] = useState<HorarioSimple[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedHorario, setSelectedHorario] = useState<HorarioSimple | null>(null)
  const { execute } = useApi()
  const fetchHorarios = async () => {
    setLoading(true)
    setError(null)

    const result = await execute(() => horarioService.getAll())

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setHorarios(result.data.data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (horarios.length === 0) {
      fetchHorarios()
    }
  }, [])

  useEffect(() => {
    if (refresh) {
      fetchHorarios().then(() => {
        onRefreshComplete()
      })
    }
  }, [refresh])

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, horario: HorarioSimple) => {
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

  const handleView = () => {
    if (selectedHorario && onView) {
      onView(selectedHorario)
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
              <TableCell sx={{ fontWeight: 600 }}>Ciclo</TableCell>
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

                  {/* Ciclo */}
                  <TableCell>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Group fontSize="small" color="action" />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {horario.ciclo}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {horario.escuela}
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
                        badgeContent={horario.insumos_requeridos}
                        color="primary"
                        showZero
                      >
                        <Chip
                          label="Ver"
                          size="small"
                          variant="outlined"
                          sx={{ cursor: onView ? 'pointer' : 'default' }}
                          onClick={onView ? () => onView(horario) : undefined}
                        />
                      </Badge>
                    </Box>
                  </TableCell>

                  {/* Estado */}
                  <TableCell>
                    <Chip
                      label={horario.estado == 'C' ? "Cerrado" : "Programado"}
                      color={horario.estado == 'C' ? "default" : "success"}
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
        {onView && (
          <MenuItem onClick={handleView}>
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            <ListItemText>Ver detalles</ListItemText>
          </MenuItem>
        )}

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