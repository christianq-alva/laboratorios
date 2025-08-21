# Variables de Entorno para Railway

## Variables Requeridas

### Para el Backend (Node.js)
```bash
# Base de datos MySQL
DB_HOST=your-mysql-host
DB_USER=your-mysql-user
DB_PASSWORD=your-mysql-password
DB_NAME=your-mysql-database

# JWT Secret
JWT_SECRET=your-jwt-secret-key

# Entorno de producción (CRÍTICO para enlaces compartidos)
NODE_ENV=production
RAILWAY_ENVIRONMENT=production

# Puerto del servidor
PORT=3000
```

### Para el Frontend (Vite)
```bash
# URL de la API
VITE_API_URL=https://beneficial-wholeness-production-9cd6.up.railway.app/api

# URL base del frontend
VITE_BASE_URL=https://beneficial-wholeness-production-9cd6.up.railway.app
```

## Configuración en Railway

1. Ve a tu proyecto en Railway
2. Navega a la sección "Variables"
3. Agrega las variables listadas arriba
4. Asegúrate de que `FRONTEND_URL` esté configurada con el dominio correcto de Railway

## Notas Importantes

- **🚨 CRÍTICO para Enlaces Compartidos**: Configura estas variables en Railway:
  - `NODE_ENV=production`
  - `RAILWAY_ENVIRONMENT=production`
- **Detección Automática de Entorno**:
  - **Desarrollo**: URLs con `http://localhost:5173`
  - **Producción**: URLs con `https://beneficial-wholeness-production-9cd6.up.railway.app`
- **Debugging**: Los logs mostrarán qué entorno se detectó y por qué
- **Sin estas variables**: Los enlaces tendrán localhost incluso en Railway
