import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
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
  IconButton,
  Tooltip,
  TextField
} from '@mui/material'
import {
  CloudUpload,
  Download,
  Preview,
  CheckCircle,
  Error,
  Warning,
  Delete,
  Refresh
} from '@mui/icons-material'
import { insumoService } from '../../services/insumoService'

interface CargaMasivaModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface DatoValidado {
  fila: number
  insumo_id: number
  insumo_codigo: string
  insumo_nombre: string
  insumo_unidad: string
  cantidad: number
  laboratorio_id: number
  laboratorio_codigo: string
  laboratorio_nombre: string
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
  const [activeStep, setActiveStep] = useState(0)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<ResultadoProcesamiento | null>(null)
  const [motivoGeneral, setMotivoGeneral] = useState('Carga masiva desde Excel')
  const [procesando, setProcesando] = useState(false)

  const steps = [
    'Descargar Plantilla',
    'Subir Archivo',
    'Previsualizar Datos',
    'Confirmar Reabastecimiento'
  ]

  const handleClose = () => {
    setActiveStep(0)
    setArchivo(null)
    setError(null)
    setResultado(null)
    setMotivoGeneral('Carga masiva desde Excel')
    setProcesando(false)
    onClose()
  }

  const descargarPlantilla = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await insumoService.descargarPlantillaExcel()
      
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
      
      setActiveStep(1)
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

      const response = await insumoService.procesarArchivoExcel(formData)
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

      await insumoService.ejecutarReabastecimientoMasivo({
        datos_reabastecimiento: resultado.datos_validados,
        motivo_general: motivoGeneral
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
      case 0:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Download sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Descargar Plantilla Excel
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Descarga la plantilla Excel que contiene el formato correcto para la carga masiva de stock.
              La plantilla incluye ejemplos y listas de códigos de insumos y laboratorios disponibles.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={descargarPlantilla}
              disabled={loading}
              size="large"
            >
              {loading ? 'Descargando...' : 'Descargar Plantilla'}
            </Button>
          </Box>
        )

      case 1:
        return (
          <Box sx={{ py: 2 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Subir Archivo Excel
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Selecciona el archivo Excel completado con los datos de reabastecimiento
              </Typography>
            </Box>

            <Box sx={{ border: 2, borderColor: 'grey.300', borderStyle: 'dashed', borderRadius: 2, p: 3, textAlign: 'center' }}>
              <input
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                id="archivo-excel"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="archivo-excel">
                <Button variant="outlined" component="span" startIcon={<CloudUpload />}>
                  Seleccionar Archivo Excel
                </Button>
              </label>
              
              {archivo && (
                <Box sx={{ mt: 2 }}>
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
            </Box>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="contained"
                onClick={procesarArchivo}
                disabled={!archivo || loading}
                startIcon={loading ? <Refresh className="animate-spin" /> : <Preview />}
              >
                {loading ? 'Procesando...' : 'Procesar Archivo'}
              </Button>
            </Box>
          </Box>
        )

      case 2:
        return (
          <Box sx={{ py: 2 }}>
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

                {/* Campo para motivo */}
                <TextField
                  fullWidth
                  label="Motivo del reabastecimiento"
                  value={motivoGeneral}
                  onChange={(e) => setMotivoGeneral(e.target.value)}
                  sx={{ mb: 3 }}
                  helperText="Describe el motivo de este reabastecimiento masivo"
                />

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
                            <TableCell>Código Insumo</TableCell>
                            <TableCell>Insumo</TableCell>
                            <TableCell>Cantidad</TableCell>
                            <TableCell>Unidad</TableCell>
                            <TableCell>Código Lab</TableCell>
                            <TableCell>Laboratorio</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {resultado.datos_validados.map((dato, index) => (
                            <TableRow key={index} hover>
                              <TableCell>{dato.fila}</TableCell>
                              <TableCell>
                                <Chip label={dato.insumo_codigo} size="small" color="primary" variant="outlined" />
                              </TableCell>
                              <TableCell>{dato.insumo_nombre}</TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                  +{dato.cantidad}
                                </Typography>
                              </TableCell>
                              <TableCell>{dato.insumo_unidad}</TableCell>
                              <TableCell>
                                <Chip label={dato.laboratorio_codigo} size="small" color="secondary" variant="outlined" />
                              </TableCell>
                              <TableCell>{dato.laboratorio_nombre}</TableCell>
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
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudUpload color="primary" />
          Carga Masiva de Stock
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

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

      <DialogActions>
        <Button onClick={handleClose}>
          {activeStep === 3 ? 'Cerrar' : 'Cancelar'}
        </Button>
        {activeStep > 0 && activeStep < 3 && (
          <Button
            onClick={() => setActiveStep(activeStep - 1)}
            disabled={loading || procesando}
          >
            Atrás
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
