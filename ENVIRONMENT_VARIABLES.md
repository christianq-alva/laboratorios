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

# URL del Frontend (para enlaces compartidos)
FRONTEND_URL=https://beneficial-wholeness-production-9cd6.up.railway.app

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

- La variable `FRONTEND_URL` es crucial para que los enlaces compartidos funcionen correctamente
- Si cambias el dominio de Railway, actualiza tanto `FRONTEND_URL` como `VITE_BASE_URL`
- El sistema detectará automáticamente si está en desarrollo o producción basándose en el hostname:
  - `localhost` o `127.0.0.1` = Desarrollo
  - Cualquier otro dominio = Producción
- Los enlaces compartidos ahora se generarán con el dominio correcto automáticamente
