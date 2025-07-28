export const Insumos = () => {
  return (
    <div style={{ padding: '40px 0' }}>
      <h1 style={{ 
        color: '#2c3e50', 
        marginBottom: '30px',
        fontSize: '32px',
        fontWeight: 'bold'
      }}>
        📦 Gestión de Insumos
      </h1>
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '60px 40px',
        borderRadius: '15px',
        textAlign: 'center',
        boxShadow: '0 6px 20px rgba(0,0,0,0.05)'
      }}>
        <div style={{ fontSize: '72px', marginBottom: '25px' }}>🏗️</div>
        <p style={{ 
          fontSize: '22px', 
          color: '#7f8c8d', 
          margin: '0 0 15px 0',
          fontWeight: '600'
        }}>
          Sección de Insumos en construcción
        </p>
        <p style={{ 
          fontSize: '16px', 
          color: '#95a5a6', 
          marginTop: '10px',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          Aquí podrás gestionar el inventario de insumos, agregar stock, ver movimientos y controlar el inventario por laboratorio.
        </p>
      </div>
    </div>
  )
} 