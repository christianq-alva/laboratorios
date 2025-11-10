import { useAuth } from '../../hooks/useAuth' 

export const Dashboard = () => {
  const { user, logout } = useAuth()

  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard</h1>
      <p>Bienvenido, {user?.nombre}!</p>
      <p>Rol: {user?.rol}</p>
      
      <button 
        onClick={logout}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#dc3545', 
          color: 'white', 
          border: 'none' 
        }}
      >
        Cerrar Sesión
      </button>
    </div>
  )
}