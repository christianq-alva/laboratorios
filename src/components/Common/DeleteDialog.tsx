import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  Alert,
  CircularProgress,
  Box
} from '@mui/material'

export interface DeleteDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title?: string
  itemName: string
  itemType?: string
  warningMessage?: string
  additionalContent?: React.ReactNode
  loading?: boolean
  confirmButtonText?: string
  cancelButtonText?: string
}

export const DeleteDialog: React.FC<DeleteDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title = 'Confirmar Eliminación',
  itemName,
  itemType,
  warningMessage,
  additionalContent,
  loading = false,
  confirmButtonText = 'Eliminar',
  cancelButtonText = 'Cancelar'
}) => {
  const handleConfirm = async () => {
    await onConfirm()
  }

  const getMessage = () => {
    if (itemType) {
      return `¿Está seguro que desea eliminar ${itemType} "${itemName}"?`
    }
    return `¿Está seguro que desea eliminar "${itemName}"?`
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {getMessage()}
        </DialogContentText>
        {warningMessage && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {warningMessage}
          </Alert>
        )}
        {additionalContent && (
          <Box sx={{ mt: 2 }}>
            {additionalContent}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          disabled={loading}
        >
          {cancelButtonText}
        </Button>
        <Button
          onClick={handleConfirm}
          color="error"
          variant="contained"
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={20} />
          ) : (
            confirmButtonText
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

