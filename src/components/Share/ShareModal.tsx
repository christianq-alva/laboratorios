import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material'
import {
  Close,
  Share,
  ContentCopy,
  Link,
  Delete,
  Visibility,
  LocationOn,
  Schedule,
} from '@mui/icons-material'
import { shareService, type ShareLink } from '../../services/shareService'
import { laboratorioService, type Laboratorio } from '../../services/laboratorioService'
import dayjs from 'dayjs'

interface ShareModalProps {
  open: boolean
  onClose: () => void
  selectedLaboratorioId?: number
}

export const ShareModal: React.FC<ShareModalProps> = ({
  open,
  onClose,
  selectedLaboratorioId
}) => {
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingLinks, setLoadingLinks] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Estados del formulario
  const [selectedLabId, setSelectedLabId] = useState<number>(selectedLaboratorioId || 0)
  const [expirationDays, setExpirationDays] = useState<number>(30)

  // Cargar datos iniciales
  useEffect(() => {
    if (open) {
      loadInitialData()
    }
  }, [open])

  // Actualizar laboratorio seleccionado cuando cambie el prop
  useEffect(() => {
    if (selectedLaboratorioId) {
      setSelectedLabId(selectedLaboratorioId)
    }
  }, [selectedLaboratorioId])

  const loadInitialData = async () => {
    try {
      setLoadingLinks(true)
      
      const [labsResult, linksResult] = await Promise.all([
        laboratorioService.getAll(),
        shareService.getMyShareLinks()
      ])
      
      if (labsResult.success) {
        setLaboratorios(labsResult.data || [])
      }
      
      if (linksResult.success) {
        setShareLinks(linksResult.data || [])
      }
    } catch (err: any) {
      console.error('Error al cargar datos:', err)
      setError(err.message || 'Error al cargar datos')
    } finally {
      setLoadingLinks(false)
    }
  }

  const handleCreateLink = async () => {
    if (!selectedLabId) {
      setError('Selecciona un laboratorio')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      
      const result = await shareService.createShareLink({
        laboratorio_id: selectedLabId,
        expires_in_days: expirationDays
      })
      
      if (result.success) {
        console.log('🔗 URL recibida del backend:', result.data.url)
        setSuccess(`Enlace creado para ${result.data.laboratorio_nombre}`)
        
        // Recargar enlaces
        const linksResult = await shareService.getMyShareLinks()
        if (linksResult.success) {
          setShareLinks(linksResult.data || [])
        }
        
        // Copiar automáticamente al portapapeles
        const copied = await shareService.copyToClipboard(result.data.url)
        if (copied) {
          setSuccess(prev => prev + ' • Copiado al portapapeles')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear enlace')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = async (url: string, labName: string) => {
    try {
      const copied = await shareService.copyToClipboard(url)
      if (copied) {
        setSuccess(`Enlace de ${labName} copiado al portapapeles`)
      } else {
        setError('No se pudo copiar el enlace')
      }
    } catch (err) {
      setError('Error al copiar enlace')
    }
  }

  const handleDeactivateLink = async (id: number, labName: string) => {
    try {
      setLoadingLinks(true)
      
      const result = await shareService.deactivateShareLink(id)
      if (result.success) {
        setSuccess(`Enlace de ${labName} desactivado`)
        
        // Recargar enlaces
        const linksResult = await shareService.getMyShareLinks()
        if (linksResult.success) {
          setShareLinks(linksResult.data || [])
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al desactivar enlace')
    } finally {
      setLoadingLinks(false)
    }
  }

  const handleClose = () => {
    setError(null)
    setSuccess(null)
    onClose()
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
            <Share color="primary" />
            <Typography variant="h6">
              Enlaces Compartibles
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
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

          {/* Información */}
          <Alert severity="info" icon={<Visibility />}>
            <Typography variant="body2">
              Los enlaces compartibles permiten que cualquier persona vea los horarios de un laboratorio 
              sin necesidad de iniciar sesión. Solo tendrán permisos de visualización.
            </Typography>
          </Alert>

          {/* Crear nuevo enlace */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Link />
              Crear Nuevo Enlace
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <FormControl sx={{ minWidth: 250 }}>
                <InputLabel>Laboratorio</InputLabel>
                <Select
                  value={selectedLabId}
                  label="Laboratorio"
                  onChange={(e) => setSelectedLabId(e.target.value as number)}
                  disabled={loading}
                >
                  <MenuItem value={0} disabled>
                    Seleccionar laboratorio
                  </MenuItem>
                  {laboratorios.map((lab) => (
                    <MenuItem key={lab.id} value={lab.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOn fontSize="small" />
                        {lab.nombre} - {lab.ubicacion}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Expiración</InputLabel>
                <Select
                  value={expirationDays}
                  label="Expiración"
                  onChange={(e) => setExpirationDays(e.target.value as number)}
                  disabled={loading}
                >
                  <MenuItem value={7}>1 semana</MenuItem>
                  <MenuItem value={30}>1 mes</MenuItem>
                  <MenuItem value={90}>3 meses</MenuItem>
                  <MenuItem value={365}>1 año</MenuItem>
                </Select>
              </FormControl>
              
              <Button
                variant="contained"
                onClick={handleCreateLink}
                disabled={loading || !selectedLabId}
                startIcon={loading ? <CircularProgress size={20} /> : <Share />}
                sx={{ height: 56 }}
              >
                {loading ? 'Creando...' : 'Crear Enlace'}
              </Button>
            </Box>
          </Box>

          <Divider />

          {/* Enlaces existentes */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Schedule />
              Enlaces Activos ({shareLinks.filter(link => link.activo && !link.expirado).length})
            </Typography>
            
            {loadingLinks ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress />
              </Box>
            ) : shareLinks.length === 0 ? (
              <Alert severity="info">
                No tienes enlaces compartibles creados
              </Alert>
            ) : (
              <List>
                {shareLinks.map((link, index) => (
                  <React.Fragment key={link.id}>
                    <ListItem sx={{ px: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                        <LocationOn fontSize="small" color="action" />
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {link.laboratorio_nombre}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {link.laboratorio_ubicacion}
                            {link.escuela && ` • ${link.escuela}`}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <ListItemText
                        secondary={
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Chip
                                size="small"
                                label={link.activo && !link.expirado ? 'Activo' : 'Inactivo'}
                                color={link.activo && !link.expirado ? 'success' : 'default'}
                                variant="outlined"
                              />
                              {link.expirado && (
                                <Chip
                                  size="small"
                                  label="Expirado"
                                  color="error"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              Expira: {dayjs(link.fecha_expiracion).format('DD/MM/YYYY HH:mm')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Creado: {dayjs(link.created_at).format('DD/MM/YYYY HH:mm')}
                            </Typography>
                          </Box>
                        }
                      />
                      
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Copiar enlace">
                            <IconButton
                              size="small"
                              onClick={() => handleCopyLink(link.url, link.laboratorio_nombre)}
                              disabled={!link.activo || link.expirado}
                            >
                              <ContentCopy />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Abrir en nueva pestaña">
                            <IconButton
                              size="small"
                              onClick={() => window.open(link.url, '_blank')}
                              disabled={!link.activo || link.expirado}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Desactivar enlace">
                            <IconButton
                              size="small"
                              onClick={() => handleDeactivateLink(link.id, link.laboratorio_nombre)}
                              disabled={!link.activo}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < shareLinks.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
