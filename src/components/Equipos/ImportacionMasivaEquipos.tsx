import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import {
  Close,
  CloudUpload,
  GetApp,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Download,
  Upload
} from '@mui/icons-material'
import { equipoService } from '../../services/equipoService'
import { laboratorioService, type Laboratorio } from '../../services/laboratorioService'
import { useApi } from '../../hooks/useApi'

interface ImportacionMasivaEquiposProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface PreviewDataEquipo {
  fila: number
  codigo: string
  nombre: string
  tipo_equipo_id: number
  descripcion: string
  marca: string
  modelo: string
  numero_serie: string
  estado: string
  fecha_ultimo_mantenimiento: string
  fecha_proximo_mantenimiento: string
  comentarios: string
  condicion: string
  fecha_adquisicion: string
  laboratorio_id: number
  errores: string[]
}

interface PreviewResponseEquipo {
  success: boolean
  data: PreviewDataEquipo[]
  total_filas: number
  errores_generales: string[]
}

interface ResultadoImportacion {
  success: boolean
  message: string
  procesados: number
  errores: number
  detalles_errores: string[]
  resultados: Array<{
    fila: number
    codigo: string
    nombre: string
    marca: string
    modelo: string
    estado: string
    laboratorio_id: number
  }>
}

type Step = 'filtros' | 'subida' | 'preview' | 'resultado'

