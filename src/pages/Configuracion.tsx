import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material'
import { Add, Category, Person, LibraryBooks, Edit, School } from '@mui/icons-material'
import { TiposEquipoTable } from '../components/Configuracion/TiposEquipoTable'
import { TipoEquipoForm } from '../components/Configuracion/TipoEquipoForm'
import { DocentesTable } from '../components/Docentes/DocentesTable'
import { DocenteForm } from '../components/Docentes/DocenteForm'
import { InsumoForm } from '../components/Insumos/InsumoForm'
import { LaboratoriosTable } from '../components/Laboratorios/LaboratoriosTable'
import { LaboratorioForm } from '../components/Laboratorios/LaboratorioForm'
import { tipoEquipoService, type TipoEquipo } from '../services/tipoEquipoService'
import { docenteService, type Docente } from '../services/docenteService'
import { insumoService, type Insumo } from '../services/insumoService'
import { laboratorioService, type Laboratorio } from '../services/laboratorioService'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

export const Configuracion: React.FC = () => {
  const [tabValue, setTabValue] = useState(0)
  
  // Estado para Tipos de Equipo
  const [tiposEquipo, setTiposEquipo] = useState<TipoEquipo[]>([])
  const [loadingTipos, setLoadingTipos] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingTipo, setEditingTipo] = useState<TipoEquipo | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tipoToDelete, setTipoToDelete] = useState<TipoEquipo | null>(null)
  
  // Estado para Docentes
  const [docenteFormOpen, setDocenteFormOpen] = useState(false)
  const [editingDocente, setEditingDocente] = useState<Docente | null>(null)
  const [docenteDeleteDialogOpen, setDocenteDeleteDialogOpen] = useState(false)
  const [docenteToDelete, setDocenteToDelete] = useState<Docente | null>(null)
  const [refreshDocentes, setRefreshDocentes] = useState(false)
  
  // Estado para Catálogo de Insumos
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [loadingInsumos, setLoadingInsumos] = useState(false)
  const [insumoFormOpen, setInsumoFormOpen] = useState(false)
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null)
  
  // Estado para Laboratorios
  const [laboratorioFormOpen, setLaboratorioFormOpen] = useState(false)
  const [editingLaboratorio, setEditingLaboratorio] = useState<Laboratorio | null>(null)
  const [laboratorioDeleteDialogOpen, setLaboratorioDeleteDialogOpen] = useState(false)
  const [laboratorioToDelete, setLaboratorioToDelete] = useState<Laboratorio | null>(null)
  const [refreshLaboratorios, setRefreshLaboratorios] = useState(0)
  
  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning'
  })

  // Cargar tipos de equipo
  const loadTiposEquipo = async () => {
    setLoadingTipos(true)
    try {
      console.log('🔄 Cargando tipos de equipo...')
      const response = await tipoEquipoService.getAll()
      console.log('📦 Response:', response)
      
      if (!response || !response.data) {
        console.error('❌ Response inválida:', response)
        throw new Error('Respuesta inválida del servidor')
      }
      
      console.log('📊 Tipos recibidos:', response.data.length)
      
      // Obtener el conteo de equipos para cada tipo
      const tiposConConteo = await Promise.all(
        response.data.map(async (tipo) => {
          try {
            const countResponse = await tipoEquipoService.countEquipos(tipo.id)
            return { ...tipo, count_equipos: countResponse.data.count }
          } catch (err) {
            console.warn('⚠️ Error al contar equipos para tipo', tipo.id, err)
            return { ...tipo, count_equipos: 0 }
          }
        })
      )
      
      console.log('✅ Tipos con conteo:', tiposConConteo)
      setTiposEquipo(tiposConConteo)
    } catch (error: any) {
      console.error('❌ Error al cargar tipos de equipo:', error)
      console.error('❌ Error details:', error.response?.data)
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error al cargar tipos de equipo',
        severity: 'error'
      })
    } finally {
      setLoadingTipos(false)
    }
  }

  // Cargar catálogo de insumos
  const loadCatalogoInsumos = async () => {
    setLoadingInsumos(true)
    try {
      const response = await insumoService.getAll()
      setInsumos(response.data || [])
    } catch (error) {
      console.error('Error al cargar catálogo de insumos:', error)
      setSnackbar({
        open: true,
        message: 'Error al cargar catálogo de insumos',
        severity: 'error'
      })
    } finally {
      setLoadingInsumos(false)
    }
  }

  // Cargar datos al montar o cambiar de tab
  useEffect(() => {
    if (tabValue === 0) {
      loadTiposEquipo()
    } else if (tabValue === 2) {
      loadCatalogoInsumos()
    }
  }, [tabValue])

  // Handlers para Tipos de Equipo
  const handleOpenForm = () => {
    setEditingTipo(null)
    setFormOpen(true)
  }

  const handleEditTipo = (tipo: TipoEquipo) => {
    setEditingTipo(tipo)
    setFormOpen(true)
  }

  const handleCloseForm = () => {
    setFormOpen(false)
    setEditingTipo(null)
  }

  const handleFormSuccess = () => {
    loadTiposEquipo()
    setSnackbar({
      open: true,
      message: editingTipo ? 'Tipo actualizado exitosamente' : 'Tipo creado exitosamente',
      severity: 'success'
    })
  }

  const handleDeleteClick = (tipo: TipoEquipo) => {
    setTipoToDelete(tipo)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!tipoToDelete) return

    try {
      await tipoEquipoService.delete(tipoToDelete.id)
      setSnackbar({
        open: true,
        message: 'Tipo eliminado exitosamente',
        severity: 'success'
      })
      loadTiposEquipo()
    } catch (error: any) {
      console.error('Error al eliminar tipo:', error)
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error al eliminar tipo de equipo',
        severity: 'error'
      })
    } finally {
      setDeleteDialogOpen(false)
      setTipoToDelete(null)
    }
  }

  // Handlers para Docentes
  const handleOpenDocenteForm = () => {
    setEditingDocente(null)
    setDocenteFormOpen(true)
  }

  const handleEditDocente = (docente: Docente) => {
    setEditingDocente(docente)
    setDocenteFormOpen(true)
  }

  const handleCloseDocenteForm = () => {
    setDocenteFormOpen(false)
    setEditingDocente(null)
  }

  const handleDocenteFormSuccess = () => {
    setRefreshDocentes(true)
    setSnackbar({
      open: true,
      message: editingDocente ? 'Docente actualizado exitosamente' : 'Docente creado exitosamente',
      severity: 'success'
    })
  }

  const handleDeleteDocenteClick = (docente: Docente) => {
    setDocenteToDelete(docente)
    setDocenteDeleteDialogOpen(true)
  }

  const handleDeleteDocenteConfirm = async () => {
    if (!docenteToDelete) return

    try {
      await docenteService.delete(docenteToDelete.id)
      setSnackbar({
        open: true,
        message: 'Docente eliminado exitosamente',
        severity: 'success'
      })
      setRefreshDocentes(true)
    } catch (error: any) {
      console.error('Error al eliminar docente:', error)
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error al eliminar docente',
        severity: 'error'
      })
    } finally {
      setDocenteDeleteDialogOpen(false)
      setDocenteToDelete(null)
    }
  }

  // Handlers para Catálogo de Insumos
  const handleOpenInsumoForm = () => {
    setEditingInsumo(null)
    setInsumoFormOpen(true)
  }

  const handleEditInsumo = (insumo: Insumo) => {
    setEditingInsumo(insumo)
    setInsumoFormOpen(true)
  }

  const handleCloseInsumoForm = () => {
    setInsumoFormOpen(false)
    setEditingInsumo(null)
  }

  const handleInsumoFormSuccess = () => {
    loadCatalogoInsumos()
    setSnackbar({
      open: true,
      message: editingInsumo ? 'Insumo actualizado exitosamente' : 'Insumo creado exitosamente',
      severity: 'success'
    })
  }

  // Handlers para Laboratorios
  const handleOpenLaboratorioForm = () => {
    setEditingLaboratorio(null)
    setLaboratorioFormOpen(true)
  }

  const handleEditLaboratorio = (laboratorio: Laboratorio) => {
    setEditingLaboratorio(laboratorio)
    setLaboratorioFormOpen(true)
  }

  const handleCloseLaboratorioForm = () => {
    setLaboratorioFormOpen(false)
    setEditingLaboratorio(null)
  }

  const handleLaboratorioFormSuccess = () => {
    setRefreshLaboratorios(prev => prev + 1)
    setSnackbar({
      open: true,
      message: editingLaboratorio ? 'Laboratorio actualizado exitosamente' : 'Laboratorio creado exitosamente',
      severity: 'success'
    })
  }

  const handleDeleteLaboratorioClick = (laboratorio: Laboratorio) => {
    setLaboratorioToDelete(laboratorio)
    setLaboratorioDeleteDialogOpen(true)
  }

  const handleChangeLaboratorioStatus = async (laboratorio: Laboratorio, estado: 'Activo' | 'En Mantenimiento' | 'Inhabilitado' | 'Baja') => {
    try {
      const result = await laboratorioService.changeStatus(laboratorio.id, estado)
      
      if (result.success) {
        setRefreshLaboratorios(prev => prev + 1)
        setSnackbar({
          open: true,
          message: `Estado cambiado a "${estado}" correctamente`,
          severity: 'success'
        })
      } else {
        setSnackbar({
          open: true,
          message: result.message || 'Error al cambiar el estado',
          severity: 'error'
        })
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error de conexión al cambiar el estado',
        severity: 'error'
      })
    }
  }

  const handleDeleteLaboratorioConfirm = async () => {
    if (!laboratorioToDelete) return

    try {
      const result = await laboratorioService.delete(laboratorioToDelete.id)
      
      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Laboratorio eliminado exitosamente',
          severity: 'success'
        })
        setRefreshLaboratorios(prev => prev + 1)
      } else {
        setSnackbar({
          open: true,
          message: result.message || 'Error al eliminar el laboratorio',
          severity: 'error'
        })
      }
    } catch (error: any) {
      console.error('Error al eliminar laboratorio:', error)
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error al eliminar laboratorio',
        severity: 'error'
      })
    } finally {
      setLaboratorioDeleteDialogOpen(false)
      setLaboratorioToDelete(null)
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }
  
  const getCategoriaColor = (categoria?: string) => {
    switch (categoria) {
      case 'Reactivos': return '#ff9800'
      case 'Materiales': return '#2196f3'
      case 'Material_Biologico': return '#4caf50'
      default: return '#9e9e9e'
    }
  }

  return (
    <Box>
      {/* Encabezado */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
            Configuración
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestión de tablas maestras y configuraciones del sistema
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={(_, newValue) => setTabValue(newValue)}
            aria-label="configuración tabs"
            sx={{ px: 2 }}
          >
            <Tab 
              icon={<Category />} 
              iconPosition="start" 
              label="Tipos de Equipo" 
              id="config-tab-0"
              aria-controls="config-tabpanel-0"
            />
            <Tab 
              icon={<Person />} 
              iconPosition="start" 
              label="Docentes" 
              id="config-tab-1"
              aria-controls="config-tabpanel-1"
            />
            <Tab 
              icon={<LibraryBooks />} 
              iconPosition="start" 
              label="Catálogo de Insumos" 
              id="config-tab-2"
              aria-controls="config-tabpanel-2"
            />
            <Tab 
              icon={<School />} 
              iconPosition="start" 
              label="Laboratorios" 
              id="config-tab-3"
              aria-controls="config-tabpanel-3"
            />
          </Tabs>
        </Box>

        {/* Tab Panel: Tipos de Equipo */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ px: 3 }}>
            {/* Header con botón */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 3
            }}>
              <Typography variant="h6" fontWeight={600}>
                Gestión de Tipos de Equipo
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleOpenForm}
              >
                Nuevo Tipo
              </Button>
            </Box>

            {/* Tabla */}
            {loadingTipos ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TiposEquipoTable
                tipos={tiposEquipo}
                onEdit={handleEditTipo}
                onDelete={handleDeleteClick}
              />
            )}
          </Box>
        </TabPanel>

        {/* Tab Panel: Docentes */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ px: 3 }}>
            {/* Header con botón */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 3
            }}>
              <Typography variant="h6" fontWeight={600}>
                Gestión de Docentes
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleOpenDocenteForm}
              >
                Nuevo Docente
              </Button>
            </Box>

            {/* Tabla */}
            <DocentesTable
              onEdit={handleEditDocente}
              onDelete={handleDeleteDocenteClick}
              refresh={refreshDocentes}
              onRefreshComplete={() => setRefreshDocentes(false)}
            />
          </Box>
        </TabPanel>

        {/* Tab Panel: Catálogo de Insumos */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ px: 3 }}>
            {/* Header con botón */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 3
            }}>
              <Typography variant="h6" fontWeight={600}>
                Catálogo de Insumos
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleOpenInsumoForm}
              >
                Nuevo Insumo
              </Button>
            </Box>

            {/* Tabla */}
            {loadingInsumos ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : insumos.length === 0 ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                py: 8,
                color: 'text.secondary'
              }}>
                <LibraryBooks sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                <Typography variant="h6" gutterBottom>
                  No hay insumos registrados
                </Typography>
                <Typography variant="body2">
                  Crea el primer insumo para empezar
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'primary.main' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Código</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Nombre</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Categoría</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Unidad</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Presentación</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {insumos.map((insumo) => (
                      <TableRow key={insumo.id} hover>
                        <TableCell>
                          <Chip 
                            label={insumo.codigo || 'N/A'} 
                            size="small" 
                            color="primary"
                            variant="outlined"
                            sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {insumo.nombre}
                          </Typography>
                          {insumo.descripcion && (
                            <Typography variant="caption" color="text.secondary">
                              {insumo.descripcion}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={insumo.categoria?.replace('_', ' ')} 
                            size="small"
                            sx={{ 
                              backgroundColor: getCategoriaColor(insumo.categoria),
                              color: 'white',
                              fontWeight: 500
                            }}
                          />
                        </TableCell>
                        <TableCell>{insumo.unidad_medida}</TableCell>
                        <TableCell>{insumo.presentacion || '-'}</TableCell>
                        <TableCell align="center">
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEditInsumo(insumo)}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </TabPanel>

        {/* Tab Panel: Laboratorios */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ px: 3 }}>
            {/* Header con botón */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 3
            }}>
              <Typography variant="h6" fontWeight={600}>
                Gestión de Laboratorios
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleOpenLaboratorioForm}
              >
                Nuevo Laboratorio
              </Button>
            </Box>

            {/* Tabla de laboratorios */}
            <LaboratoriosTable
              onEdit={handleEditLaboratorio}
              onDelete={handleDeleteLaboratorioClick}
              onChangeStatus={handleChangeLaboratorioStatus}
              refresh={refreshLaboratorios}
              onRefreshComplete={() => {}}
            />
          </Box>
        </TabPanel>
      </Paper>

      {/* Formulario de Tipo de Equipo */}
      <TipoEquipoForm
        open={formOpen}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
        tipoEquipo={editingTipo}
      />

      {/* Formulario de Docente */}
      <DocenteForm
        open={docenteFormOpen}
        onClose={handleCloseDocenteForm}
        onSuccess={handleDocenteFormSuccess}
        docente={editingDocente}
      />

      {/* Formulario de Insumo */}
      <InsumoForm
        open={insumoFormOpen}
        onClose={handleCloseInsumoForm}
        onSuccess={handleInsumoFormSuccess}
        insumo={editingInsumo}
      />

      {/* Formulario de Laboratorio */}
      <LaboratorioForm
        open={laboratorioFormOpen}
        onClose={handleCloseLaboratorioForm}
        onSuccess={handleLaboratorioFormSuccess}
        laboratorio={editingLaboratorio}
      />

      {/* Diálogo de confirmación de eliminación - Tipo de Equipo */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar el tipo de equipo "{tipoToDelete?.nombre}"?
            {tipoToDelete?.count_equipos && tipoToDelete.count_equipos > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Este tipo tiene {tipoToDelete.count_equipos} equipo(s) asociado(s) y no podrá ser eliminado.
              </Alert>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error"
            variant="contained"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación de eliminación - Docente */}
      <Dialog
        open={docenteDeleteDialogOpen}
        onClose={() => setDocenteDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar al docente "{docenteToDelete?.nombre}"?
            <Alert severity="warning" sx={{ mt: 2 }}>
              Si este docente tiene horarios asignados, no podrá ser eliminado.
            </Alert>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocenteDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteDocenteConfirm} 
            color="error"
            variant="contained"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación de eliminación - Laboratorio */}
      <Dialog
        open={laboratorioDeleteDialogOpen}
        onClose={() => setLaboratorioDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar el laboratorio "{laboratorioToDelete?.nombre}"?
            <Alert severity="warning" sx={{ mt: 2 }}>
              Esta acción no se puede deshacer. El laboratorio será eliminado permanentemente del sistema.
            </Alert>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLaboratorioDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteLaboratorioConfirm} 
            color="error"
            variant="contained"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

