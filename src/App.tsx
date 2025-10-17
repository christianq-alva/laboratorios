import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { theme } from './theme'
import { useAuth } from './context/authContext'
import { Login } from './components/Login/Login'
import { MainLayout } from './components/Layout/MainLayout'
import {
  Dashboard,
  Horarios,
  Insumos,
  Equipos,
  Incidencias,
  ReportesSimple,
  Configuracion,
} from './pages'
import { HorarioPublico } from './components/Public/HorarioPublico'

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

// Public Route Component (redirect if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  return !user ? <>{children}</> : <Navigate to="/dashboard" replace />
}

function App() {
  const { user: _user } = useAuth()

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          
          {/* Public Horario Route (sin autenticación) */}
          <Route 
            path="/horarios/publico/:laboratorio_id" 
            element={<HorarioPublico />} 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/horarios" element={<Horarios />} />
                    <Route path="/insumos" element={<Insumos />} />
                    <Route path="/equipos" element={<Equipos />} />
                    <Route path="/incidencias" element={<Incidencias />} />
                    <Route path="/reportes" element={<ReportesSimple />} />
                    <Route path="/configuracion" element={<Configuracion />} />
                    
                    {/* Default redirect */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </MainLayout>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App