export const ImportacionMasivaEquipos: React.FC<ImportacionMasivaEquiposProps> = ({ open, onClose, onSuccess }) => {
  const { execute } = useApi()
  const [currentStep, setCurrentStep] = useState<Step>('filtros')
  const [loading, setLoading] = useState(false)
  const [loadingLabs, setLoadingLabs] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<PreviewResponseEquipo | null>(null)
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [plantillaDescargada, setPlantillaDescargada] = useState(false)

  const [filters, setFilters] = useState({
    laboratorio_id: '',
    fecha_movimiento: new Date().toISOString().split('T')[0],
    referencia: ''
  })

  useEffect(() => {
    if (open) {
      loadLaboratorios()
    }
  }, [open])

  const loadLaboratorios = async () => {
    setLoadingLabs(true)
    try {
      const response = await execute(() => laboratorioService.getAll())
      if (response.data) {
        const sortedLabs = [...(response.data.data || [])].sort((a, b) => a.nombre.localeCompare(b.nombre))
        setLaboratorios(sortedLabs)
      }
    } catch (err) {
      console.error('Error al cargar laboratorios:', err)
    } finally {
      setLoadingLabs(false)
    }
  }

  const handleClose = () => {
    setCurrentStep('filtros')
    setSelectedFile(null)
    setPreview(null)
    setResultado(null)
    setError(null)
    setPlantillaDescargada(false)
    setFilters({
      laboratorio_id: '',
      fecha_movimiento: new Date().toISOString().split('T')[0],
      referencia: ''
    })
    onClose()
  }

  const handleDescargarPlantilla = async () => {
    try {
      setLoading(true)
      setError(null)
      await equipoService.descargarPlantillaImportacion()
      setPlantillaDescargada(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ]

      if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
        setError('Por favor selecciona un archivo Excel válido (.xlsx o .xls)')
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo es demasiado grande. Máximo 5MB.')
        return
      }

      setSelectedFile(file)
      setError(null)
      setCurrentStep('preview')
      handlePrevisualizarArchivo(file)
    }
  }

  const handlePrevisualizarArchivo = async (file: File) => {
    try {
      setLoading(true)
      setError(null)

      const previewData = await equipoService.previsualizarImportacion(file)
      setPreview(previewData)

    } catch (err: any) {
      setError(err.message)
      setCurrentStep('subida')
    } finally {
      setLoading(false)
    }
  }

  const handleProcesarArchivo = async () => {
    if (!selectedFile) return

    try {
      setLoading(true)
      setError(null)

      const resultado = await equipoService.importacionMasiva(selectedFile)
      setResultado(resultado)
      setCurrentStep('resultado')

      if (resultado.success && resultado.procesados > 0) {
        onSuccess()
      }

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReiniciar = () => {
    setCurrentStep('filtros')
    setSelectedFile(null)
    setPreview(null)
    setResultado(null)
    setError(null)
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Operativo': return 'success'
      case 'En Mantenimiento': return 'warning'
      case 'Fuera de Servicio': return 'error'
      default: return 'info'
    }
  }

  const getStepLabel = (step: Step): string => {
    const labels: Record<Step, string> = {
      filtros: 'Filtros',
      subida: 'Subir Archivo',
      preview: 'Previsualizar Datos',
      resultado: 'Confirmar Reabastecimiento'
    }
    return labels[step]
  }

  const getStepNumber = (step: Step): number => {
    const steps: Step[] = ['filtros', 'subida', 'preview', 'resultado']
    return steps.indexOf(step) + 1
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Carga Masiva de Stock
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              startIcon={<GetApp />}
              onClick={handleDescargarPlantilla}
              disabled={loading || plantillaDescargada}
              size="small"
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              {loading ? <CircularProgress size={16} /> : plantillaDescargada ? 'Plantilla Descargada' : 'Descargar Plantilla'}
            </Button>
            <Button onClick={handleClose} color="inherit" sx={{ minWidth: 'auto' }}>
              <Close />
            </Button>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Panel de Filtros Persistente - Editable en todas las pantallas */}
        <Paper sx={{ p: 2.5, mb: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Laboratorio *</InputLabel>
              <Select
                value={filters.laboratorio_id}
                onChange={(e) => setFilters({ ...filters, laboratorio_id: e.target.value })}
                label="Laboratorio *"
                disabled={loadingLabs || currentStep === 'resultado'}
              >
                <MenuItem value="">
                  <em>Selecciona un laboratorio</em>
                </MenuItem>
                {laboratorios.map((lab) => (
                  <MenuItem key={lab.id} value={lab.id.toString()}>
                    {lab.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              type="date"
              label="Fecha del Movimiento *"
              value={filters.fecha_movimiento}
              onChange={(e) => setFilters({ ...filters, fecha_movimiento: e.target.value })}
              InputLabelProps={{ shrink: true }}
              size="small"
              disabled={currentStep === 'resultado'}
            />

            <TextField
              label="Referencia"
              placeholder="Referencia"
              value={filters.referencia}
              onChange={(e) => setFilters({ ...filters, referencia: e.target.value })}
              size="small"
              disabled={currentStep === 'resultado'}
            />
          </Box>
        </Paper>

        {/* Pasos visuales */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, px: 2 }}>
          {(['subida', 'preview', 'resultado'] as const).map((step, index) => {
            const stepNum = getStepNumber(step)
            const currentNum = getStepNumber(currentStep)
            const isActive = currentNum === stepNum
            const isCompleted = currentNum > stepNum
            
            return (
              <React.Fragment key={step}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                    opacity: isActive || isCompleted ? 1 : 0.5
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      backgroundColor: isActive ? 'primary.main' : isCompleted ? 'primary.main' : 'grey.300',
                      color: 'white',
                      fontSize: '1rem'
                    }}
                  >
                    {isCompleted ? <CheckCircle /> : stepNum}
                  </Box>
                  <Typography variant="caption" sx={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 500 }}>
                    {getStepLabel(step)}
                  </Typography>
                </Box>

                {index < 2 && (
                  <Box
                    sx={{
                      flex: 1,
                      height: 3,
                      backgroundColor: isCompleted ? 'primary.main' : 'grey.300',
                      mx: 1
                    }}
                  />
                )}
              </React.Fragment>
            )
          })}
        </Box>

        {/* Paso 1: Filtros */}
        {currentStep === 'filtros' && (
          <Box sx={{ py: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Laboratorio *</InputLabel>
                <Select
                  value={filters.laboratorio_id}
                  onChange={(e) => setFilters({ ...filters, laboratorio_id: e.target.value })}
                  label="Laboratorio *"
                  disabled={loadingLabs}
                >
                  <MenuItem value="">
                    <em>Selecciona un laboratorio</em>
                  </MenuItem>
                  {laboratorios.map((lab) => (
                    <MenuItem key={lab.id} value={lab.id.toString()}>
                      {lab.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                type="date"
                label="Fecha del Movimiento *"
                value={filters.fecha_movimiento}
                onChange={(e) => setFilters({ ...filters, fecha_movimiento: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="Referencia"
                placeholder="Referencia"
                value={filters.referencia}
                onChange={(e) => setFilters({ ...filters, referencia: e.target.value })}
              />
            </Box>
          </Box>
        )}

        {/* Paso 1: Subir Archivo */}
        {currentStep === 'subida' && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Upload sx={{ fontSize: 80, color: 'secondary.main', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Subir Archivo
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
              Selecciona el archivo Excel completado con los datos de stock que deseas importar.
            </Typography>

            <input
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              id="upload-file-equipos"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="upload-file-equipos">
              <Button
                variant="contained"
                component="span"
                startIcon={<CloudUpload />}
                color="secondary"
                sx={{ borderRadius: 2, minWidth: 200 }}
              >
                Seleccionar Archivo
              </Button>
            </label>
          </Box>
        )}

        {/* Paso 3: Preview */}
        {currentStep === 'preview' && preview && (
          <Box>
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.main' }}>
              <Typography variant="body2" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle sx={{ fontSize: 20, color: 'success.main' }} />
                {preview.total_filas} equipos encontrados y validados
              </Typography>
            </Paper>

            <TableContainer sx={{ maxHeight: 400, mb: 3 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Código</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Nombre</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Marca/Modelo</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Estado</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">Estado Val.</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.data.slice(0, 10).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.codigo}</TableCell>
                      <TableCell>{item.nombre}</TableCell>
                      <TableCell>{item.marca} {item.modelo}</TableCell>
                      <TableCell>
                        <Chip label={item.estado} size="small" color={getEstadoColor(item.estado)} variant="outlined" />
                      </TableCell>
                      <TableCell align="center">
                        {item.errores.length > 0 ? (
                          <Chip icon={<ErrorIcon />} label="Error" size="small" color="error" variant="outlined" />
                        ) : (
                          <Chip icon={<CheckCircle />} label="Válido" size="small" color="success" variant="outlined" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {preview.data.length > 10 && (
              <Typography variant="caption" color="text.secondary">
                Mostrando 10 de {preview.data.length} registros
              </Typography>
            )}
          </Box>
        )}

        {/* Paso 4: Resultado */}
        {currentStep === 'resultado' && resultado && (
          <Box sx={{ py: 2 }}>
            <Paper sx={{ p: 3, mb: 3, bgcolor: resultado.success ? 'success.50' : 'warning.50', border: '1px solid', borderColor: resultado.success ? 'success.main' : 'warning.main' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                {resultado.success ? (
                  <CheckCircle sx={{ color: 'success.main', fontSize: 40 }} />
                ) : (
                  <Warning sx={{ color: 'warning.main', fontSize: 40 }} />
                )}
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {resultado.success ? '¡Importación Completada!' : 'Importación con Advertencias'}
                  </Typography>
                  <Typography variant="body2">
                    {resultado.message}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  icon={<CheckCircle />}
                  label={`${resultado.procesados} Procesados`}
                  color="success"
                  variant="outlined"
                />
                {resultado.errores > 0 && (
                  <Chip
                    icon={<ErrorIcon />}
                    label={`${resultado.errores} Errores`}
                    color="error"
                    variant="outlined"
                  />
                )}
              </Box>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        {currentStep === 'resultado' ? (
          <>
            <Button onClick={handleReiniciar} startIcon={<Refresh />} variant="outlined">
              Nueva Importación
            </Button>
            <Button onClick={handleClose} variant="contained">
              Cerrar
            </Button>
          </>
        ) : (
          <>
            {currentStep !== 'subida' && (
              <Button 
                onClick={() => {
                  if (currentStep === 'preview') setCurrentStep('subida')
                }} 
                variant="outlined"
              >
                Atrás
              </Button>
            )}
            <Button onClick={handleClose} variant="outlined" color="inherit">
              Cancelar
            </Button>
            {currentStep === 'subida' && (
              <Button
                onClick={() => {}}
                variant="contained"
                disabled={!filters.laboratorio_id || !filters.fecha_movimiento}
              >
                Archivo seleccionado
              </Button>
            )}
            {currentStep === 'preview' && (
              <Button
                onClick={handleProcesarArchivo}
                variant="contained"
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : 'Confirmar e Importar'}
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}