import React, { useState } from 'react'
import {
  Box,
  Drawer,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard,
  School,
  Person,
  Schedule,
  Inventory,
  Build,
  ReportProblem,
  Assessment,
  Settings,
  Logout
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/authContext'

const DRAWER_WIDTH = 280

interface MainLayoutProps {
  children: React.ReactNode
}

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', roles: ['Administrador', 'Jefe de Laboratorio'] },
  { text: 'Laboratorios', icon: <School />, path: '/laboratorios', roles: ['Administrador', 'Jefe de Laboratorio'] },
  { text: 'Docentes', icon: <Person />, path: '/docentes', roles: ['Administrador', 'Jefe de Laboratorio'] },
  { text: 'Horarios', icon: <Schedule />, path: '/horarios', roles: ['Administrador', 'Jefe de Laboratorio'] },
  { text: 'Insumos', icon: <Inventory />, path: '/insumos', roles: ['Administrador', 'Jefe de Laboratorio'] },
  { text: 'Equipos', icon: <Build />, path: '/equipos', roles: ['Administrador', 'Jefe de Laboratorio'] },
  { text: 'Incidencias', icon: <ReportProblem />, path: '/incidencias', roles: ['Administrador', 'Jefe de Laboratorio'] },
  { text: 'Reportes', icon: <Assessment />, path: '/reportes', roles: ['Administrador', 'Jefe de Laboratorio'] },
  { text: 'Configuración', icon: <Settings />, path: '/configuracion', roles: ['Administrador'] },
]

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.rol || '')
  )

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header del Sidebar */}
      <Box sx={{ 
        p: 2, 
        textAlign: 'center', 
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2e5984 100%)',
        color: 'white',
        position: 'relative'
      }}>
        {/* Botón de menú para móviles */}
        <IconButton
          onClick={handleDrawerToggle}
          sx={{ 
            position: 'absolute',
            left: 8,
            top: 8,
            color: 'white',
            display: { sm: 'none' }
          }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography variant="h6" component="div" fontWeight={600}>
          Sistema Laboratorios
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5, color: '#ffc947' }}>
          Universidad Peruana Unión
        </Typography>
      </Box>

      <Divider />

      {/* Info del Usuario */}
      <Box sx={{ p: 2, backgroundColor: 'grey.50' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
            {user?.nombre?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {user?.nombre}
            </Typography>
            <Chip 
              label={user?.rol} 
              size="small" 
              color="primary" 
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* Menu Items */}
      <List sx={{ px: 1, flex: 1 }}>
        {filteredMenuItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 1,
                  mx: 1,
                  backgroundColor: isActive ? 'primary.main' : 'transparent',
                  color: isActive ? 'white' : 'text.primary',
                  '&:hover': {
                    backgroundColor: isActive ? 'primary.dark' : 'action.hover',
                  },
                }}
              >
                <ListItemIcon sx={{ 
                  color: isActive ? 'white' : 'primary.main',
                  minWidth: 40 
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500
                  }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      {/* Profile Actions at Bottom */}
      <Box sx={{ mt: 'auto', p: 1 }}>
        <Divider sx={{ mb: 1 }} />
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 1,
              mx: 1,
              color: 'error.main',
              '&:hover': {
                backgroundColor: 'error.light',
                color: 'error.dark',
              },
            }}
          >
            <ListItemIcon sx={{ 
              color: 'error.main',
              minWidth: 40 
            }}>
              <Logout />
            </ListItemIcon>
            <ListItemText 
              primary="Cerrar Sesión"
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            />
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: DRAWER_WIDTH,
              borderRight: '1px solid #e0e0e0'
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: DRAWER_WIDTH,
              borderRight: '1px solid #e0e0e0'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          px: { sm: 2 }, // Padding horizontal para separación en ambos lados
          pt: 2, // Padding top para separación de la parte superior
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          backgroundColor: 'background.default',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {children}
      </Box>
    </Box>
  )
} 