import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Switch,
  Alert,
  CircularProgress,
  IconButton,
  Paper,
  Divider,
} from '@mui/material'
import {
  Close,
  Download,
  Image,
  PictureAsPdf,
  Preview,
  Settings,
} from '@mui/icons-material'
import { exportService, type ExportOptions } from '../../services/exportService'
import dayjs from 'dayjs'

interface ExportModalProps {
  open: boolean
  onClose: () => void
  laboratorioNombre?: string
  semanaInicio?: Date
  elementId: string
}

export const ExportModal: React.FC<ExportModalProps> = ({
  open,
  onClose,
  laboratorioNombre,
  semanaInicio,
  elementId
}) => {
  const [format, setFormat] = useState<'png' | 'pdf'>('pdf')
  const [filename, setFilename] = useState('')
  const [includeHeader, setIncludeHeader] = useState(true)
  const [quality, setQuality] = useState(2)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  // Generar nombre de archivo por defecto
  React.useEffect(() => {
    if (open && !filename) {
      const fecha = semanaInicio ? dayjs(semanaInicio).format('DD-MM-YYYY') : dayjs().format('DD-MM-YYYY')
      const lab = laboratorioNombre ? laboratorioNombre.replace(/[^a-zA-Z0-9]/g, '_') : 'Calendario'
      const extension = format === 'pdf' ? 'pdf' : 'png'
      setFilename(`${lab}_Semana_${fecha}.${extension}`)
    }
  }, [open, format, laboratorioNombre, semanaInicio, filename])

  const handleExport = async () => {
    if (!elementId) {
      setError('No se puede exportar: elemento no encontrado')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const options: ExportOptions = {
        filename,
        laboratorioNombre,
        semanaInicio,
        format,
        includeHeader,
        quality
      }

      let result
      if (format === 'pdf') {
        result = await exportService.exportAsPDF(elementId, options)
      } else {
        result = await exportService.exportAsImage(elementId, options)
      }

      if (result.success) {
        setSuccess(`${format.toUpperCase()} descargado exitosamente: ${result.filename}`)
      }

    } catch (err: any) {
      setError(err.message || 'Error al exportar calendario')
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePreview = async () => {
    try {
      setError(null)
      const previewUrl = await exportService.generatePreview(elementId)
      setPreview(previewUrl)
    } catch (err: any) {
      setError('Error al generar vista previa')
    }
  }

  const handleClose = () => {
    if (!loading) {
      setError(null)
      setSuccess(null)
      setPreview(null)
      onClose()
    }
  }

  const handleFormatChange = (newFormat: 'png' | 'pdf') => {
    setFormat(newFormat)
    // Actualizar extensión del archivo
    if (filename) {
      const nameWithoutExt = filename.replace(/\.(png|pdf)$/, '')
      setFilename(`${nameWithoutExt}.${newFormat}`)
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Download color="primary" />
            <Typography variant="h6">
              Exportar Calendario
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small" disabled={loading}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Alertas */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {/* Información del calendario */}
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" gutterBottom>
              Información del Calendario
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {laboratorioNombre && (
                <Typography variant="body2">
                  <strong>Laboratorio:</strong> {laboratorioNombre}
                </Typography>
              )}
              <Typography variant="body2">
                <strong>Semana:</strong> {semanaInicio 
                  ? `${dayjs(semanaInicio).format('DD/MM/YYYY')} - ${dayjs(semanaInicio).add(6, 'day').format('DD/MM/YYYY')}`
                  : 'Semana actual'
                }
              </Typography>
              <Typography variant="body2">
                <strong>Generado:</strong> {dayjs().format('DD/MM/YYYY HH:mm')}
              </Typography>
            </Box>
          </Paper>

          {/* Opciones de formato */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Settings />
              Opciones de Exportación
            </Typography>
            
            <FormControl component="fieldset">
              <FormLabel component="legend">Formato de archivo</FormLabel>
              <RadioGroup
                row
                value={format}
                onChange={(e) => handleFormatChange(e.target.value as 'png' | 'pdf')}
              >
                <FormControlLabel
                  value="pdf"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PictureAsPdf />
                      PDF (Recomendado)
                    </Box>
                  }
                />
                <FormControlLabel
                  value="png"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Image />
                      Imagen PNG
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
          </Box>

          {/* Nombre de archivo */}
          <TextField
            fullWidth
            label="Nombre del archivo"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            disabled={loading}
            helperText={`El archivo se descargará como: ${filename}`}
          />

          {/* Opciones adicionales */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Opciones Adicionales
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={includeHeader}
                    onChange={(e) => setIncludeHeader(e.target.checked)}
                    disabled={loading}
                  />
                }
                label="Incluir información del laboratorio y fecha"
              />
              
              {format === 'png' && (
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Calidad de imagen
                  </Typography>
                  <FormControl component="fieldset">
                    <RadioGroup
                      row
                      value={quality}
                      onChange={(e) => setQuality(parseInt(e.target.value))}
                    >
                      <FormControlLabel value={1} control={<Radio />} label="Normal" />
                      <FormControlLabel value={2} control={<Radio />} label="Alta" />
                      <FormControlLabel value={3} control={<Radio />} label="Muy Alta" />
                    </RadioGroup>
                  </FormControl>
                </Box>
              )}
            </Box>
          </Box>

          <Divider />

          {/* Vista previa */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle2">
                Vista Previa
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Preview />}
                onClick={handleGeneratePreview}
                disabled={loading}
              >
                Generar Preview
              </Button>
            </Box>
            
            {preview && (
              <Paper sx={{ p: 1, textAlign: 'center' }}>
                <img 
                  src={preview} 
                  alt="Vista previa del calendario"
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '300px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </Paper>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
        >
          Cancelar
        </Button>
        
        <Button
          onClick={handleExport}
          disabled={loading || !filename.trim()}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <Download />}
        >
          {loading ? 'Exportando...' : `Descargar ${format.toUpperCase()}`}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
