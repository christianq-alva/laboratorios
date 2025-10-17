import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Tooltip,
  Box,
  Typography
} from '@mui/material'
import { Edit, Delete, Category } from '@mui/icons-material'
import type { TipoEquipo } from '../../services/tipoEquipoService'

interface TiposEquipoTableProps {
  tipos: TipoEquipo[]
  onEdit: (tipo: TipoEquipo) => void
  onDelete: (tipo: TipoEquipo) => void
}

export const TiposEquipoTable: React.FC<TiposEquipoTableProps> = ({
  tipos,
  onEdit,
  onDelete
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (tipos.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        py: 8,
        color: 'text.secondary'
      }}>
        <Category sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
        <Typography variant="h6" gutterBottom>
          No hay tipos de equipo registrados
        </Typography>
        <Typography variant="body2">
          Crea el primer tipo de equipo para empezar
        </Typography>
      </Box>
    )
  }

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: 'primary.main' }}>
            <TableCell sx={{ color: 'white', fontWeight: 600 }}>ID</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Nombre</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Descripción</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Equipos</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Fecha Creación</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">
              Acciones
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tipos.map((tipo) => (
            <TableRow 
              key={tipo.id}
              sx={{ 
                '&:hover': { backgroundColor: 'action.hover' },
                '&:last-child td, &:last-child th': { border: 0 }
              }}
            >
              <TableCell>{tipo.id}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Category color="primary" fontSize="small" />
                  <Typography variant="body2" fontWeight={500}>
                    {tipo.nombre}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    maxWidth: 300, 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tipo.descripcion || '-'}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip 
                  label={tipo.count_equipos || 0}
                  color="default"
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              <TableCell>{formatDate(tipo.created_at)}</TableCell>
              <TableCell align="center">
                <Tooltip title="Editar">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => onEdit(tipo)}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDelete(tipo)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

