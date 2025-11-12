import React from 'react'
import {
  Box,
  Typography,
  Chip,
  Alert,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material'
import { Inventory } from '@mui/icons-material'

interface InsumoRequerido {
  id: number
  nombre: string
  cantidad_usada: number
  unidad_medida?: string
  descripcion?: string
}

interface InsumosRequeridosListProps {
  insumos: InsumoRequerido[]
  insumosAgregados: number[]
  onInsumoClick: (insumo: InsumoRequerido) => void
}

export const InsumosRequeridosList: React.FC<InsumosRequeridosListProps> = ({
  insumos,
  insumosAgregados,
  onInsumoClick
}) => {
  return (
    <>
      {insumos.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            No se registraron insumos requeridos para este horario
          </Typography>
        </Alert>
      ) : (
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <List>
            {insumos.map((insumo, index) => {
              // Verificar si el insumo ya está agregado (puede tener múltiples lotes, pero solo se agrega una vez desde requeridos)
              const yaAgregado = insumosAgregados.includes(insumo.id)
              return (
                <React.Fragment key={insumo.id}>
                  <ListItemButton
                    onClick={() => onInsumoClick(insumo)}
                    disabled={yaAgregado}
                    sx={{ 
                      px: 0, 
                      py: 1.5,
                      opacity: yaAgregado ? 0.6 : 1,
                      '&:hover': {
                        bgcolor: yaAgregado ? 'transparent' : 'action.hover'
                      }
                    }}
                  >
                    <ListItemIcon>
                      <Inventory color={yaAgregado ? "disabled" : "action"} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {insumo.nombre}
                          </Typography>
                          <Chip 
                            label={`${insumo.cantidad_usada} ${insumo.unidad_medida || 'unidades'}`}
                            size="small"
                            color={yaAgregado ? "default" : "primary"}
                            variant="outlined"
                          />
                          {yaAgregado && (
                            <Chip 
                              label="Agregado"
                              size="small"
                              color="success"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        insumo.descripcion && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {insumo.descripcion}
                          </Typography>
                        )
                      }
                    />
                  </ListItemButton>
                  {index < insumos.length - 1 && <Divider />}
                </React.Fragment>
              )
            })}
          </List>
        </Box>
      )}
    </>
  )
}

