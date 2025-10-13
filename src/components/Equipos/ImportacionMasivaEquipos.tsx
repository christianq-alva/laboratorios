import React, { useState } from 'react'
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tooltip
} from '@mui/material'
import {
  Close,
  CloudUpload,
  GetApp,
  CheckCircle,
  Error,
  Warning,
  ExpandMore,
  Upload,
  Refresh,
  Memory,
  Build,
  Visibility,
  ArrowBack
} from '@mui/icons-material'
import { equipoService } from '../../services/equipoService'

interface ImportacionMasivaEquiposProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface PreviewDataEquipo {
  fila: number
  nombre: string
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
  inventario_labs: { [key: string]: number }
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
    inventario: string
  }>
}

export const ImportacionMasivaEquipos: React.FC<ImportacionMasivaEquiposProps> = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<PreviewResponseEquipo | null>(null)
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const handleClose = () => {
    setSelectedFile(null)
    setPreview(null)
    setResultado(null)
    setError(null)
    setShowPreview(false)
    onClose()
  }

  const handleDescargarPlantilla = async () => {
    try {
      setLoading(true)
      setError(null)
      await equipoService.descargarPlantillaImportacion()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validar que sea un archivo Excel
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ]
      
      if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
        setError('Por favor selecciona un archivo Excel válido (.xlsx o .xls)')
        return
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo es demasiado grande. Máximo 5MB.')
        return
      }
      
      setSelectedFile(file)
      setError(null)
    }
  }

  const handlePrevisualizarArchivo = async () => {
    if (!selectedFile) return
    
    try {
      setLoading(true)
      setError(null)
      
      const previewData = await equipoService.previsualizarImportacion(selectedFile)
      setPreview(previewData)
      setShowPreview(true)
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVolverAlArchivo = () => {
    setShowPreview(false)
    setPreview(null)
  }

  const handleProcesarArchivo = async () => {
    if (!selectedFile) return
    
    try {
      setLoading(true)
      setError(null)
      
      const resultado = await equipoService.importacionMasiva(selectedFile)
      setResultado(resultado)
      
      if (resultado.success && resultado.procesados > 0) {
        onSuccess() // Refrescar la tabla de equipos
      }
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReiniciar = () => {
    setSelectedFile(null)
    setPreview(null)
    setResultado(null)
    setError(null)
    setShowPreview(false)
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Operativo': return 'success'
      case 'En Mantenimiento': return 'warning'
      case 'Fuera de Servicio': return 'error'
      default: return 'info'
    }
  }

  const getCondicionColor = (condicion: string) => {
    switch (condicion) {
      case 'Excelente': return 'success'
      case 'Bueno': return 'info'
      case 'Regular': return 'warning'
      case 'Malo': return 'error'
      default: return 'default'
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, minHeight: '70vh' } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudUpload color="primary" />
            Importación Masiva de Equipos
          </Typography>
          <Button onClick={handleClose} color="inherit" sx={{ minWidth: 'auto' }}>
            <Close />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Error global */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Pantalla principal de importación */}
        {!resultado && !showPreview && (
          <Box>
            {/* Opciones principales */}
            <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
              {/* Opción 1: Descargar Plantilla */}
              <Paper sx={{ flex: 1, p: 3, textAlign: 'center', border: '2px solid', borderColor: 'primary.light', borderRadius: 2 }}>
                <GetApp sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Descargar Plantilla
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Descarga la plantilla Excel con todas las columnas, ejemplos e instrucciones.
                </Typography>
                
                <Button
                  variant="contained"
                  startIcon={<GetApp />}
                  onClick={handleDescargarPlantilla}
                  disabled={loading}
                  sx={{ borderRadius: 2, width: '100%' }}
                >
                  {loading ? 'Generando...' : 'Descargar Plantilla'}
                </Button>
              </Paper>

              {/* Opción 2: Cargar Archivo */}
              <Paper sx={{ flex: 1, p: 3, textAlign: 'center', border: '2px solid', borderColor: 'secondary.light', borderRadius: 2 }}>
                <Upload sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Cargar Archivo Excel
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Selecciona el archivo Excel completado con los datos de equipos.
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
                    sx={{ borderRadius: 2, width: '100%' }}
                  >
                    Seleccionar Archivo
                  </Button>
                </label>
              </Paper>
            </Box>

            {/* Archivo seleccionado */}
            {selectedFile && (
              <Paper sx={{ p: 3, mb: 3, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.main' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CheckCircle color="success" />
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        Archivo seleccionado: {selectedFile.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tamaño: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={handlePrevisualizarArchivo}
                      disabled={loading}
                      sx={{ borderRadius: 2 }}
                    >
                      {loading ? 'Procesando...' : 'Previsualizar'}
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Upload />}
                      onClick={handleProcesarArchivo}
                      disabled={loading}
                      sx={{ borderRadius: 2 }}
                    >
                      {loading ? 'Procesando...' : 'Importar Directamente'}
                    </Button>
                  </Box>
                </Box>
                
                {loading && (
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress />
                    <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                      Procesando archivo... Esto puede tomar unos minutos.
                    </Typography>
                  </Box>
                )}
              </Paper>
            )}

            {/* Información y requisitos */}
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Paper sx={{ flex: 1, p: 2, bgcolor: 'info.50' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1, color: 'info.main' }}>
                  📋 La plantilla incluye:
                </Typography>
                <Typography variant="body2" component="div">
                  • Todas las columnas del módulo de equipos<br/>
                  • Ejemplos de equipos médicos y de laboratorio<br/>
                  • Instrucciones detalladas de validaciones<br/>
                  • Lista de laboratorios disponibles<br/>
                  • Formatos requeridos para fechas y estados
                </Typography>
              </Paper>

              <Paper sx={{ flex: 1, p: 2, bgcolor: 'warning.50' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1, color: 'warning.main' }}>
                  ⚠️ Requisitos del archivo:
                </Typography>
                <Typography variant="body2" component="div">
                  • Formato: .xlsx o .xls<br/>
                  • Tamaño máximo: 5MB<br/>
                  • Usar la plantilla descargada<br/>
                  • No modificar los nombres de las columnas<br/>
                  • Eliminar la hoja "INSTRUCCIONES" antes de cargar
                </Typography>
              </Paper>
            </Box>
          </Box>
        )}

        {/* Previsualización */}
        {showPreview && preview && (
          <Box>
            {/* Header de previsualización */}
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.main' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Visibility color="info" />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Previsualización de Importación
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {preview.total_filas} equipos encontrados en el archivo
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<ArrowBack />}
                    onClick={handleVolverAlArchivo}
                    sx={{ borderRadius: 2 }}
                  >
                    Volver
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Upload />}
                    onClick={handleProcesarArchivo}
                    disabled={loading}
                    sx={{ borderRadius: 2 }}
                  >
                    {loading ? 'Importando...' : 'Confirmar Importación'}
                  </Button>
                </Box>
              </Box>
              
              {loading && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress />
                  <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                    Importando equipos... Esto puede tomar unos minutos.
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Tabla de previsualización */}
            <Paper sx={{ mb: 3 }}>
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fila</TableCell>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Marca/Modelo</TableCell>
                      <TableCell>Serie</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Condición</TableCell>
                      <TableCell>Fecha Adq.</TableCell>
                      <TableCell>Inventario</TableCell>
                      <TableCell>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {preview.data.map((item, index) => (
                      <TableRow key={index} sx={{ 
                        bgcolor: item.errores.length > 0 ? 'error.50' : 'inherit'
                      }}>
                        <TableCell>{item.fila}</TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {item.nombre || 'Sin nombre'}
                            </Typography>
                            {item.descripcion && (
                              <Typography variant="caption" color="text.secondary">
                                {item.descripcion.substring(0, 50)}...
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.marca} {item.modelo}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {item.numero_serie || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            icon={<Build />}
                            label={item.estado} 
                            size="small" 
                            color={getEstadoColor(item.estado)}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={item.condicion} 
                            size="small" 
                            color={getCondicionColor(item.condicion)}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {item.fecha_adquisicion ? (
                            new Date(item.fecha_adquisicion).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Box>
                            {Object.entries(item.inventario_labs).map(([lab, cantidad]) => (
                              <Chip 
                                key={lab}
                                label={`${lab}: ${cantidad}`}
                                size="small"
                                variant="outlined"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ))}
                            {Object.keys(item.inventario_labs).length === 0 && (
                              <Typography variant="caption" color="text.secondary">
                                Sin inventario inicial
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {item.errores.length > 0 ? (
                            <Tooltip title={item.errores.join(', ')}>
                              <Chip 
                                icon={<Error />}
                                label={`${item.errores.length} error(es)`}
                                size="small"
                                color="error"
                                variant="outlined"
                              />
                            </Tooltip>
                          ) : (
                            <Chip 
                              icon={<CheckCircle />}
                              label="Válido"
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Resumen de errores en previsualización */}
            {preview.data.some(item => item.errores.length > 0) && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning color="error" />
                    Errores de Validación
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    {preview.data
                      .filter(item => item.errores.length > 0)
                      .map((item, index) => (
                        <React.Fragment key={index}>
                          <ListItem>
                            <ListItemText
                              primary={`Fila ${item.fila}: ${item.nombre || 'Sin nombre'}`}
                              secondary={item.errores.join(', ')}
                              primaryTypographyProps={{ fontWeight: 500 }}
                              secondaryTypographyProps={{ color: 'error.main' }}
                            />
                          </ListItem>
                          {index < preview.data.filter(i => i.errores.length > 0).length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            )}
          </Box>
        )}

        {/* Resultados */}
        {resultado && (
          <Box>
            {/* Resumen */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {resultado.success ? (
                  <CheckCircle color="success" />
                ) : (
                  <Error color="error" />
                )}
                <Typography variant="h6">
                  {resultado.success ? 'Importación Completada' : 'Importación con Errores'}
                </Typography>
              </Box>

              <Typography variant="body1" sx={{ mb: 2 }}>
                {resultado.message}
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  icon={<CheckCircle />}
                  label={`${resultado.procesados} Procesados`}
                  color="success"
                  variant="outlined"
                />
                {resultado.errores > 0 && (
                  <Chip
                    icon={<Error />}
                    label={`${resultado.errores} Errores`}
                    color="error"
                    variant="outlined"
                  />
                )}
              </Box>
            </Paper>

            {/* Equipos creados exitosamente */}
            {resultado.resultados.length > 0 && (
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle color="success" />
                    Equipos Creados ({resultado.resultados.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Fila</TableCell>
                          <TableCell>Código</TableCell>
                          <TableCell>Nombre</TableCell>
                          <TableCell>Marca/Modelo</TableCell>
                          <TableCell>Estado</TableCell>
                          <TableCell>Inventario</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {resultado.resultados.map((item) => (
                          <TableRow key={item.fila}>
                            <TableCell>{item.fila}</TableCell>
                            <TableCell>
                              <Chip 
                                icon={<Memory />}
                                label={item.codigo} 
                                size="small" 
                                variant="outlined" 
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {item.nombre}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {item.marca} {item.modelo}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                icon={<Build />}
                                label={item.estado} 
                                size="small" 
                                color={getEstadoColor(item.estado)}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {item.inventario}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Errores */}
            {resultado.detalles_errores.length > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning color="error" />
                    Errores Encontrados ({resultado.detalles_errores.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    {resultado.detalles_errores.map((error, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemText
                            primary={error}
                            primaryTypographyProps={{ 
                              variant: 'body2',
                              color: 'error.main'
                            }}
                          />
                        </ListItem>
                        {index < resultado.detalles_errores.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        {resultado ? (
          <>
            <Button
              onClick={handleReiniciar}
              startIcon={<Refresh />}
              variant="outlined"
            >
              Nueva Importación
            </Button>
            <Button onClick={handleClose} variant="contained">
              Cerrar
            </Button>
          </>
        ) : (
          <Button onClick={handleClose} variant="outlined">
            Cancelar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}