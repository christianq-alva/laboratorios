import { useAuth } from '../../context/authContext'
import { useState, useEffect } from 'react'
import { authService, type Laboratorio } from '../../services/authService'

export const Dashboard = () => {
  const { user, logout } = useAuth()
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 🔄 CARGAR LABORATORIOS AL MONTAR EL COMPONENTE
  useEffect(() => {
    const fetchLaboratorios = async () => {
      try {
        setLoading(true)
        const response = await authService.getLaboratorios()
        
        if (response.success) {
          setLaboratorios(response.data)
        } else {
          setError('Error al cargar laboratorios')
        }
      } catch (err) {
        console.error('Error fetching laboratorios:', err)
        setError('Error de conexión')
      } finally {
        setLoading(false)
      }
    }

    fetchLaboratorios()
  }, [])

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 👤 HEADER CON INFO DEL USUARIO */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: '0 0 10px 0', color: '#333' }}>Dashboard</h1>
          <p style={{ margin: '0', fontSize: '18px' }}>
            Bienvenido, <strong>{user?.nombre}</strong>
          </p>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>
            Rol: <span style={{ 
              backgroundColor: user?.rol === 'Administrador' ? '#dc3545' : '#28a745', 
              color: 'white', 
              padding: '4px 8px', 
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              {user?.rol}
            </span>
          </p>
        </div>
        
        <button 
          onClick={logout}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#dc3545', 
            color: 'white', 
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Cerrar Sesión
        </button>
      </div>

      {/* 🏢 SECCIÓN DE LABORATORIOS ASIGNADOS */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: '#333', marginBottom: '15px' }}>
          {user?.rol === 'Administrador' ? 'Todos los Laboratorios' : 'Mis Laboratorios Asignados'}
        </h2>
        
        {loading ? (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <p>Cargando laboratorios...</p>
          </div>
        ) : error ? (
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#f8d7da', 
            color: '#721c24',
            borderRadius: '8px',
            border: '1px solid #f5c6cb'
          }}>
            <p>❌ {error}</p>
          </div>
        ) : laboratorios.length === 0 ? (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            backgroundColor: '#fff3cd',
            borderRadius: '8px',
            border: '1px solid #ffeaa7'
          }}>
            <p>📭 No tienes laboratorios asignados</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '20px' 
          }}>
            {laboratorios.map((lab) => (
              <div 
                key={lab.id}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ marginBottom: '10px' }}>
                  <h3 style={{ 
                    margin: '0 0 8px 0', 
                    color: '#495057',
                    fontSize: '18px'
                  }}>
                    🧪 {lab.nombre}
                  </h3>
                  <p style={{ 
                    margin: '0', 
                    color: '#6c757d',
                    fontSize: '14px'
                  }}>
                    📍 {lab.ubicacion}
                  </p>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  marginTop: '15px' 
                }}>
                  <button style={{
                    padding: '6px 12px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}>
                    Ver Horarios
                  </button>
                  <button style={{
                    padding: '6px 12px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}>
                    Ver Insumos
                  </button>
                  <button style={{
                    padding: '6px 12px',
                    backgroundColor: '#ffc107',
                    color: '#212529',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}>
                    Incidencias
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 📊 SECCIÓN DE ACCIONES RÁPIDAS */}
      <div>
        <h2 style={{ color: '#333', marginBottom: '15px' }}>Acciones Rápidas</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px' 
        }}>
          <button style={{
            padding: '15px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            📅 Crear Horario
          </button>
          <button style={{
            padding: '15px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            📦 Gestionar Insumos
          </button>
          <button style={{
            padding: '15px',
            backgroundColor: '#ffc107',
            color: '#212529',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            ⚠️ Reportar Incidencia
          </button>
          <button style={{
            padding: '15px',
            backgroundColor: '#6f42c1',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            📊 Ver Reportes
          </button>
        </div>
      </div>
    </div>
  )
}