import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { theme } from './theme'
import { useAuth } from './context/authContext'
import { Login } from './components/Login/Login'
import { MainLayout } from './components/Layout/MainLayout'
import {
  Dashboard,
  Laboratorios,
  Docentes,
  Horarios,
  Insumos,
  Incidencias,
} from './pages'

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
          
          {/* Protected Routes */}
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/laboratorios" element={<Laboratorios />} />
                    <Route path="/docentes" element={<Docentes />} />
                    <Route path="/horarios" element={<Horarios />} />
                    <Route path="/insumos" element={<Insumos />} />
                    <Route path="/incidencias" element={<Incidencias />} />
                    
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