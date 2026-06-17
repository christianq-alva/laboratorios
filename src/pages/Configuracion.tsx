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
  Snackbar
} from '@mui/material'
import { Add, Category, Person, LibraryBooks, School, AccountBalance, FileUpload, FileDownload, Group, Straighten, PriceChange } from '@mui/icons-material'
import { TiposEquipoTable } from '../components/Configuracion/TipoEquipo/TiposEquipoTable'
import { TipoEquipoForm } from '../components/Configuracion/TipoEquipo/TipoEquipoForm'
import { EscuelasTable } from '../components/Configuracion/Escuela/EscuelasTable'
import { EscuelaForm } from '../components/Configuracion/Escuela/EscuelaForm'
import { DocentesTable } from '../components/Configuracion/Docentes/DocentesTable'
import { DocenteForm } from '../components/Configuracion/Docentes/DocenteForm'
import { CatalogoInsumosTable } from '../components/Configuracion/Insumos/CatalogoInsumosTable'
import { InsumoForm } from '../components/Configuracion/Insumos/InsumoForm'
import { ImportacionMasiva } from '../components/Configuracion/Insumos/ImportacionMasiva'
import { PrecioInsumoModal } from '../components/Configuracion/Insumos/PrecioInsumoModal'
import { ActualizarPreciosMasivoModal } from '../components/Configuracion/Insumos/ActualizarPreciosMasivoModal'
import { exportCatalogoInsumosToExcel } from '../components/Configuracion/Insumos/exportCatalogoInsumos'
import { LaboratoriosTable } from '../components/Configuracion/Laboratorios/LaboratoriosTable'
import { LaboratorioForm } from '../components/Configuracion/Laboratorios/LaboratorioForm'
import { UsuariosTable } from '../components/Configuracion/Usuarios/UsuariosTable'
import { UsuarioForm } from '../components/Configuracion/Usuarios/UsuarioForm'
import { UnidadesTable } from '../components/Configuracion/Unidades/UnidadesTable'
import { UnidadForm } from '../components/Configuracion/Unidades/UnidadForm'
import { tipoEquipoService, type TipoEquipo } from '../services/tipoEquipoService'
import { unidadService, type Unidad } from '../services/unidadService'
import { escuelaService, type Escuela } from '../services/escuelaService'
import { docenteService, type Docente } from '../services/docenteService'
import { insumoService, type Insumo } from '../services/insumoService'
import { laboratorioService, type Laboratorio } from '../services/laboratorioService'
import { usuarioService, type Usuario } from '../services/usuarioService'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../hooks/useAuth'
import { DeleteDialog } from '../components/Common/DeleteDialog'



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
  const { execute } = useApi()
  const { user } = useAuth()
  const isAdmin = user?.rol === 'Administrador'
  const [tabValue, setTabValue] = useState(0)

  // Estado para Tipos de Equipo
  const [tiposEquipo, setTiposEquipo] = useState<TipoEquipo[]>([])
  const [loadingTipos, setLoadingTipos] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingTipo, setEditingTipo] = useState<TipoEquipo | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tipoToDelete, setTipoToDelete] = useState<TipoEquipo | null>(null)

  // Estado para Unidades
  const [unidades, setUnidades] = useState<Unidad[]>([])
  const [loadingUnidades, setLoadingUnidades] = useState(false)
  const [unidadFormOpen, setUnidadFormOpen] = useState(false)
  const [editingUnidad, setEditingUnidad] = useState<Unidad | null>(null)
  const [unidadDeleteDialogOpen, setUnidadDeleteDialogOpen] = useState(false)
  const [unidadToDelete, setUnidadToDelete] = useState<Unidad | null>(null)

  // Estado para Docentes
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [loadingDocentes, setLoadingDocentes] = useState(false)
  const [docenteFormOpen, setDocenteFormOpen] = useState(false)
  const [editingDocente, setEditingDocente] = useState<Docente | null>(null)
  const [docenteDeleteDialogOpen, setDocenteDeleteDialogOpen] = useState(false)
  const [docenteToDelete, setDocenteToDelete] = useState<Docente | null>(null)

  // Estado para Catálogo de Insumos
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [loadingInsumos, setLoadingInsumos] = useState(false)
  const [insumoFormOpen, setInsumoFormOpen] = useState(false)
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null)
  const [insumoDeleteDialogOpen, setInsumoDeleteDialogOpen] = useState(false)
  const [insumoToDelete, setInsumoToDelete] = useState<Insumo | null>(null)

  //Importación masiva
  const [importacionMasivaOpen, setImportacionMasivaOpen] = useState(false)

  // Importar precios masivamente
  const [importarPreciosOpen, setImportarPreciosOpen] = useState(false)

  // Precio de insumo
  const [precioModalOpen, setPrecioModalOpen] = useState(false)
  const [insumoParaPrecio, setInsumoParaPrecio] = useState<Insumo | null>(null)


  // Estado para Laboratorios
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [loadingLaboratorios, setLoadingLaboratorios] = useState(false)
  const [laboratorioFormOpen, setLaboratorioFormOpen] = useState(false)
  const [editingLaboratorio, setEditingLaboratorio] = useState<Laboratorio | null>(null)
  const [laboratorioDeleteDialogOpen, setLaboratorioDeleteDialogOpen] = useState(false)
  const [laboratorioToDelete, setLaboratorioToDelete] = useState<Laboratorio | null>(null)

  // Estado para Escuelas
  const [escuelas, setEscuelas] = useState<Escuela[]>([])
  const [loadingEscuelas, setLoadingEscuelas] = useState(false)
  const [escuelaFormOpen, setEscuelaFormOpen] = useState(false)
  const [editingEscuela, setEditingEscuela] = useState<Escuela | null>(null)
  const [escuelaDeleteDialogOpen, setEscuelaDeleteDialogOpen] = useState(false)
  const [escuelaToDelete, setEscuelaToDelete] = useState<Escuela | null>(null)

  // Estado para Usuarios
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loadingUsuarios, setLoadingUsuarios] = useState(false)
  const [usuarioFormOpen, setUsuarioFormOpen] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null)
  const [usuarioDeleteDialogOpen, setUsuarioDeleteDialogOpen] = useState(false)
  const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(null)

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning'
  })

  // Cargar tipos de equipo
  const loadTiposEquipo = async () => {
    setLoadingTipos(true)
    const result = await execute(() => tipoEquipoService.getAllWithCountEquipos())

    if (result.error) {
      setSnackbar({
        open: true,
        message: result.error,
        severity: 'error'
      })
    } else if (result.data) {
      const sortedData = [...result.data.data].sort((a, b) => a.nombre.localeCompare(b.nombre))
      setTiposEquipo(sortedData)
    }

    setLoadingTipos(false)
  }

  // Cargar catálogo de insumos
  const loadCatalogoInsumos = async () => {
    setLoadingInsumos(true)
    const result = await execute(() => insumoService.getAllInsumos())

    if (result.error) {
      setSnackbar({
        open: true,
        message: result.error,
        severity: 'error'
      })
    } else if (result.data) {
      const sortedData = [...result.data.data].sort((a, b) => a.nombre.localeCompare(b.nombre))
      setInsumos(sortedData)
    }

    setLoadingInsumos(false)
  }

  // Cargar unidades
  const loadUnidades = async () => {
    setLoadingUnidades(true)
    const result = await execute(() => unidadService.getAll())
    if (result.error) {
      setSnackbar({
        open: true,
        message: result.error,
        severity: 'error'
      })
    } else if (result.data) {
      const sortedData = [...result.data.data].sort((a, b) => a.nombre.localeCompare(b.nombre))
      setUnidades(sortedData)
    }
    setLoadingUnidades(false)
  }

  // Cargar docentes
  const loadDocentes = async () => {
    setLoadingDocentes(true)
    const result = await execute(() => docenteService.getAll())
    if (result.error) {
      setSnackbar({
        open: true,
        message: result.error,
        severity: 'error'
      })
    } else if (result.data) {
      const sortedData = [...result.data.data].sort((a, b) => a.nombre.localeCompare(b.nombre))
      setDocentes(sortedData)
    }
    setLoadingDocentes(false)
  }

  // Cargar laboratorios
  const loadLaboratorios = async () => {
    setLoadingLaboratorios(true)
    const result = await execute(() => laboratorioService.getAll())

    if (result.error) {
      setSnackbar({
        open: true,
        message: result.error,
        severity: 'error'
      })
    } else if (result.data) {
      const sortedData = [...result.data.data].sort((a, b) => a.nombre.localeCompare(b.nombre))
      setLaboratorios(sortedData)
    }
    setLoadingLaboratorios(false)
  }

  // Cargar escuelas
  const loadEscuelas = async () => {
    setLoadingEscuelas(true)
    const result = await execute(() => escuelaService.getAll())

    if (result.error) {
      setSnackbar({
        open: true,
        message: result.error,
        severity: 'error'
      })
    } else if (result.data) {
      const sortedData = [...result.data.data].sort((a, b) => a.nombre.localeCompare(b.nombre))
      setEscuelas(sortedData)
    }
    setLoadingEscuelas(false)
  }

  // Cargar usuarios
  const loadUsuarios = async () => {
    setLoadingUsuarios(true)
    const result = await execute(() => usuarioService.getAll())

    if (result.error) {
      setSnackbar({
        open: true,
        message: result.error,
        severity: 'error'
      })
    } else if (result.data) {
      const sortedData = [...result.data.data].sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo))
      setUsuarios(sortedData)
    }

    setLoadingUsuarios(false)
  }

  // Cargar datos al montar o cambiar de tab
  useEffect(() => {
    if (tabValue === 0) {
      loadTiposEquipo()
    } else if (tabValue === 1) {
      loadUnidades()
    } else if (tabValue === 2) {
      loadDocentes()
    } else if (tabValue === 3) {
      loadCatalogoInsumos()
    } else if (tabValue === 4) {
      loadLaboratorios()
    } else if (tabValue === 5) {
      loadEscuelas()
    } else if (tabValue === 6) {
      loadUsuarios()
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

    const result = await execute(() => tipoEquipoService.delete(tipoToDelete.id))

    if (result.error) {
      setSnackbar({
        open: true,
        message: result.error,
        severity: 'error'
      })
    } else if (result.data) {
      setSnackbar({
        open: true,
        message: result.data.message || 'Tipo eliminado exitosamente',
        severity: 'success'
      })
      loadTiposEquipo()
    }

    setDeleteDialogOpen(false)
    setTipoToDelete(null)
  }

  // Handlers para Unidades
  const handleOpenUnidadForm = () => {
    setEditingUnidad(null)
    setUnidadFormOpen(true)
  }

  const handleEditUnidad = (unidad: Unidad) => {
    setEditingUnidad(unidad)
    setUnidadFormOpen(true)
  }

  const handleCloseUnidadForm = () => {
    setUnidadFormOpen(false)
    setEditingUnidad(null)
  }

  const handleUnidadFormSuccess = (message?: string) => {
    loadUnidades()
    setSnackbar({
      open: true,
      message: message || (editingUnidad ? 'Unidad actualizada exitosamente' : 'Unidad creada exitosamente'),
      severity: 'success'
    })
  }

  const handleDeleteUnidadClick = (unidad: Unidad) => {
    setUnidadToDelete(unidad)
    setUnidadDeleteDialogOpen(true)
  }

  const handleDeleteUnidadConfirm = async () => {
    if (!unidadToDelete) return

    const result = await execute(() => unidadService.delete(unidadToDelete.id))

    if (result.error) {
      setSnackbar({
        open: true,
        message: result.error,
        severity: 'error'
      })
    } else if (result.data) {
      setSnackbar({
        open: true,
        message: result.data.message || 'Unidad eliminada exitosamente',
        severity: 'success'
      })
      loadUnidades()
    }

    setUnidadDeleteDialogOpen(false)
    setUnidadToDelete(null)
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
    loadDocentes()
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

    const result = await execute(() => docenteService.delete(docenteToDelete.id))

    if (result.error) {
      setSnackbar({
        open: true,
        message: result.error,
        severity: 'error'
      })
    } else if (result.data) {
      setSnackbar({
        open: true,
        message: result.data.message || 'Docente eliminado exitosamente',
        severity: 'success'
      })
      loadDocentes()
    }

    setDocenteDeleteDialogOpen(false)
    setDocenteToDelete(null)
  }

  // Handlers para Catálogo de Insumos
  const handleOpenInsumoForm = () => {
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

  const handleInsumoFormSuccess = (message?: string) => {
    loadCatalogoInsumos()
    setSnackbar({
      open: true,
      message: message || (editingInsumo ? 'Insumo actualizado exitosamente' : 'Insumo creado exitosamente'),
      severity: 'success'
    })
  }

  const handleSetPrecioInsumo = (insumo: Insumo) => {
    setInsumoParaPrecio(insumo)
    setPrecioModalOpen(true)
  }

  const handlePrecioSuccess = () => {
    loadCatalogoInsumos()
    setSnackbar({ open: true, message: 'Precio actualizado exitosamente', severity: 'success' })
  }

  const handleDeleteInsumoClick = (insumo: Insumo) => {
    setInsumoToDelete(insumo)
    setInsumoDeleteDialogOpen(true)
  }

  const handleDeleteInsumoConfirm = async () => {
    if (!insumoToDelete) return

    const result = await execute(() => insumoService.delete(insumoToDelete.id))

    if (result.error) {
      setSnackbar({
        open: true,
        message: result.error,
        severity: 'error'
      })
    } else if (result.data) {
      setSnackbar({
        open: true,
        message: result.data.message || 'Insumo eliminado exitosamente',
        severity: 'success'
      })
      loadCatalogoInsumos()
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
    loadLaboratorios()
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
    const result = await execute(() => laboratorioService.changeStatus(laboratorio.id, estado))

    if (result.error) {
      setSnackbar({
        open: true,
        message: result.error,
        severity: 'error'
      })
    } else if (result.data) {
      setSnackbar({
        open: true,
        message: result.data.message || `Estado cambiado a "${estado}" correctamente`,
        severity: 'success'
      })
      loadLaboratorios()
    }
  }

  const handleDeleteLaboratorioConfirm = async () => {
    if (!laboratorioToDelete) return

    const result = await execute(() => laboratorioService.delete(laboratorioToDelete.id))

    if (result.error) {
      setSnackbar({
        open: true,
        message: result.error,
        severity: 'error'
      })
    } else if (result.data) {
      setSnackbar({
        open: true,
        message: result.data.message || 'Laboratorio eliminado exitosamente',
        severity: 'success'
      })
      loadLaboratorios()
    }
    setLaboratorioDeleteDialogOpen(false)
    setLaboratorioToDelete(null)
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

    const result = await execute(() => escuelaService.delete(escuelaToDelete.id))

    if (result.error) {
      setSnackbar({
        open: true,
        message: result.error,
        severity: 'error'
      })
    } else if (result.data) {
      setSnackbar({
        open: true,
        message: result.data.message || 'Escuela eliminada exitosamente',
        severity: 'success'
      })
      loadEscuelas()
    }
    setEscuelaDeleteDialogOpen(false)
    setEscuelaToDelete(null)
  }

  // Handlers para Usuarios
  const handleOpenUsuarioForm = () => {
    setEditingUsuario(null)
    setUsuarioFormOpen(true)
  }

  const handleEditUsuario = (usuario: Usuario) => {
    setEditingUsuario(usuario)
    setUsuarioFormOpen(true)
  }

  const handleCloseUsuarioForm = () => {
    setUsuarioFormOpen(false)
    setEditingUsuario(null)
  }

  const handleUsuarioFormSuccess = (message?: string) => {
    loadUsuarios()
    setSnackbar({
      open: true,
      message: message || (editingUsuario ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente'),
      severity: 'success'
    })
  }

  const handleDeleteUsuarioClick = (usuario: Usuario) => {
    setUsuarioToDelete(usuario)
    setUsuarioDeleteDialogOpen(true)
  }

  const handleDeleteUsuarioConfirm = async () => {
    if (!usuarioToDelete) return

    const result = await execute(() => usuarioService.delete(usuarioToDelete.id))

    if (result.error) {
      setSnackbar({
        open: true,
        message: result.error,
        severity: 'error'
      })
    } else if (result.data) {
      setSnackbar({
        open: true,
        message: result.data.message || 'Usuario eliminado exitosamente',
        severity: 'success'
      })
      loadUsuarios()
    }

    setUsuarioDeleteDialogOpen(false)
    setUsuarioToDelete(null)
  }

  const handleToggleUsuarioEstado = async (usuario: Usuario) => {
    const nuevoEstado = usuario.estado === 'activo' ? 'inactivo' : 'activo'
    const result = await execute(() => usuarioService.updateEstado(usuario.id, nuevoEstado))

    if (result.error) {
      setSnackbar({
        open: true,
        message: result.error,
        severity: 'error'
      })
    } else if (result.data) {
      setSnackbar({
        open: true,
        message: result.data.message || `Usuario ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} exitosamente`,
        severity: 'success'
      })
      loadUsuarios()
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

  // Exportar catálogo de insumos a Excel
  const handleExportarCatalogoInsumos = () => {
    try {
      exportCatalogoInsumosToExcel(insumos)
      setSnackbar({
        open: true,
        message: `Catálogo exportado: ${insumos.length} insumo${insumos.length !== 1 ? 's' : ''}`,
        severity: 'success'
      })
    } catch {
      setSnackbar({
        open: true,
        message: 'Error al exportar el catálogo',
        severity: 'error'
      })
    }
  }

  // Importación masiva de precios
  const handleImportarPreciosOpen = () => setImportarPreciosOpen(true)
  const handleImportarPreciosClose = () => setImportarPreciosOpen(false)
  const handleImportarPreciosSuccess = (message?: string) => {
    loadCatalogoInsumos()
    setSnackbar({
      open: true,
      message: message || 'Precios actualizados correctamente',
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
              icon={<Straighten />}
              iconPosition="start"
              label="Unidades"
              id="config-tab-1"
              aria-controls="config-tabpanel-1"
            />
            <Tab
              icon={<Person />}
              iconPosition="start"
              label="Docentes"
              id="config-tab-2"
              aria-controls="config-tabpanel-2"
            />
            <Tab
              icon={<LibraryBooks />}
              iconPosition="start"
              label="Catálogo de Insumos"
              id="config-tab-3"
              aria-controls="config-tabpanel-3"
            />
            <Tab
              icon={<School />}
              iconPosition="start"
              label="Laboratorios"
              id="config-tab-4"
              aria-controls="config-tabpanel-4"
            />
            <Tab
              icon={<AccountBalance />}
              iconPosition="start"
              label="Escuelas"
              id="config-tab-5"
              aria-controls="config-tabpanel-5"
            />
            <Tab
              icon={<Group />}
              iconPosition="start"
              label="Usuarios"
              id="config-tab-6"
              aria-controls="config-tabpanel-6"
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

        {/* Tab Panel: Unidades */}
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
                Gestión de Unidades
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleOpenUnidadForm}
              >
                Nueva Unidad
              </Button>
            </Box>

            {/* Tabla */}
            {loadingUnidades ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <UnidadesTable
                unidades={unidades}
                onEdit={handleEditUnidad}
                onDelete={handleDeleteUnidadClick}
              />
            )}
          </Box>
        </TabPanel>

        {/* Tab Panel: Docentes */}
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
            {loadingDocentes ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <DocentesTable
                docentes={docentes}
                onEdit={handleEditDocente}
                onDelete={handleDeleteDocenteClick}
              />
            )}
          </Box>
        </TabPanel>

        {/* Tab Panel: Catálogo de Insumos */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ px: 3 }}>
            {/* Header con botón */}
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={3}
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

                {isAdmin && (
                  <Button
                    variant="outlined"
                    startIcon={<FileDownload />}
                    onClick={handleExportarCatalogoInsumos}
                    disabled={loadingInsumos || insumos.length === 0}
                    sx={{ borderRadius: 2, px: 3 }}
                    color="success"
                  >
                    Exportar Excel
                  </Button>
                )}

                {isAdmin && (
                  <Button
                    variant="outlined"
                    startIcon={<PriceChange />}
                    onClick={handleImportarPreciosOpen}
                    sx={{ borderRadius: 2, px: 3 }}
                    color="warning"
                  >
                    Importar Precios
                  </Button>
                )}
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
                onSetPrecio={handleSetPrecioInsumo}
              />
            )}
          </Box>
        </TabPanel>

        {/* Tab Panel: Laboratorios */}
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
            {loadingLaboratorios ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <LaboratoriosTable
                laboratorios={laboratorios}
                onEdit={handleEditLaboratorio}
                onDelete={handleDeleteLaboratorioClick}
                onChangeStatus={handleChangeLaboratorioStatus}
              />
            )}
          </Box>
        </TabPanel>

        {/* Tab Panel: Escuelas */}
        <TabPanel value={tabValue} index={5}>
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

        {/* Tab Panel: Usuarios */}
        <TabPanel value={tabValue} index={6}>
          <Box sx={{ px: 3 }}>
            {/* Header con botón */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3
            }}>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Gestión de Usuarios
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Administra los usuarios del sistema y sus permisos
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleOpenUsuarioForm}
              >
                Nuevo Usuario
              </Button>
            </Box>

            {/* Tabla */}
            {loadingUsuarios ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <UsuariosTable
                usuarios={usuarios}
                onEdit={handleEditUsuario}
                onDelete={handleDeleteUsuarioClick}
                onToggleEstado={handleToggleUsuarioEstado}
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

      {/* Formulario de Unidad */}
      <UnidadForm
        open={unidadFormOpen}
        onClose={handleCloseUnidadForm}
        onSuccess={handleUnidadFormSuccess}
        unidad={editingUnidad}
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

      {/* Formulario de Usuario */}
      <UsuarioForm
        open={usuarioFormOpen}
        onClose={handleCloseUsuarioForm}
        onSuccess={handleUsuarioFormSuccess}
        usuario={editingUsuario}
      />

      {/* Importación masiva*/}
      <ImportacionMasiva
        open={importacionMasivaOpen}
        onClose={handleImportacionMasivaClose}
        onSuccess={handleImportacionMasivaSuccess}
      />

      {/* Importar precios masivamente */}
      <ActualizarPreciosMasivoModal
        open={importarPreciosOpen}
        onClose={handleImportarPreciosClose}
        onSuccess={handleImportarPreciosSuccess}
      />

      {/* Diálogo de confirmación de eliminación - Tipo de Equipo */}
      <DeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={tipoToDelete?.nombre || ''}
        itemType="el tipo de equipo"
        warningMessage={
          (tipoToDelete?.count_equipos || 0) > 0
            ? `Este tipo tiene ${tipoToDelete?.count_equipos} equipo(s) asociado(s) y no podrá ser eliminado.`
            : undefined
        }
      />

      {/* Diálogo de confirmación de eliminación - Unidad */}
      <DeleteDialog
        open={unidadDeleteDialogOpen}
        onClose={() => setUnidadDeleteDialogOpen(false)}
        onConfirm={handleDeleteUnidadConfirm}
        itemName={unidadToDelete?.nombre || ''}
        itemType="la unidad"
        warningMessage="Si esta unidad tiene insumos asociados, no podrá ser eliminada."
      />

      {/* Diálogo de confirmación de eliminación - Docente */}
      <DeleteDialog
        open={docenteDeleteDialogOpen}
        onClose={() => setDocenteDeleteDialogOpen(false)}
        onConfirm={handleDeleteDocenteConfirm}
        itemName={docenteToDelete?.nombre || ''}
        itemType="al docente"
        warningMessage="Si este docente tiene horarios asignados, no podrá ser eliminado."
      />

      {/* Diálogo de confirmación de eliminación - Laboratorio */}
      <DeleteDialog
        open={laboratorioDeleteDialogOpen}
        onClose={() => setLaboratorioDeleteDialogOpen(false)}
        onConfirm={handleDeleteLaboratorioConfirm}
        itemName={laboratorioToDelete?.nombre || ''}
        itemType="el laboratorio"
        warningMessage="Esta acción no se puede deshacer. El laboratorio será eliminado permanentemente del sistema."
      />

      {/* Diálogo de confirmación de eliminación - Insumo */}
      <DeleteDialog
        open={insumoDeleteDialogOpen}
        onClose={() => setInsumoDeleteDialogOpen(false)}
        onConfirm={handleDeleteInsumoConfirm}
        itemName={insumoToDelete?.nombre || ''}
        itemType="el insumo"
        warningMessage="Esta acción no se puede deshacer. El insumo será eliminado permanentemente del catálogo."
      />

      {/* Modal de precio de insumo */}
      <PrecioInsumoModal
        open={precioModalOpen}
        onClose={() => { setPrecioModalOpen(false); setInsumoParaPrecio(null) }}
        onSuccess={handlePrecioSuccess}
        insumo={insumoParaPrecio}
      />

      {/* Diálogo de confirmación de eliminación - Escuela */}
      <DeleteDialog
        open={escuelaDeleteDialogOpen}
        onClose={() => setEscuelaDeleteDialogOpen(false)}
        onConfirm={handleDeleteEscuelaConfirm}
        itemName={escuelaToDelete?.nombre || ''}
        itemType="la escuela"
        warningMessage="Si esta escuela tiene laboratorios o docentes asignados, no podrá ser eliminada."
      />

      {/* Diálogo de confirmación de eliminación - Usuario */}
      <DeleteDialog
        open={usuarioDeleteDialogOpen}
        onClose={() => setUsuarioDeleteDialogOpen(false)}
        onConfirm={handleDeleteUsuarioConfirm}
        itemName={usuarioToDelete?.nombre_completo || ''}
        itemType="al usuario"
        warningMessage="Esta acción no se puede deshacer. El usuario perderá acceso al sistema permanentemente."
      />

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

