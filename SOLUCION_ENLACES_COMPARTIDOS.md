# Solución: Enlaces Compartidos con Localhost

## Problema
Cuando se comparten horarios mediante enlaces, siempre aparece `localhost` en la URL, incluso en producción (Railway). Esto impide que los usuarios puedan acceder a los horarios compartidos desde otros dispositivos.

## Causa
El problema se debe a que la URL del frontend estaba hardcodeada en el código del backend. Aunque el sistema detectaba correctamente el entorno de producción, no tenía una forma dinámica de obtener la URL correcta del frontend.

## Solución Implementada

### 1. Configuración Dinámica de URLs
Se modificó el archivo `server/controllers/shareController.js` para usar variables de entorno dinámicas:

```javascript
// Antes (hardcodeado)
const baseUrl = isProduction ? 'https://beneficial-wholeness-production-9cd6.up.railway.app' : 'http://localhost:5173'

// Después (dinámico)
let baseUrl
if (isProduction) {
  baseUrl = process.env.FRONTEND_URL || 
            process.env.VITE_BASE_URL || 
            (process.env.RAILWAY_STATIC_URL ? `https://${process.env.RAILWAY_STATIC_URL}` : null) ||
            'https://beneficial-wholeness-production-9cd6.up.railway.app' // fallback
} else {
  baseUrl = 'http://localhost:5173'
}
```

### 2. Variables de Entorno Requeridas
Para Railway en producción, configura **una** de estas variables:

#### Opción 1: FRONTEND_URL (Recomendado)
```bash
FRONTEND_URL=https://tu-dominio-railway.up.railway.app
```

#### Opción 2: VITE_BASE_URL
```bash
VITE_BASE_URL=https://tu-dominio-railway.up.railway.app
```

#### Opción 3: Variables de entorno automáticas
```bash
NODE_ENV=production
RAILWAY_ENVIRONMENT=production
```
(Usará el dominio hardcodeado como fallback)

### 3. Cómo Obtener tu Dominio de Railway

1. **Ve a tu proyecto en Railway**
2. **Navega a la pestaña "Deployments"**
3. **Copia la URL del deployment activo**
   - Ejemplo: `https://beneficial-wholeness-production-9cd6.up.railway.app`
4. **Úsala como valor para `FRONTEND_URL`**

### 4. Configuración en Railway

1. Ve a tu proyecto en Railway
2. Navega a la sección "Variables"
3. Agrega la variable:
   ```
   FRONTEND_URL = https://tu-dominio-railway.up.railway.app
   ```
4. Redeploy tu aplicación

## Verificación

### Script de Diagnóstico
Puedes usar el script incluido para probar diferentes configuraciones:

```bash
node scripts/test-share-urls.js
```

Este script simula diferentes entornos y muestra qué URL se generaría en cada caso.

### Logs del Sistema
Cuando crees un enlace compartido, revisa los logs del backend. Deberías ver:

```
🔗 URL generada: https://tu-dominio.up.railway.app/horarios/publico/1?token=...
🔗 Entorno detectado: PRODUCTION (Railway)
🔗 Base URL utilizada: https://tu-dominio.up.railway.app
🔗 Variables de entorno:
  NODE_ENV: production
  RAILWAY_ENVIRONMENT: production
  FRONTEND_URL: https://tu-dominio.up.railway.app
  ...
```

## Casos de Uso

### ✅ Desarrollo Local
- **Variables**: Ninguna especial
- **URL generada**: `http://localhost:5173/horarios/publico/1?token=...`
- **Funciona**: ✅ Solo localmente

### ✅ Producción con FRONTEND_URL
- **Variables**: `FRONTEND_URL=https://mi-app.up.railway.app`
- **URL generada**: `https://mi-app.up.railway.app/horarios/publico/1?token=...`
- **Funciona**: ✅ Desde cualquier dispositivo

### ❌ Producción sin configurar
- **Variables**: Solo `NODE_ENV=production`
- **URL generada**: `https://beneficial-wholeness-production-9cd6.up.railway.app/horarios/publico/1?token=...`
- **Funciona**: ⚠️ Solo si el dominio hardcodeado coincide

## Troubleshooting

### Problema: Sigue apareciendo localhost
**Solución**: 
1. Verifica que `FRONTEND_URL` esté configurada en Railway
2. Verifica que `NODE_ENV=production` esté configurada
3. Redeploy la aplicación
4. Revisa los logs del backend

### Problema: URL con "undefined"
**Solución**: 
1. No configures `RAILWAY_STATIC_URL` a menos que sepas su valor exacto
2. Usa `FRONTEND_URL` en su lugar

### Problema: Enlaces no funcionan
**Solución**: 
1. Verifica que la URL generada sea accesible
2. Verifica que el token no haya expirado
3. Verifica que el laboratorio exista

## Archivos Modificados

- `server/controllers/shareController.js` - Lógica de generación de URLs
- `ENVIRONMENT_VARIABLES.md` - Documentación de variables
- `scripts/test-share-urls.js` - Script de diagnóstico (nuevo)

## Próximos Pasos

1. **Configura `FRONTEND_URL` en Railway**
2. **Redeploy tu aplicación**
3. **Prueba crear un enlace compartido**
4. **Verifica que la URL no contenga localhost**
5. **Comparte el enlace y prueba desde otro dispositivo**

¡Con estos cambios, los enlaces compartidos deberían funcionar correctamente en producción!