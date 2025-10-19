import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Button,
  TablePagination
} from '@mui/material'
import {
  Edit,
  Refresh,
  Inventory,
  Add
} from '@mui/icons-material'
import { insumoService } from '../../services/insumoService'
import { laboratorioService } from '../../services/laboratorioService'
import { ConfigStockMinimoDialog } from '../Insumos/ConfigStockMinimoDialog'

interface Laboratorio {
  id: number
  nombre: string
}

interface InsumoConfig {
  insumo_id: number
  insumo_codigo: string
  insumo_nombre: string
  categoria: string
  unidad_medida: string
  stock_actual: number
  stock_minimo: number
  stock_maximo: number | null
  punto_reorden: number | null
  observaciones: string | null
  estado_stock: 'SIN_CONFIGURAR' | 'AGOTADO' | 'BAJO' | 'REORDENAR' | 'EXCESO' | 'NORMAL'
  diferencia_minimo: number
}

export const ConfigStockTable: React.FC = () => {
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [laboratorioSeleccionado, setLaboratorioSeleccionado] = useState<number | ''>('')
  const [insumos, setInsumos] = useState<InsumoConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  
  // Estados para el diálogo de configuración
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [insumoParaConfigurar, setInsumoParaConfigurar] = useState<InsumoConfig | null>(null)

  // Cargar laboratorios al montar
  useEffect(() => {
    loadLaboratorios()
  }, [])

  // Cargar insumos cuando se selecciona un laboratorio
  useEffect(() => {
    if (laboratorioSeleccionado) {
      loadInsumosConfig()
    } else {
      setInsumos([])
    }
  }, [laboratorioSeleccionado])

  const loadLaboratorios = async () => {
    try {
      const response = await laboratorioService.getAll()
      if (response.success && response.data) {
        setLaboratorios(response.data)
        // Seleccionar el primer laboratorio por defecto
        if (response.data.length > 0) {
          setLaboratorioSeleccionado(response.data[0].id)
        }
      }
    } catch (error) {
      console.error('Error al cargar laboratorios:', error)
    }
  }

  const loadInsumosConfig = async () => {
    if (!laboratorioSeleccionado) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Obtener todos los insumos del laboratorio con su stock actual
      const response = await insumoService.getAll()
      
      if (response.success && response.data) {
        // Filtrar y transformar los datos para este laboratorio
        const insumosDelLab: InsumoConfig[] = []
        
        for (const insumo of response.data) {
          // Obtener el stock actual y configuración para este laboratorio
          try {
            const stockResponse = await insumoService.getStockActual(insumo.id, laboratorioSeleccionado as number)
            
            if (stockResponse.success) {
              const stock = stockResponse.data
              
              // Obtener configuración de stock mínimo si existe
              const configResponse = await insumoService.getConfiguracionStock(insumo.id)
              const config = configResponse.success 
                ? configResponse.data.find(c => c.laboratorio_id === laboratorioSeleccionado)
                : undefined
              
              const stockActual = stock.stock_actual || 0
              const stockMinimo = config?.stock_minimo || 0
              const diferenciaMinimo = stockActual - stockMinimo
              
              // Determinar estado
              let estado: InsumoConfig['estado_stock'] = 'SIN_CONFIGURAR'
              if (config) {
                if (stockActual === 0) {
                  estado = 'AGOTADO'
                } else if (stockActual < stockMinimo) {
                  estado = 'BAJO'
                } else if (config.punto_reorden && stockActual <= config.punto_reorden) {
                  estado = 'REORDENAR'
                } else if (config.stock_maximo && stockActual > config.stock_maximo) {
                  estado = 'EXCESO'
                } else {
                  estado = 'NORMAL'
                }
              }
              
              insumosDelLab.push({
                insumo_id: insumo.id,
                insumo_codigo: insumo.codigo,
                insumo_nombre: insumo.nombre,
                categoria: insumo.categoria,
                unidad_medida: insumo.unidad_medida,
                stock_actual: stockActual,
                stock_minimo: stockMinimo,
                stock_maximo: config?.stock_maximo || null,
                punto_reorden: config?.punto_reorden || null,
                observaciones: config?.observaciones || null,
                estado_stock: estado,
                diferencia_minimo: diferenciaMinimo
              })
            }
          } catch (error) {
            console.error(`Error al obtener stock del insumo ${insumo.id}:`, error)
          }
        }
        
        // Ordenar: primero los configurados con problemas, luego los normales, luego sin configurar
        insumosDelLab.sort((a, b) => {
          const prioridad = { 'AGOTADO': 1, 'BAJO': 2, 'REORDENAR': 3, 'EXCESO': 4, 'NORMAL': 5, 'SIN_CONFIGURAR': 6 }
          return prioridad[a.estado_stock] - prioridad[b.estado_stock]
        })
        
        setInsumos(insumosDelLab)
      }
    } catch (error: any) {
      setError(error.message || 'Error al cargar configuraciones')
      console.error('Error al cargar insumos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleOpenConfigDialog = (insumo: InsumoConfig) => {
    setInsumoParaConfigurar(insumo)
    setConfigDialogOpen(true)
  }

  const handleCloseConfigDialog = () => {
    setConfigDialogOpen(false)
    setInsumoParaConfigurar(null)
  }

  const handleConfigSuccess = () => {
    loadInsumosConfig()
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'AGOTADO':
        return 'error'
      case 'BAJO':
        return 'warning'
      case 'REORDENAR':
        return 'info'
      case 'EXCESO':
        return 'secondary'
      case 'NORMAL':
        return 'success'
      case 'SIN_CONFIGURAR':
        return 'default'
      default:
        return 'default'
    }
  }

  const getEstadoLabel = (estado: string, observaciones?: string | null) => {
    const labels = {
      'AGOTADO': '⚠️ AGOTADO',
      'BAJO': '⚠️ BAJO',
      'REORDENAR': '⚡ Reordenar',
      'EXCESO': '📦 Exceso',
      'NORMAL': '✅ Normal',
      'SIN_CONFIGURAR': '⚙️ Sin configurar'
    }
    
    const label = labels[estado as keyof typeof labels] || estado
    
    if (observaciones && estado === 'NORMAL') {
      return (
        <Box>
          <Typography variant="body2">{label}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            {observaciones}
          </Typography>
        </Box>
      )
    }
    
    return label
  }

  const paginatedInsumos = insumos.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  // Estadísticas
  const stats = {
    total: insumos.length,
    configurados: insumos.filter(i => i.estado_stock !== 'SIN_CONFIGURAR').length,
    sinConfigurar: insumos.filter(i => i.estado_stock === 'SIN_CONFIGURAR').length,
    agotados: insumos.filter(i => i.estado_stock === 'AGOTADO').length,
    bajos: insumos.filter(i => i.estado_stock === 'BAJO').length,
    reordenar: insumos.filter(i => i.estado_stock === 'REORDENAR').length
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          Configuración de Stock Mínimo por Laboratorio
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadInsumosConfig}
          disabled={!laboratorioSeleccionado || loading}
        >
          Actualizar
        </Button>
      </Box>

      {/* Selector de Laboratorio */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <FormControl fullWidth>
          <InputLabel>Laboratorio</InputLabel>
          <Select
            value={laboratorioSeleccionado}
            label="Laboratorio"
            onChange={(e) => setLaboratorioSeleccionado(e.target.value as number)}
            disabled={loading}
          >
            {laboratorios.map((lab) => (
              <MenuItem key={lab.id} value={lab.id}>
                {lab.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Estadísticas rápidas */}
        {laboratorioSeleccionado && !loading && (
          <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
            <Chip label={`Total: ${stats.total}`} variant="outlined" />
            <Chip label={`Configurados: ${stats.configurados}`} color="primary" variant="outlined" />
            <Chip label={`Sin configurar: ${stats.sinConfigurar}`} color="default" variant="outlined" />
            {stats.agotados > 0 && <Chip label={`Agotados: ${stats.agotados}`} color="error" />}
            {stats.bajos > 0 && <Chip label={`Stock bajo: ${stats.bajos}`} color="warning" />}
            {stats.reordenar > 0 && <Chip label={`Reordenar: ${stats.reordenar}`} color="info" />}
          </Box>
        )}
      </Paper>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Mensaje cuando no hay laboratorio seleccionado */}
      {!laboratorioSeleccionado && !loading && (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <Inventory sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Selecciona un laboratorio
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Elige un laboratorio para ver y configurar el stock mínimo de sus insumos
          </Typography>
        </Paper>
      )}

      {/* Tabla */}
      {laboratorioSeleccionado && !loading && insumos.length > 0 && (
        <Paper sx={{ borderRadius: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Código</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Insumo</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }} align="right">Stock Actual</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }} align="right">Stock Mínimo</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }} align="right">Punto Reorden</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Estado</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedInsumos.map((insumo) => (
                  <TableRow 
                    key={insumo.insumo_id}
                    sx={{ 
                      '&:hover': { bgcolor: 'action.hover' },
                      bgcolor: insumo.estado_stock === 'AGOTADO' ? '#ffebee' : 'inherit'
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {insumo.insumo_codigo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {insumo.insumo_nombre}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {insumo.categoria}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        {insumo.stock_actual} {insumo.unidad_medida}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {insumo.stock_minimo > 0 ? (
                        <Typography variant="body2">
                          {insumo.stock_minimo} {insumo.unidad_medida}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No configurado
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {insumo.punto_reorden ? (
                        <Typography variant="body2">
                          {insumo.punto_reorden} {insumo.unidad_medida}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getEstadoLabel(insumo.estado_stock, insumo.observaciones)}
                        color={getEstadoColor(insumo.estado_stock)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title={insumo.estado_stock === 'SIN_CONFIGURAR' ? 'Configurar stock mínimo' : 'Editar configuración'}>
                          <IconButton
                            size="small"
                            color={insumo.estado_stock === 'SIN_CONFIGURAR' ? 'primary' : 'secondary'}
                            onClick={() => handleOpenConfigDialog(insumo)}
                          >
                            {insumo.estado_stock === 'SIN_CONFIGURAR' ? <Add /> : <Edit />}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={insumos.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
          />
        </Paper>
      )}

      {/* Diálogo de Configuración */}
      {insumoParaConfigurar && (
        <ConfigStockMinimoDialog
          open={configDialogOpen}
          onClose={handleCloseConfigDialog}
          insumoId={insumoParaConfigurar.insumo_id}
          insumoNombre={insumoParaConfigurar.insumo_nombre}
          preselectedLaboratorioId={laboratorioSeleccionado as number}
          onSuccess={handleConfigSuccess}
        />
      )}
    </Box>
  )
}

