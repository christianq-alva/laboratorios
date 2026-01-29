import React, { useState } from 'react'
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Divider,
} from '@mui/material'
import { MoreVert, Edit, Delete } from '@mui/icons-material'

export interface ActionMenuItemGroup {
  label: string
  icon: React.ReactNode
  onClick: () => void
  color?: 'primary' | 'error' | 'warning' | 'success' | 'info'
  disabled?: boolean
}

export interface ActionMenuSectionGroup {
  label: string
  items: ActionMenuItemGroup[]
}

export interface ActionMenuProps {
  onEdit: () => void
  onDelete: () => void
  sections?: ActionMenuSectionGroup[]
  disabled?: boolean
}

export const ActionMenu: React.FC<ActionMenuProps> = ({
  onEdit,
  onDelete,
  sections = [],
  disabled = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleEdit = () => {
    onEdit()
    handleMenuClose()
  }

  const handleDelete = () => {
    onDelete()
    handleMenuClose()
  }

  const handleItemClick = (callback: () => void) => {
    callback()
    handleMenuClose()
  }

  return (
    <>
      <Tooltip title="Acciones">
        <IconButton
          size="small"
          onClick={handleMenuOpen}
          disabled={disabled}
        >
          <MoreVert fontSize="small" />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>

        {sections.length > 0 && (
          <>
            {sections.map((section, sectionIndex) => (
              <React.Fragment key={`section-${sectionIndex}`}>
                <Divider sx={{ my: 0.5 }} />
                {/* Encabezado de sección */}
                <MenuItem disabled sx={{ fontSize: '0.875rem', color: 'text.secondary', py: 0.5 }}>
                  <ListItemText primary={section.label} sx={{ fontSize: '0.875rem' }} />
                </MenuItem>
                {/* Items de la sección */}
                {section.items.map((item, itemIndex) => (
                  <MenuItem
                    key={`item-${sectionIndex}-${itemIndex}`}
                    onClick={() => handleItemClick(item.onClick)}
                    disabled={item.disabled}
                  >
                    <ListItemIcon sx={{ color: item.color ? `${item.color}.main` : 'inherit' }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText>{item.label}</ListItemText>
                  </MenuItem>
                ))}
              </React.Fragment>
            ))}
          </>
        )}

        <Divider sx={{ my: 0.5 }} />

        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Eliminar</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}
