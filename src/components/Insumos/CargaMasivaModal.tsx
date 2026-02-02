import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import {
  CloudUpload,
  Download,
  Preview,
  CheckCircle,
  Error,
  Delete,
  Refresh,
  Close,
  FileUpload
} from '@mui/icons-material'
import { laboratorioService, type Laboratorio } from '../../services/laboratorioService'
import dayjs from 'dayjs'
import { inventarioService, type DatoValidado } from '../../services/inventarioService'

interface CargaMasivaModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface ResultadoProcesamiento {
  archivo: string
  total_filas: number
  registros_validos: number
  registros_con_errores: number
  datos_validados: DatoValidado[]
  errores: string[]
}

export const CargaMasivaModal: React.FC<CargaMasivaModalProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  //Encabezado de modal
  const [fechaMovimiento, setFechaMovimiento] = useState<string | null>(null);
  const [comentario, setComentario] = useState('');
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [laboratorioId, setLaboratorioId] = useState<number>(0);
  const [activeStep, setActiveStep] = useState(1)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<ResultadoProcesamiento | null>(null)
  const [procesando, setProcesando] = useState(false)

  const steps = [
    'Subir Archivo',
    'Previsualizar Datos',
    'Confirmar Reabastecimiento'
  ]

  useEffect(() => {
    if (open) {
      loadInitialData()
    }
  }, [open])

  const loadInitialData = async () => {
    try {
      setFechaMovimiento(new Date().toISOString().split('T')[0])
      const response = await laboratorioService.getAll()
      const sortedLaboratorios = [...(response.data || [])].sort((a, b) => a.nombre.localeCompare(b.nombre))
      setLaboratorios(sortedLaboratorios)
    } catch (error) {
      setError('Error al cargar laboratorios')
      console.error('Error:', error)
    }
  }

  const handleClose = () => {
    setActiveStep(1)
    setArchivo(null)
    setError(null)
    setResultado(null)
    setComentario('')
    setProcesando(false)
    onClose()
    setLaboratorioId(0)
    setFechaMovimiento(null)
  }

  const descargarPlantilla = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await inventarioService.descargarPlantillaExcel()

      // Crear un blob y descargarlo
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'plantilla_reabastecimiento.xlsx'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message || 'Error al descargar la plantilla')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setArchivo(file)
      setError(null)
    }
  }

  const procesarArchivo = async () => {
    if (!archivo) {
      setError('Selecciona un archivo Excel')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const formData = new FormData()
      formData.append('archivo_excel', archivo)

      const response = await inventarioService.procesarArchivoExcel(formData,
        laboratorioId
      )
      setResultado(response.data)
      setActiveStep(2)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al procesar el archivo')
    } finally {
      setLoading(false)
    }
  }

  const ejecutarReabastecimiento = async () => {
    if (!resultado?.datos_validados) {
      setError('No hay datos válidos para procesar')
      return
    }

    try {
      setProcesando(true)
      setError(null)

      await inventarioService.ejecutarReabastecimientoMasivo({
        //conversión
        datos_reabastecimiento: resultado.datos_validados.map(d => ({
          insumo_id: d.insumo_id,
          cantidad: d.cantidad,
          lote: d.insumo_lote,
          fecha_vencimiento: dayjs(d.insumo_fecha_venc).format('YYYY-MM-DD'),
          entrada_detalle_id: null
        })),
        fecha_movimiento: fechaMovimiento,
        motivo_general: comentario,
        laboratorio_id: laboratorioId
      })

      setActiveStep(3)
      onSuccess?.()
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al ejecutar el reabastecimiento')
    } finally {
      setProcesando(false)
    }
  }

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <FileUpload sx={{ fontSize: 80, color: 'secondary.main', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Subir Archivo
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
              Selecciona el archivo Excel completado con los datos de stock que deseas importar.
            </Typography>

            <input
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              id="archivo-excel"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="archivo-excel">
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

            {archivo && (
              <Box sx={{ mt: 3 }}>
                <Chip
                  label={archivo.name}
                  onDelete={() => setArchivo(null)}
                  deleteIcon={<Delete />}
                  color="primary"
                  variant="outlined"
                />
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Tamaño: {(archivo.size / 1024).toFixed(1)} KB
                </Typography>
              </Box>
            )}

            {archivo && (
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                  variant="contained"
                  onClick={procesarArchivo}
                  disabled={loading}
                  startIcon={loading ? <Refresh className="animate-spin" /> : <Preview />}
                >
                  {loading ? 'Procesando...' : 'Procesar Archivo'}
                </Button>
              </Box>
            )}
          </Box>
        )

      case 2:
        return (
          <Box sx={{ py: 2 }}>
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.light' }}>
              <Typography variant="body2" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle sx={{ color: 'success.main' }} />
                {resultado?.registros_validos} insumos encontrados y validados
              </Typography>
            </Paper>

            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Preview color="primary" />
              Previsualización de Datos
            </Typography>

            {resultado && (
              <>
                {/* Resumen */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <Chip
                    icon={<CheckCircle />}
                    label={`${resultado.registros_validos} registros válidos`}
                    color="success"
                    variant="outlined"
                  />
                  {resultado.registros_con_errores > 0 && (
                    <Chip
                      icon={<Error />}
                      label={`${resultado.registros_con_errores} errores`}
                      color="error"
                      variant="outlined"
                    />
                  )}
                  <Chip
                    label={`Archivo: ${resultado.archivo}`}
                    variant="outlined"
                  />
                </Box>

                {/* Errores */}
                {resultado.errores.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Errores encontrados:
                    </Typography>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {resultado.errores.map((error, index) => (
                        <li key={index}>
                          <Typography variant="body2">{error}</Typography>
                        </li>
                      ))}
                    </ul>
                  </Alert>
                )}

                {/* Tabla de datos válidos */}
                {resultado.datos_validados.length > 0 && (
                  <>
                    <Typography variant="subtitle1" gutterBottom>
                      Datos a procesar ({resultado.datos_validados.length} registros):
                    </Typography>
                    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Fila</TableCell>
                            {/* 
                            <TableCell>Código Lab</TableCell>
                            <TableCell>Laboratorio</TableCell>
                            */}
                            <TableCell>Código Insumo</TableCell>
                            <TableCell>Insumo</TableCell>
                            <TableCell>Unidad</TableCell>
                            <TableCell>Lote</TableCell>
                            <TableCell>Fecha Vencimiento</TableCell>
                            <TableCell>Cantidad</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {resultado.datos_validados.map((dato, index) => (
                            <TableRow key={index} hover>
                              <TableCell>{dato.fila}</TableCell>
                              {/* 
                              <TableCell>
                                <Chip label={dato.laboratorio_codigo} size="small" color="secondary" variant="outlined" />
                              </TableCell>
                              <TableCell>{dato.laboratorio_nombre}</TableCell>
                              */}
                              <TableCell>
                                <Chip label={dato.insumo_codigo} size="small" color="primary" variant="outlined" />
                              </TableCell>

                              <TableCell>{dato.insumo_nombre}</TableCell>
                              <TableCell>{dato.insumo_unidad}</TableCell>
                              <TableCell>{dato.insumo_lote}</TableCell>
                              <TableCell>{dato.insumo_fecha_venc}</TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                  +{dato.cantidad}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}

                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={ejecutarReabastecimiento}
                    disabled={resultado.registros_validos === 0 || procesando}
                    startIcon={procesando ? <Refresh className="animate-spin" /> : <CheckCircle />}
                    size="large"
                  >
                    {procesando ? 'Procesando Reabastecimiento...' : `Confirmar Reabastecimiento (${resultado.registros_validos} registros)`}
                  </Button>
                </Box>
              </>
            )}
          </Box>
        )

      case 3:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom color="success.main">
              ¡Reabastecimiento Completado!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              El reabastecimiento masivo se ha ejecutado exitosamente.
              Los stocks han sido actualizados y los movimientos registrados.
            </Typography>
            <Button
              variant="contained"
              onClick={handleClose}
              size="large"
            >
              Finalizar
            </Button>
          </Box>
        )

      default:
        return null
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Carga Masiva de Stock
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              startIcon={<Download />}
              onClick={descargarPlantilla}
              disabled={loading}
              size="small"
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              {loading ? 'Descargando...' : 'Descargar Plantilla'}
            </Button>
            <Button onClick={handleClose} color="inherit" sx={{ minWidth: 'auto' }}>
              <Close />
            </Button>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Filtros siempre visibles y editables - Estilo compacto */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 3, pb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
          <FormControl fullWidth size="small" required>
            <InputLabel>Laboratorio</InputLabel>
            <Select
              value={laboratorioId}
              onChange={(e) => setLaboratorioId(Number(e.target.value))}
              label="Laboratorio"
            >
              <MenuItem value={0}>
                <em>Selecciona un laboratorio</em>
              </MenuItem>
              {laboratorios.map(lab => (
                <MenuItem key={lab.id} value={lab.id}>
                  {lab.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            type="date"
            label="Fecha del Movimiento"
            value={fechaMovimiento}
            onChange={(e) => setFechaMovimiento(e.target.value)}
            InputLabelProps={{ shrink: true }}
            required
            size="small"
          />
          <TextField
            label="Referencia"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Referencia del reabastecimiento"
            size="small"
          />
        </Box>

        {/* Indicador visual de pasos */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, px: 2 }}>
          {steps.map((label, index) => (
            <React.Fragment key={label}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  opacity: activeStep >= index + 1 ? 1 : 0.5
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    backgroundColor: activeStep === index + 1 ? 'primary.main' : activeStep > index + 1 ? 'primary.main' : 'grey.300',
                    color: 'white',
                    fontSize: '0.875rem'
                  }}
                >
                  {activeStep > index + 1 ? <CheckCircle sx={{ fontSize: 24 }} /> : index + 1}
                </Box>
                <Typography variant="caption" sx={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 500 }}>
                  {label}
                </Typography>
              </Box>

              {index < steps.length - 1 && (
                <Box
                  sx={{
                    flex: 1,
                    height: 3,
                    backgroundColor: activeStep > index + 1 ? 'primary.main' : 'grey.300',
                    mx: 1
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </Box>

        {/* Loading indicator */}
        {loading && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
          </Box>
        )}

        {/* Error alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Step content */}
        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        {activeStep === 3 ? (
          <Button onClick={handleClose} variant="contained">
            Cerrar
          </Button>
        ) : (
          <>
            {activeStep > 1 && (
              <Button
                onClick={() => setActiveStep(activeStep - 1)}
                disabled={loading || procesando}
                variant="outlined"
              >
                Atrás
              </Button>
            )}
            <Button onClick={handleClose} variant="outlined" color="inherit">
              Cancelar
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}
