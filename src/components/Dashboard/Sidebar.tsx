import { useAuth } from '../../context/authContext'

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export const Sidebar = ({ activeSection, onSectionChange }: SidebarProps) => {
  const { user, logout } = useAuth()

  const menuItems = [
    { id: 'overview', label: 'Resumen', icon: '📊' },
    { id: 'laboratorios', label: 'Laboratorios', icon: '🧪' },
    { id: 'horarios', label: 'Horarios', icon: '📅' },
    { id: 'insumos', label: 'Insumos', icon: '📦' },
    { id: 'incidencias', label: 'Incidencias', icon: '⚠️' },
  ]

  // Agregar reportes solo para Admin
  if (user?.rol === 'Administrador') {
    menuItems.push({ id: 'reportes', label: 'Reportes', icon: '📈' })
  }

  return (
    <div style={{
      width: '250px',
      height: '100vh',
      backgroundColor: '#2c3e50',
      color: 'white',
      padding: '0',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header del sidebar */}
      <div style={{
        padding: '20px',
        backgroundColor: '#34495e',
        borderBottom: '1px solid #4a5f7a'
      }}>
        <h2 style={{ 
          margin: '0 0 10px 0', 
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          🎯 Laboratorios
        </h2>
        <div style={{ fontSize: '14px', opacity: '0.8' }}>
          <div>{user?.nombre}</div>
          <div style={{ 
            backgroundColor: user?.rol === 'Administrador' ? '#e74c3c' : '#27ae60',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            marginTop: '5px',
            display: 'inline-block'
          }}>
            {user?.rol}
          </div>
        </div>
      </div>

      {/* Menu items */}
      <nav style={{ flex: 1, padding: '20px 0' }}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            style={{
              width: '100%',
              padding: '15px 20px',
              backgroundColor: activeSection === item.id ? '#3498db' : 'transparent',
              color: 'white',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
            onMouseEnter={(e) => {
              if (activeSection !== item.id) {
                e.currentTarget.style.backgroundColor = '#4a5f7a'
              }
            }}
            onMouseLeave={(e) => {
              if (activeSection !== item.id) {
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
          >
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer con logout */}
      <div style={{
        padding: '20px',
        borderTop: '1px solid #4a5f7a'
      }}>
        <button
          onClick={logout}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'background-color 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#c0392b'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#e74c3c'
          }}
        >
          🚪 Cerrar Sesión
        </button>
      </div>
    </div>
  )
} 