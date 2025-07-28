import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Overview } from './sections/Overview'
import { Laboratorios } from './sections/Laboratorios'
import { Horarios } from './sections/Horarios'
import { Insumos } from './sections/Insumos'
import { Incidencias } from './sections/Incidencias'
import { Reportes } from './sections/Reportes'

export const Dashboard = () => {
  const [activeSection, setActiveSection] = useState('overview')
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setSidebarOpen(false)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <Overview />
      case 'laboratorios':
        return <Laboratorios />
      case 'horarios':
        return <Horarios />
      case 'insumos':
        return <Insumos />
      case 'incidencias':
        return <Incidencias />
      case 'reportes':
        return <Reportes />
      default:
        return <Overview />
    }
  }

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', overflow: 'visible' }}>
      {/* Overlay móvil */}
      {isMobile && sidebarOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Header móvil */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '60px',
          backgroundColor: '#2c3e50',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          zIndex: 998,
          boxSizing: 'border-box'
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            ☰
          </button>
          <h1 style={{
            color: 'white',
            margin: '0 0 0 15px',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            🎯 Sistema de Laboratorios
          </h1>
        </div>
      )}

      {/* Sidebar */}
      <div style={{ 
        position: 'fixed',
        left: isMobile ? (sidebarOpen ? '0' : '-250px') : '0',
        top: 0,
        width: '250px',
        height: '100vh',
        zIndex: 1000,
        transition: 'left 0.3s ease'
      }}>
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={handleSectionChange} 
        />
      </div>
      
      {/* Contenido principal - OCUPA TODO EL ESPACIO */}
      <div style={{
        marginLeft: isMobile ? '0' : '250px',
        paddingTop: isMobile ? '60px' : '0',
        width: isMobile ? '100%' : 'calc(100vw - 250px)',
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '0',
        boxSizing: 'border-box',
        position: 'relative'
      }}>
        {renderSection()}
      </div>
    </div>
  )
}