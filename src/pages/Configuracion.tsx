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
  DialogContentText
} from '@mui/material'
import { Add, Category, Person, LibraryBooks, School, AccountBalance, FileUpload } from '@mui/icons-material'
import { TiposEquipoTable } from '../components/Configuracion/TipoEquipo/TiposEquipoTable'
import { TipoEquipoForm } from '../components/Configuracion/TipoEquipo/TipoEquipoForm'
import { EscuelasTable } from '../components/Configuracion/Escuela/EscuelasTable'
import { EscuelaForm } from '../components/Configuracion/Escuela/EscuelaForm'
import { DocentesTable } from '../components/Configuracion/Docentes/DocentesTable'
import { DocenteForm } from '../components/Configuracion/Docentes/DocenteForm'
import { InsumoForm } from '../components/Configuracion/Insumos/InsumoForm'
import { LaboratoriosTable } from '../components/Configuracion/Laboratorios/LaboratoriosTable'
import { LaboratorioForm } from '../components/Configuracion/Laboratorios/LaboratorioForm'
import { tipoEquipoService, type TipoEquipo } from '../services/tipoEquipoService'
import { escuelaService, type Escuela } from '../services/escuelaService'
import { docenteService, type Docente } from '../services/docenteService'
import { insumoService, type Insumo2 } from '../services/insumoService'
import { laboratorioService, type Laboratorio } from '../services/laboratorioService'
import { ImportacionMasiva } from '../components/Configuracion/Insumos/ImportacionMasiva'
import { CatalogoInsumosTable } from '../components/Configuracion/Insumos/CatalogoInsumosTable'

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
  const [insumos, setInsumos] = useState<Insumo2[]>([])
  const [loadingInsumos, setLoadingInsumos] = useState(false)
  const [insumoFormOpen, setInsumoFormOpen] = useState(false)
  const [editingInsumo, setEditingInsumo] = useState<Insumo2 | null>(null)
  const [insumoDeleteDialogOpen, setInsumoDeleteDialogOpen] = useState(false)
  const [insumoToDelete, setInsumoToDelete] = useState<Insumo2 | null>(null)

  //Importación masiva
  const [importacionMasivaOpen, setImportacionMasivaOpen] = useState(false)


  // Estado para Laboratorios
  const [laboratorioFormOpen, setLaboratorioFormOpen] = useState(false)
  const [editingLaboratorio, setEditingLaboratorio] = useState<Laboratorio | null>(null)
  const [laboratorioDeleteDialogOpen, setLaboratorioDeleteDialogOpen] = useState(false)
  const [laboratorioToDelete, setLaboratorioToDelete] = useState<Laboratorio | null>(null)
  const [refreshLaboratorios, setRefreshLaboratorios] = useState(0)

  // Estado para Escuelas
  const [escuelas, setEscuelas] = useState<Escuela[]>([])
  const [loadingEscuelas, setLoadingEscuelas] = useState(false)
  const [escuelaFormOpen, setEscuelaFormOpen] = useState(false)
  const [editingEscuela, setEditingEscuela] = useState<Escuela | null>(null)
  const [escuelaDeleteDialogOpen, setEscuelaDeleteDialogOpen] = useState(false)
  const [escuelaToDelete, setEscuelaToDelete] = useState<Escuela | null>(null)

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning'
  })

  // Cargar tipos de equipo
  const loadTiposEquipo = async () => {
    setLoadingTipos(true)
    const response = await tipoEquipoService.getAllWithCountEquipos()

    if (response.success && response.data) {
      setTiposEquipo(response.data)
    } else {
      setSnackbar({
        open: true,
        message: response.message || 'Error al cargar tipos de equipo',
        severity: 'error'
      })
    }
    
    setLoadingTipos(false)
  }

  // Cargar catálogo de insumos
  const loadCatalogoInsumos = async () => {
    setLoadingInsumos(true)
    const response = await insumoService.getAllInsumos()
    
    if (response.data) {
      setInsumos(response.data || [])
    } else {
      setSnackbar({
        open: true,
        message: response.message || 'Error al cargar catálogo de insumos',
        severity: 'error'
      })
    }
    
    setLoadingInsumos(false)
  }

  // Cargar escuelas
  const loadEscuelas = async () => {
    setLoadingEscuelas(true)
    const response = await escuelaService.getAll()
    
    if (response.success && response.data) {
      setEscuelas(response.data)
    } else {
      setSnackbar({
        open: true,
        message: response.message || 'Error al cargar escuelas',
        severity: 'error'
      })
    }
    
    setLoadingEscuelas(false)
  }

  // Cargar datos al montar o cambiar de tab
  useEffect(() => {
    if (tabValue === 0) {
      loadTiposEquipo()
    } else if (tabValue === 2) {
      loadCatalogoInsumos()
    } else if (tabValue === 4) {
      loadEscuelas()
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

  const handleFormSuccess = (message?: string) => {
    loadTiposEquipo()
    setSnackbar({
      open: true,
      message: message || (editingTipo ? 'Tipo actualizado exitosamente' : 'Tipo creado exitosamente'),
      severity: 'success'
    })
  }

  const handleDeleteClick = (tipo: TipoEquipo) => {
    setTipoToDelete(tipo)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!tipoToDelete) return

    const result = await tipoEquipoService.delete(tipoToDelete.id)
    
    if (result.success) {
      setSnackbar({
        open: true,
        message: result.message || 'Tipo eliminado exitosamente',
        severity: 'success'
      })
      loadTiposEquipo()
    } else {
      setSnackbar({
        open: true,
        message: result.message || 'Error al eliminar tipo de equipo',
        severity: 'error'
      })
    }
    
    setDeleteDialogOpen(false)
    setTipoToDelete(null)
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

  const handleDocenteFormSuccess = (message?: string) => {
    setRefreshDocentes(true)
    setSnackbar({
      open: true,
      message: message || (editingDocente ? 'Docente actualizado exitosamente' : 'Docente creado exitosamente'),
      severity: 'success'
    })
  }

  const handleDeleteDocenteClick = (docente: Docente) => {
    setDocenteToDelete(docente)
    setDocenteDeleteDialogOpen(true)
  }

  const handleDeleteDocenteConfirm = async () => {
    if (!docenteToDelete) return

    const result = await docenteService.delete(docenteToDelete.id)
    
    if (result.success) {
      setSnackbar({
        open: true,
        message: result.message || 'Docente eliminado exitosamente',
        severity: 'success'
      })
      setRefreshDocentes(true)
    } else {
      setSnackbar({
        open: true,
        message: result.message || 'Error al eliminar docente',
        severity: 'error'
      })
    }
    
    setDocenteDeleteDialogOpen(false)
    setDocenteToDelete(null)
  }

  // Handlers para Catálogo de Insumos
  const handleOpenInsumoForm = () => {
    setInsumoFormOpen(true)
  }

  const handleEditInsumo = (insumo: Insumo2) => {
    setEditingInsumo(insumo)
    setInsumoFormOpen(true)
  }

  const handleCloseInsumoForm = () => {
    setInsumoFormOpen(false)
    setEditingInsumo(null)
  }

  const handleInsumoFormSuccess = (message?: string) => {
    loadCatalogoInsumos()
    setSnackbar({
      open: true,
      message: message || (editingInsumo ? 'Insumo actualizado exitosamente' : 'Insumo creado exitosamente'),
      severity: 'success'
    })
  }

  const handleDeleteInsumoClick = (insumo: Insumo2) => {
    setInsumoToDelete(insumo)
    setInsumoDeleteDialogOpen(true)
  }

  const handleDeleteInsumoConfirm = async () => {
    if (!insumoToDelete) return

    const result = await insumoService.delete(insumoToDelete.id)
    
    if (result.success) {
      setSnackbar({
        open: true,
        message: result.message || 'Insumo eliminado exitosamente',
        severity: 'success'
      })
      loadCatalogoInsumos()
    } else {
      setSnackbar({
        open: true,
        message: result.message || 'Error al eliminar insumo',
        severity: 'error'
      })
    }
    
    setInsumoDeleteDialogOpen(false)
    setInsumoToDelete(null)
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

  const handleLaboratorioFormSuccess = (message?: string) => {
    setRefreshLaboratorios(prev => prev + 1)
    setSnackbar({
      open: true,
      message: message || (editingLaboratorio ? 'Laboratorio actualizado exitosamente' : 'Laboratorio creado exitosamente'),
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

  // Handlers para Escuelas
  const handleOpenEscuelaForm = () => {
    setEditingEscuela(null)
    setEscuelaFormOpen(true)
  }

  const handleEditEscuela = (escuela: Escuela) => {
    setEditingEscuela(escuela)
    setEscuelaFormOpen(true)
  }

  const handleCloseEscuelaForm = () => {
    setEscuelaFormOpen(false)
    setEditingEscuela(null)
  }

  const handleEscuelaFormSuccess = (message?: string) => {
    loadEscuelas()
    setSnackbar({
      open: true,
      message: message || (editingEscuela ? 'Escuela actualizada exitosamente' : 'Escuela creada exitosamente'),
      severity: 'success'
    })
  }

  const handleDeleteEscuelaClick = (escuela: Escuela) => {
    setEscuelaToDelete(escuela)
    setEscuelaDeleteDialogOpen(true)
  }

  const handleDeleteEscuelaConfirm = async () => {
    if (!escuelaToDelete) return

    try {
      const result = await escuelaService.delete(escuelaToDelete.id)

      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Escuela eliminada exitosamente',
          severity: 'success'
        })
        loadEscuelas()
      } else {
        setSnackbar({
          open: true,
          message: result.message || 'Error al eliminar la escuela',
          severity: 'error'
        })
      }
    } catch (error: any) {
      console.error('Error al eliminar escuela:', error)
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error al eliminar escuela',
        severity: 'error'
      })
    } finally {
      setEscuelaDeleteDialogOpen(false)
      setEscuelaToDelete(null)
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  // Función para abrir importación masiva
  const handleImportacionMasivaOpen = () => {
    setImportacionMasivaOpen(true)
  }

  // Función para cerrar importación masiva
  const handleImportacionMasivaClose = () => {
    setImportacionMasivaOpen(false)
  }

  // Función para éxito de importación masiva
  const handleImportacionMasivaSuccess = (message?: string) => {
    loadCatalogoInsumos()
    setSnackbar({
      open: true,
      message: message || 'Importación masiva completada correctamente',
      severity: 'success'
    })
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
            <Tab
              icon={<AccountBalance />}
              iconPosition="start"
              label="Escuelas"
              id="config-tab-4"
              aria-controls="config-tabpanel-4"
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
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={2}
            >
              <Typography variant="h6" fontWeight={600}>
                Catálogo de Insumos
              </Typography>

              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleOpenInsumoForm}
                >
                  Nuevo Insumo
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<FileUpload />}
                  onClick={handleImportacionMasivaOpen}
                  sx={{ borderRadius: 2, px: 3 }}
                  color="secondary"
                >
                  Importar Excel
                </Button>
              </Box>
            </Box>


            {/* Tabla */}
            {loadingInsumos ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <CatalogoInsumosTable
                insumos={insumos}
                onEdit={handleEditInsumo}
                onDelete={handleDeleteInsumoClick}
              />
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
              onRefreshComplete={() => { }}
            />
          </Box>
        </TabPanel>

        {/* Tab Panel: Escuelas */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ px: 3 }}>
            {/* Header con botón */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3
            }}>
              <Typography variant="h6" fontWeight={600}>
                Gestión de Escuelas
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleOpenEscuelaForm}
              >
                Nueva Escuela
              </Button>
            </Box>

            {/* Tabla */}
            {loadingEscuelas ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <EscuelasTable
                escuelas={escuelas}
                onEdit={handleEditEscuela}
                onDelete={handleDeleteEscuelaClick}
              />
            )}
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

      {/* Formulario de Escuela */}
      <EscuelaForm
        open={escuelaFormOpen}
        onClose={handleCloseEscuelaForm}
        onSuccess={handleEscuelaFormSuccess}
        escuela={editingEscuela}
      />

      {/* Importación masiva*/}
      <ImportacionMasiva
        open={importacionMasivaOpen}
        onClose={handleImportacionMasivaClose}
        onSuccess={handleImportacionMasivaSuccess}
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
          </DialogContentText>
          {(tipoToDelete?.count_equipos || 0) > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Este tipo tiene {tipoToDelete?.count_equipos} equipo(s) asociado(s) y no podrá ser eliminado.
            </Alert>
          )}
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

      {/* Diálogo de confirmación de eliminación - Insumo */}
      <Dialog
        open={insumoDeleteDialogOpen}
        onClose={() => setInsumoDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar el insumo "{insumoToDelete?.nombre}"?
          </DialogContentText>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Esta acción no se puede deshacer. El insumo será eliminado permanentemente del catálogo.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInsumoDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteInsumoConfirm}
            color="error"
            variant="contained"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación de eliminación - Escuela */}
      <Dialog
        open={escuelaDeleteDialogOpen}
        onClose={() => setEscuelaDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar la escuela "{escuelaToDelete?.nombre}"?
            <Alert severity="warning" sx={{ mt: 2 }}>
              Si esta escuela tiene laboratorios o docentes asignados, no podrá ser eliminada.
            </Alert>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEscuelaDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteEscuelaConfirm}
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

