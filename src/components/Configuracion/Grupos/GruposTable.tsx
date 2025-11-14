import React, { useState, useMemo } from 'react'
import {
  Paper,
  Chip,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material'
import { 
  Edit, 
  Delete, 
  Group, 
  Search, 
  School, 
  CalendarToday,
  ExpandMore,
  MoreVert
} from '@mui/icons-material'
import type { Grupo } from '../../../services/grupoService'

interface GruposTableProps {
  grupos: Grupo[]
  onEdit: (grupo: Grupo) => void
  onDelete: (grupo: Grupo) => void
}

interface GrupoAgrupado {
  escuela: string
  escuela_id: number
  ciclos: {
    ciclo: string
    ciclo_id: number
    grupos: Grupo[]
  }[]
}

export const GruposTable: React.FC<GruposTableProps> = ({
  grupos,
  onEdit,
  onDelete
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedEscuela, setExpandedEscuela] = useState<number | false>(false)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [selectedGrupo, setSelectedGrupo] = useState<Grupo | null>(null)

  // Filtrar grupos por término de búsqueda
  const filteredGrupos = useMemo(() => {
    if (!searchTerm) return grupos
    
    const searchLower = searchTerm.toLowerCase()
    return grupos.filter(grupo => (
      grupo.nombre.toLowerCase().includes(searchLower) ||
      (grupo.escuela && grupo.escuela.toLowerCase().includes(searchLower)) ||
      (grupo.ciclo && grupo.ciclo.toLowerCase().includes(searchLower))
    ))
  }, [grupos, searchTerm])

  // Agrupar grupos por Escuela y Ciclo
  const gruposAgrupados = useMemo(() => {
    const agrupados: Record<string, GrupoAgrupado> = {}

    filteredGrupos.forEach(grupo => {
      const escuelaKey = grupo.escuela || 'Sin Escuela'
      const escuelaId = grupo.escuela_id

      if (!agrupados[escuelaKey]) {
        agrupados[escuelaKey] = {
          escuela: escuelaKey,
          escuela_id: escuelaId,
          ciclos: []
        }
      }

      const cicloKey = grupo.ciclo || 'Sin Ciclo'
      const cicloId = grupo.ciclo_id
      let cicloGrupo = agrupados[escuelaKey].ciclos.find(c => c.ciclo === cicloKey)

      if (!cicloGrupo) {
        cicloGrupo = {
          ciclo: cicloKey,
          ciclo_id: cicloId,
          grupos: []
        }
        agrupados[escuelaKey].ciclos.push(cicloGrupo)
      }

      cicloGrupo.grupos.push(grupo)
    })

    // Ordenar ciclos dentro de cada escuela
    Object.values(agrupados).forEach(escuela => {
      escuela.ciclos.sort((a, b) => a.ciclo.localeCompare(b.ciclo))
    })

    return Object.values(agrupados).sort((a, b) => a.escuela.localeCompare(b.escuela))
  }, [filteredGrupos])

  const handleAccordionChange = (escuelaId: number) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedEscuela(isExpanded ? escuelaId : false)
  }

  const handleGrupoClick = (event: React.MouseEvent<HTMLElement>, grupo: Grupo) => {
    event.stopPropagation()
    setMenuAnchor(event.currentTarget)
    setSelectedGrupo(grupo)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
    setSelectedGrupo(null)
  }

  const handleEditClick = () => {
    if (selectedGrupo) {
      onEdit(selectedGrupo)
    }
    handleMenuClose()
  }

  const handleDeleteClick = () => {
    if (selectedGrupo) {
      onDelete(selectedGrupo)
    }
    handleMenuClose()
  }

  if (grupos.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        py: 8,
        color: 'text.secondary'
      }}>
        <Group sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
        <Typography variant="h6" gutterBottom>
          No hay grupos registrados
        </Typography>
        <Typography variant="body2">
          Crea el primer grupo para empezar
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Barra de búsqueda minimalista */}
      <TextField
        fullWidth
        placeholder="Buscar grupos..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" />
            </InputAdornment>
          )
        }}
        sx={{ mb: 3 }}
      />

      {/* Grupos agrupados por Escuela y Ciclo */}
      {gruposAgrupados.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No se encontraron grupos
          </Typography>
        </Box>
      ) : (
        <Box>
          {gruposAgrupados.map((escuelaData) => (
            <Accordion
              key={escuelaData.escuela_id}
              expanded={expandedEscuela === escuelaData.escuela_id}
              onChange={handleAccordionChange(escuelaData.escuela_id)}
              sx={{ 
                mb: 1.5,
                boxShadow: 'none',
                border: '1px solid',
                borderColor: 'divider',
                '&:before': { display: 'none' }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore />}
                sx={{
                  px: 2,
                  py: 1.5,
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                  <School fontSize="small" color="action" />
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {escuelaData.escuela}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                    {escuelaData.ciclos.reduce((sum, c) => sum + c.grupos.length, 0)} grupos
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2, py: 2 }}>
                <Box>
                  {escuelaData.ciclos.map((cicloData, cicloIndex) => (
                    <Box key={`${escuelaData.escuela_id}-${cicloData.ciclo_id}`} sx={{ mb: cicloIndex < escuelaData.ciclos.length - 1 ? 2 : 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <CalendarToday fontSize="small" color="action" />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {cicloData.ciclo}
                        </Typography>
                        <Chip
                          label={cicloData.grupos.length}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            height: 20,
                            fontSize: '0.7rem',
                            ml: 'auto'
                          }}
                        />
                      </Box>
                      <Grid container spacing={1}>
                        {cicloData.grupos.map((grupo) => (
                          <Grid item xs={12} sm={6} md={4} key={grupo.id}>
                            <Paper
                              variant="outlined"
                              onClick={(e) => handleGrupoClick(e, grupo)}
                              sx={{
                                p: 1.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'background-color 0.2s',
                                cursor: 'pointer',
                                '&:hover': {
                                  backgroundColor: 'action.hover'
                                }
                              }}
                            >
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {grupo.nombre}
                              </Typography>
                              <MoreVert fontSize="small" color="action" />
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* Menú de opciones */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleEditClick}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Eliminar</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  )
}

