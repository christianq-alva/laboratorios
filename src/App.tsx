import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material'
import { theme } from './theme'
import { useAuth } from './hooks/useAuth' 
import { Login } from './components/Login/Login'
import { MainLayout } from './components/Layout/MainLayout'
import { HorarioPublico } from './components/Public/HorarioPublico'

// ============================================
// LAZY LOADING - Carga componentes bajo demanda
// ============================================
// Cada página se carga solo cuando el usuario navega a ella
// Esto reduce el bundle inicial significativamente
const Dashboard = lazy(() => 
  import('./pages/Dashboard').then(module => ({ default: module.Dashboard }))
)
const Horarios = lazy(() => 
  import('./pages/Horarios').then(module => ({ default: module.Horarios }))
)
const Insumos = lazy(() => 
  import('./pages/Insumos').then(module => ({ default: module.Insumos }))
)
const Equipos = lazy(() => 
  import('./pages/Equipos').then(module => ({ default: module.Equipos }))
)
const Incidencias = lazy(() => 
  import('./pages/Incidencias').then(module => ({ default: module.Incidencias }))
)
const ReportesSimple = lazy(() => 
  import('./pages/ReportesSimple')
)
const Configuracion = lazy(() => 
  import('./pages/Configuracion').then(module => ({ default: module.Configuracion }))
)

// ============================================
// LOADING FALLBACK
// ============================================
// Componente que se muestra mientras se carga una página
const PageLoader: React.FC = () => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight="60vh"
    role="status"
    aria-label="Cargando página"
  >
    <CircularProgress />
  </Box>
)

// ============================================
// PROTECTED PAGE WRAPPER
// ============================================
// Envuelve cada página protegida con:
// 1. Verificación de autenticación
// 2. MainLayout (sidebar + estructura)
// 3. Suspense para lazy loading
interface ProtectedPageProps {
  children: React.ReactNode
}

const ProtectedPage: React.FC<ProtectedPageProps> = ({ children }) => {
  const { user, loading } = useAuth()
  
  // Mostrar loader mientras se verifica autenticación desde localStorage
  if (loading) {
    return <PageLoader />
  }
  
  // Si no hay usuario, redirige al login
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  // Si hay usuario, renderiza con layout y suspense
  return (
    <MainLayout>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </MainLayout>
  )
}

// ============================================
// PUBLIC PAGE WRAPPER
// ============================================
// Envuelve páginas públicas (como login)
// Si el usuario ya está autenticado, redirige al dashboard
const PublicPage: React.FC<ProtectedPageProps> = ({ children }) => {
  const { user, loading } = useAuth()
  
  // Mostrar loader mientras se verifica autenticación
  if (loading) {
    return <PageLoader />
  }
  
  // Si ya hay usuario autenticado, redirige al dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  
  // Si no hay usuario, muestra la página pública
  return <>{children}</>
}

// ============================================
// APP COMPONENT
// ============================================
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* ============================================ */}
          {/* RUTAS PÚBLICAS */}
          {/* ============================================ */}
          
          {/* Login - Solo accesible si NO estás autenticado */}
          <Route 
            path="/login" 
            element={
              <PublicPage>
                <Login />
              </PublicPage>
            } 
          />
          
          {/* Horario Público - Accesible sin autenticación */}
          <Route 
            path="/horarios/publico/:laboratorio_id" 
            element={<HorarioPublico />} 
          />
          
          {/* ============================================ */}
          {/* RUTAS PROTEGIDAS - Cada una independiente */}
          {/* ============================================ */}
          {/* Cada ruta es completamente independiente y autocontenida */}
          {/* Se cargan bajo demanda (lazy loading) */}
          {/* Todas comparten: autenticación + layout + suspense */}
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedPage>
                <Dashboard />
              </ProtectedPage>
            } 
          />
          
          <Route 
            path="/horarios" 
            element={
              <ProtectedPage>
                <Horarios />
              </ProtectedPage>
            } 
          />
          
          <Route 
            path="/insumos" 
            element={
              <ProtectedPage>
                <Insumos />
              </ProtectedPage>
            } 
          />
          
          <Route 
            path="/equipos" 
            element={
              <ProtectedPage>
                <Equipos />
              </ProtectedPage>
            } 
          />
          
          <Route 
            path="/incidencias" 
            element={
              <ProtectedPage>
                <Incidencias />
              </ProtectedPage>
            } 
          />
          
          <Route 
            path="/reportes" 
            element={
              <ProtectedPage>
                <ReportesSimple />
              </ProtectedPage>
            } 
          />
          
          <Route 
            path="/configuracion" 
            element={
              <ProtectedPage>
                <Configuracion />
              </ProtectedPage>
            }
             
          />
          <Route 
            path="/" 
            element={<Navigate to="/dashboard" replace />} 
          />
          
          {/* Cualquier otra ruta no definida - redirige al dashboard */}
          <Route 
            path="*" 
            element={<Navigate to="/dashboard" replace />} 
          />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App