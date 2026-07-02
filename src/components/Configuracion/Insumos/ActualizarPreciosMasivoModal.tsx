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
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material'
import {
  Close,
  CloudUpload,
  PriceChange,
  CheckCircle,
  Error as ErrorIcon,
  Info,
  Refresh,
} from '@mui/icons-material'
import { insumoService } from '../../../services/insumoService'

interface ActualizarPreciosMasivoModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (message?: string) => void
}

interface Resultado {
  success: boolean
  message: string
  actualizados: number
  omitidos: number
  errores: number
  detalles_errores: string[]
  detalles_omitidos: string[]
}

export const ActualizarPreciosMasivoModal: React.FC<ActualizarPreciosMasivoModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    setSelectedFile(null)
    setResultado(null)
    setError(null)
    onClose()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
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
    }
  }

  const handleProcesar = async () => {
    if (!selectedFile) return
    try {
      setLoading(true)
      setError(null)
      const res = await insumoService.actualizarPreciosMasivo(selectedFile)
      setResultado(res)
      if (res.actualizados > 0) {
        onSuccess(res.message)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo')
    } finally {
      setLoading(false)
    }
  }

  const handleReiniciar = () => {
    setSelectedFile(null)
    setResultado(null)
    setError(null)
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <PriceChange color="warning" />
            Importar Precios desde Excel
          </Typography>
          <Button onClick={handleClose} color="inherit" sx={{ minWidth: 'auto' }}>
            <Close />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!resultado && (
          <Box>
            <Alert severity="info" icon={<Info />} sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                Usa el mismo Excel que descargaste con "Exportar Excel" y edita las columnas PRECIO y CANTIDAD_POR_PRESENTACION.
              </Typography>
              <Typography variant="caption" component="div">
                • No modifiques los encabezados (CODIGO, NOMBRE, PRECIO, CANTIDAD_POR_PRESENTACION).<br />
                • PRECIO es el precio de la presentación completa (frasco, caja, botella…).<br />
                • CANTIDAD_POR_PRESENTACION es el contenido en la unidad del insumo (Ej.: 1000 para un frasco de 1000 ml). Si la dejas vacía, el insumo conserva su valor actual.<br />
                • Solo se actualizan insumos existentes (no crea nuevos).<br />
                • Las filas sin cambio se omiten automáticamente.
              </Typography>
            </Alert>

            <Paper
              sx={{
                p: 3,
                textAlign: 'center',
                border: '2px dashed',
                borderColor: selectedFile ? 'success.main' : 'grey.400',
                borderRadius: 2,
              }}
            >
              <CloudUpload sx={{ fontSize: 48, color: selectedFile ? 'success.main' : 'grey.500', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {selectedFile ? selectedFile.name : 'Selecciona un archivo Excel'}
              </Typography>
              {selectedFile && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </Typography>
              )}

              <input
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                id="upload-precios-file"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="upload-precios-file">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUpload />}
                  sx={{ borderRadius: 2, mr: 1 }}
                >
                  {selectedFile ? 'Cambiar archivo' : 'Seleccionar archivo'}
                </Button>
              </label>

              {selectedFile && (
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<PriceChange />}
                  onClick={handleProcesar}
                  disabled={loading}
                  sx={{ borderRadius: 2 }}
                >
                  {loading ? 'Procesando...' : 'Procesar precios'}
                </Button>
              )}

              {loading && <LinearProgress sx={{ mt: 2 }} />}
            </Paper>
          </Box>
        )}

        {resultado && (
          <Box>
            <Alert
              severity={resultado.errores > 0 ? 'warning' : 'success'}
              icon={resultado.errores > 0 ? <ErrorIcon /> : <CheckCircle />}
              sx={{ mb: 3 }}
            >
              {resultado.message}
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <Chip
                icon={<CheckCircle />}
                label={`${resultado.actualizados} actualizados`}
                color="success"
                variant="outlined"
              />
              <Chip
                icon={<Info />}
                label={`${resultado.omitidos} sin cambio`}
                color="info"
                variant="outlined"
              />
              <Chip
                icon={<ErrorIcon />}
                label={`${resultado.errores} con errores`}
                color={resultado.errores > 0 ? 'error' : 'default'}
                variant="outlined"
              />
            </Box>

            {resultado.detalles_errores.length > 0 && (
              <Paper sx={{ mb: 2, p: 2, bgcolor: 'error.lighter' }}>
                <Typography variant="subtitle2" color="error" sx={{ fontWeight: 600, mb: 1 }}>
                  Errores ({resultado.detalles_errores.length})
                </Typography>
                <List dense disablePadding>
                  {resultado.detalles_errores.map((msg, idx) => (
                    <React.Fragment key={idx}>
                      {idx > 0 && <Divider />}
                      <ListItem disableGutters>
                        <ListItemText
                          primary={msg}
                          primaryTypographyProps={{ variant: 'body2', color: 'error.dark' }}
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            )}

            {resultado.detalles_omitidos.length > 0 && (
              <Paper sx={{ p: 2, bgcolor: 'info.lighter' }}>
                <Typography variant="subtitle2" color="info.dark" sx={{ fontWeight: 600, mb: 1 }}>
                  Sin cambio ({resultado.detalles_omitidos.length})
                </Typography>
                <List dense disablePadding>
                  {resultado.detalles_omitidos.map((msg, idx) => (
                    <React.Fragment key={idx}>
                      {idx > 0 && <Divider />}
                      <ListItem disableGutters>
                        <ListItemText
                          primary={msg}
                          primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {resultado && (
          <Button
            onClick={handleReiniciar}
            startIcon={<Refresh />}
            sx={{ borderRadius: 2 }}
          >
            Procesar otro archivo
          </Button>
        )}
        <Button onClick={handleClose} variant="outlined" sx={{ borderRadius: 2 }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
