# 🚀 Despliegue en Railway - Guía Completa

## 🚨 PROBLEMA CRÍTICO: Enlaces Compartidos con localhost

Si los enlaces compartidos se generan con `localhost` en lugar del dominio de Railway, sigue estos pasos:

## ✅ SOLUCIÓN: Variables de Entorno Requeridas

### 1. Configurar Variables en Railway

Ve a tu proyecto en Railway → **Variables** → Agrega estas variables:

```bash
# 🚨 CRÍTICO: Detección de entorno de producción
NODE_ENV=production
RAILWAY_ENVIRONMENT=production

# Base de datos MySQL
DB_HOST=tu-host-mysql
DB_USER=tu-usuario-mysql
DB_PASSWORD=tu-contraseña-mysql
DB_NAME=laboratorios

# JWT Secret
JWT_SECRET=tu-clave-secreta-jwt

# Puerto del servidor
PORT=3000
```

### 2. Variables del Frontend (si es necesario)

```bash
# URL de la API
VITE_API_URL=https://beneficial-wholeness-production-9cd6.up.railway.app/api

# URL base del frontend
VITE_BASE_URL=https://beneficial-wholeness-production-9cd6.up.railway.app
```

## 🔍 Verificación

Después del despliegue, revisa los logs de Railway. Deberías ver:

```
🔗 URL generada: https://beneficial-wholeness-production-9cd6.up.railway.app/horarios/publico/11?token=...
🔗 Entorno detectado: PRODUCTION (Railway)
🔗 Variables de entorno: {
  NODE_ENV: 'production',
  RAILWAY_ENVIRONMENT: 'production',
  RAILWAY_PROJECT_ID: true
}
```

## ❌ Si sigue fallando

Si los enlaces siguen teniendo `localhost`, verifica:

1. **Variables configuradas**: Asegúrate de que `NODE_ENV=production` esté en Railway
2. **Redeploy**: Haz un nuevo despliegue después de configurar las variables
3. **Logs**: Revisa los logs para ver qué entorno se está detectando

## 🔧 Detección Automática

El sistema detecta automáticamente el entorno usando:

1. `process.env.RAILWAY_ENVIRONMENT` (específico de Railway)
2. `process.env.NODE_ENV === 'production'` (estándar)
3. `process.env.RAILWAY_PROJECT_ID` (existe solo en Railway)

Si **cualquiera** de estas variables existe, se usa el dominio de Railway.

## 🎯 Resultado Esperado

- **Desarrollo Local**: `http://localhost:5173/horarios/publico/...`
- **Railway**: `https://beneficial-wholeness-production-9cd6.up.railway.app/horarios/publico/...`

¡Los enlaces compartidos funcionarán correctamente con el dominio de Railway!
