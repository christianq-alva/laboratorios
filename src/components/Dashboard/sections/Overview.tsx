import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/authContext'
import { authService, type Laboratorio } from '../../../services/authService'

export const Overview = () => {
  const { user } = useAuth()
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    <div style={{
      width: '100%',
      minHeight: '100%',
      backgroundColor: '#f5f7fa',
      padding: '0',
      margin: '0'
    }}>
      {/* HEADER HERO - ANCHO COMPLETO */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '60px 40px',
        textAlign: 'center',
        marginBottom: '0'
      }}>
        <h1 style={{
          fontSize: '42px',
          fontWeight: 'bold',
          margin: '0 0 20px 0',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          🎯 Sistema de Laboratorios
        </h1>
        <p style={{
          fontSize: '20px',
          margin: '0',
          opacity: '0.9'
        }}>
          Bienvenido {user?.nombre} - {user?.rol}
        </p>
      </div>

      {/* CONTENIDO PRINCIPAL CON PADDING LATERAL */}
      <div style={{
        padding: '40px',
        maxWidth: 'none',
        width: '100%',
        boxSizing: 'border-box'
      }}>

        {/* ESTADÍSTICAS EN 4 COLUMNAS COMPLETAS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          marginBottom: '50px',
          width: '100%'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '40px 20px',
            borderRadius: '20px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
            transition: 'transform 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-10px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
          }}
          >
            <div style={{ fontSize: '60px', marginBottom: '20px' }}>🧪</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '10px' }}>
              {loading ? '...' : laboratorios.length}
            </div>
            <div style={{ fontSize: '16px', opacity: '0.9' }}>
              Laboratorios
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            padding: '40px 20px',
            borderRadius: '20px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(240, 147, 251, 0.3)',
            transition: 'transform 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-10px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
          }}
          >
            <div style={{ fontSize: '60px', marginBottom: '20px' }}>📅</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '10px' }}>24</div>
            <div style={{ fontSize: '16px', opacity: '0.9' }}>Horarios</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            padding: '40px 20px',
            borderRadius: '20px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(79, 172, 254, 0.3)',
            transition: 'transform 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-10px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
          }}
          >
            <div style={{ fontSize: '60px', marginBottom: '20px' }}>📦</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '10px' }}>156</div>
            <div style={{ fontSize: '16px', opacity: '0.9' }}>Insumos</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            color: 'white',
            padding: '40px 20px',
            borderRadius: '20px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(67, 233, 123, 0.3)',
            transition: 'transform 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-10px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
          }}
          >
            <div style={{ fontSize: '60px', marginBottom: '20px' }}>⚡</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '10px' }}>5</div>
            <div style={{ fontSize: '16px', opacity: '0.9' }}>Incidencias</div>
          </div>
        </div>

        {/* LABORATORIOS - GRID EXPANSIVO */}
        <div style={{ marginBottom: '50px' }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#2d3748',
            marginBottom: '30px',
            textAlign: 'left'
          }}>
            {user?.rol === 'Administrador' ? '🏛️ Todos los Laboratorios' : '🎯 Mis Laboratorios'}
          </h2>

          {loading && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '200px',
              backgroundColor: 'white',
              borderRadius: '20px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '60px', marginBottom: '20px' }}>🔄</div>
                <p style={{ fontSize: '18px', color: '#64748b' }}>Cargando laboratorios...</p>
              </div>
            </div>
          )}

          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '2px solid #fecaca',
              borderRadius: '20px',
              padding: '40px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>❌</div>
              <p style={{ fontSize: '18px', color: '#dc2626' }}>{error}</p>
            </div>
          )}

          {!loading && !error && laboratorios.length === 0 && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '60px',
              textAlign: 'center',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '80px', marginBottom: '30px' }}>📭</div>
              <h3 style={{ fontSize: '24px', color: '#374151', marginBottom: '10px' }}>
                Sin laboratorios asignados
              </h3>
              <p style={{ fontSize: '16px', color: '#6b7280' }}>
                Contacta al administrador para obtener acceso
              </p>
            </div>
          )}

          {!loading && !error && laboratorios.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '30px',
              width: '100%'
            }}>
              {laboratorios.map((lab) => (
                <div
                  key={lab.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '20px',
                    padding: '40px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    border: '2px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-10px)'
                    e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.15)'
                    e.currentTarget.style.borderColor = '#667eea'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.1)'
                    e.currentTarget.style.borderColor = 'transparent'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '30px'
                  }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '40px',
                      marginRight: '20px'
                    }}>
                      🧪
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#1f2937',
                        margin: '0 0 8px 0'
                      }}>
                        {lab.nombre}
                      </h3>
                      <p style={{
                        fontSize: '16px',
                        color: '#6b7280',
                        margin: '0'
                      }}>
                        📍 {lab.ubicacion}
                      </p>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '15px'
                  }}>
                    <button style={{
                      padding: '15px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                    >
                      📊 Ver Detalles
                    </button>
                    <button style={{
                      padding: '15px',
                      background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                    >
                      ⚙️ Gestionar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ACCIONES RÁPIDAS - GRID COMPLETO */}
        <div>
          <h2 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#2d3748',
            marginBottom: '30px'
          }}>
            🚀 Acciones Rápidas
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: user?.rol === 'Administrador' ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)',
            gap: '30px',
            width: '100%'
          }}>
            <button style={{
              padding: '50px 30px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'transform 0.3s ease',
              boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
            }}
            >
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>📅</div>
              Gestionar Horarios
            </button>

            <button style={{
              padding: '50px 30px',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'transform 0.3s ease',
              boxShadow: '0 10px 30px rgba(79, 172, 254, 0.3)',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
            }}
            >
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>📦</div>
              Inventario Insumos
            </button>

            <button style={{
              padding: '50px 30px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'transform 0.3s ease',
              boxShadow: '0 10px 30px rgba(240, 147, 251, 0.3)',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
            }}
            >
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>⚠️</div>
              Ver Incidencias
            </button>

            {user?.rol === 'Administrador' && (
              <button style={{
                padding: '50px 30px',
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
                boxShadow: '0 10px 30px rgba(67, 233, 123, 0.3)',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-10px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
              }}
              >
                <div style={{ fontSize: '60px', marginBottom: '20px' }}>📊</div>
                Reportes Avanzados
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 