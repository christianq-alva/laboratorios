import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Alert,
  Divider,
  IconButton
} from '@mui/material'
import { TableChart, Close } from '@mui/icons-material'
import * as XLSX from 'xlsx'
import { laboratorioService, type Laboratorio } from '../../services/laboratorioService'
import { horarioService } from '../../services/horarioService'
import { useApi } from '../../hooks/useApi'
import dayjs from 'dayjs'

interface ExportExcelModalProps {
  open: boolean
  onClose: () => void
}

const sanitizeSheetName = (name: string) =>
  name.replace(/[\\\/\?\*\[\]:]/g, '').substring(0, 31)

const formatDateTime = (dateStr: string) =>
  dayjs(dateStr).format('DD/MM/YYYY HH:mm')

const estadoLabel = (estado: string) =>
  estado === 'P' ? 'Pendiente' : 'Cerrado'

export const ExportExcelModal: React.FC<ExportExcelModalProps> = ({ open, onClose }) => {
  const { execute } = useApi()
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) loadLaboratorios()
  }, [open])

  const loadLaboratorios = async () => {
    setLoading(true)
    setError(null)
    const response = await execute(() => laboratorioService.getAll())
    if (response.error) {
      setError(response.error)
    } else if (response.data) {
      const labs: Laboratorio[] = response.data.data
      setLaboratorios(labs)
      setSelectedIds(labs.map(l => l.id))
    }
    setLoading(false)
  }

  const handleToggleLab = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleToggleAll = () => {
    setSelectedIds(
      selectedIds.length === laboratorios.length ? [] : laboratorios.map(l => l.id)
    )
  }

  const handleExport = async () => {
    if (selectedIds.length === 0) return
    setExporting(true)
    setError(null)

    const response = await execute(() => horarioService.getAll())
    if (response.error) {
      setError(response.error)
      setExporting(false)
      return
    }

    const allHorarios = response.data?.data ?? []
    const wb = XLSX.utils.book_new()
    const selectedLabs = laboratorios.filter(l => selectedIds.includes(l.id))

    for (const lab of selectedLabs) {
      const labHorarios = allHorarios.filter((h: { laboratorio_id: number }) => h.laboratorio_id === lab.id)

      const sheetData = labHorarios.length > 0
        ? labHorarios.map((h: {
            fecha_inicio: string
            fecha_fin: string
            escuela?: string
            docente?: string
            ciclo?: string
            descripcion: string
            estado: string
          }) => ({
            'Fecha Inicio': formatDateTime(h.fecha_inicio),
            'Fecha Fin': formatDateTime(h.fecha_fin),
            'Escuela': h.escuela ?? '',
            'Docente': h.docente ?? '',
            'Ciclo': h.ciclo ?? '',
            'Descripción': h.descripcion,
            'Estado': estadoLabel(h.estado),
          }))
        : [{ 'Fecha Inicio': '', 'Fecha Fin': '', 'Escuela': '', 'Docente': '', 'Ciclo': '', 'Descripción': 'Sin horarios registrados', 'Estado': '' }]

      const ws = XLSX.utils.json_to_sheet(sheetData)

      // Ancho de columnas
      ws['!cols'] = [
        { wch: 18 }, // Fecha Inicio
        { wch: 18 }, // Fecha Fin
        { wch: 30 }, // Escuela
        { wch: 30 }, // Docente
        { wch: 20 }, // Ciclo
        { wch: 40 }, // Descripción
        { wch: 12 }, // Estado
      ]

      XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(lab.nombre))
    }

    XLSX.writeFile(wb, `horarios_${dayjs().format('YYYY-MM-DD')}.xlsx`)
    setExporting(false)
    handleClose()
  }

  const handleClose = () => {
    if (exporting) return
    setSelectedIds([])
    setLaboratorios([])
    setError(null)
    onClose()
  }

  const allSelected = laboratorios.length > 0 && selectedIds.length === laboratorios.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < laboratorios.length

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TableChart color="success" />
            Exportar Horarios a Excel
          </Typography>
          <IconButton onClick={handleClose} disabled={exporting} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Selecciona los laboratorios a incluir. Cada laboratorio se exportará en una hoja separada del Excel.
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <FormControlLabel
              control={
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={handleToggleAll}
                  size="small"
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Seleccionar todos ({laboratorios.length})
                </Typography>
              }
            />
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {laboratorios.map(lab => (
                <FormControlLabel
                  key={lab.id}
                  control={
                    <Checkbox
                      checked={selectedIds.includes(lab.id)}
                      onChange={() => handleToggleLab(lab.id)}
                      size="small"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">{lab.nombre}</Typography>
                      {lab.ubicacion && (
                        <Typography variant="caption" color="text.secondary">
                          {lab.ubicacion}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              ))}
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" disabled={exporting}>
          Cancelar
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          color="success"
          disabled={selectedIds.length === 0 || exporting || loading}
          startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <TableChart />}
        >
          {exporting
            ? 'Exportando...'
            : `Exportar ${selectedIds.length} laboratorio${selectedIds.length !== 1 ? 's' : ''}`
          }
        </Button>
      </DialogActions>
    </Dialog>
  )
}
