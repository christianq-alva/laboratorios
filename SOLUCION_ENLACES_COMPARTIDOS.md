# Solución: Enlaces Compartidos con Localhost

## Problema
Cuando se comparten horarios mediante enlaces, siempre aparece `localhost` en la URL, incluso en producción (Railway). Esto impide que los usuarios puedan acceder a los horarios compartidos desde otros dispositivos.

## Causa
El problema se debe a que la URL del frontend estaba hardcodeada en el código del backend. Aunque el sistema detectaba correctamente el entorno de producción, no tenía una forma dinámica de obtener la URL correcta del frontend.

## 🔧 Solución Implementada

Se ha modificado el archivo `server/controllers/shareController.js` para **PRIORIZAR SIEMPRE las URLs de producción** y evitar el uso de `localhost` en entornos de producción:

### Lógica de Prioridad (ACTUALIZADA):
1. **FRONTEND_URL** (recomendado para Railway)
2. **VITE_BASE_URL** (alternativa)
3. **RAILWAY_STATIC_URL** (si está disponible)
4. **URL hardcodeada de producción** como fallback seguro
5. `localhost:5173` **SOLO** si está explícitamente en desarrollo local

### Condiciones para Desarrollo Local:
Solo se usa `localhost` si se cumplen **TODAS** estas condiciones:
- `NODE_ENV === 'development'`
- NO hay `RAILWAY_ENVIRONMENT`
- NO hay `RAILWAY_PROJECT_ID`
- NO hay `PORT` (Railway siempre establece PORT)
- NO hay `FRONTEND_URL`
- NO hay `VITE_BASE_URL`

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

## 🚀 Configuración para Railway

### ⭐ Opción 1: FRONTEND_URL (MÁS RECOMENDADO)
```bash
FRONTEND_URL=https://tu-dominio.up.railway.app
```
**Esta es la opción más directa y clara para especificar la URL del frontend.**

### Opción 2: VITE_BASE_URL
```bash
VITE_BASE_URL=https://tu-dominio.up.railway.app
```

### Opción 3: RAILWAY_STATIC_URL
```bash
RAILWAY_STATIC_URL=tu-dominio.up.railway.app
```

### ⚡ Fallback Automático
Si no configuras ninguna variable, el sistema usará automáticamente:
```
https://beneficial-wholeness-production-9cd6.up.railway.app
```
**Esto garantiza que NUNCA aparezca `localhost` en producción.**

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

## 🔍 Troubleshooting

### ❌ Problema: Aún aparece localhost
**Causas posibles:**
- Las variables de entorno no están configuradas en Railway
- No se ha redesplegado después de configurar las variables
- Hay un problema con la detección del entorno

**Solución:**
1. Configura `FRONTEND_URL` en Railway
2. Redesplega la aplicación
3. Ejecuta el script de diagnóstico: `node scripts/test-share-urls.js`

### ❌ Problema: URL "undefined" o "https://undefined"
**Causa:** `RAILWAY_STATIC_URL` está vacía o mal configurada

**Solución:** Usa `FRONTEND_URL` en su lugar:
```bash
FRONTEND_URL=https://tu-dominio.up.railway.app
```

### ❌ Problema: El enlace no funciona
**Verificaciones:**
- El frontend está desplegado y accesible
- La ruta `/horarios/publico/:id` existe en el frontend
- El token JWT es válido y no ha expirado

### ✅ Verificación Rápida
Ejecuta este comando para probar la lógica:
```bash
node scripts/test-share-urls.js
```

## Archivos Modificados

- `server/controllers/shareController.js` - Lógica de generación de URLs
- `ENVIRONMENT_VARIABLES.md` - Documentación de variables
- `scripts/test-share-urls.js` - Script de diagnóstico (nuevo)

## 📋 Próximos Pasos

### 🎯 Pasos Inmediatos (OBLIGATORIOS)

1. **Configurar FRONTEND_URL en Railway:**
   ```bash
   FRONTEND_URL=https://tu-dominio.up.railway.app
   ```
   - Ve a tu proyecto en Railway
   - En "Variables", añade `FRONTEND_URL`
   - Usa la URL completa de tu deployment

2. **Redesplegar la aplicación** en Railway
   - Esto es CRÍTICO para que los cambios tomen efecto

3. **Verificar inmediatamente:**
   - Crear un enlace compartido desde la aplicación
   - Confirmar que NO aparece `localhost`
   - Verificar que el enlace funciona

### 🔧 Pasos de Verificación

4. **Ejecutar diagnóstico local:**
   ```bash
   node scripts/test-share-urls.js
   ```

5. **Revisar logs del backend** para confirmar la URL generada

6. **Probar diferentes escenarios** de enlaces compartidos

### ✅ Resultado Esperado
- **ANTES:** `http://localhost:5173/horarios/publico/1?token=...`
- **DESPUÉS:** `https://tu-dominio.up.railway.app/horarios/publico/1?token=...`

¡Con estos cambios, los enlaces compartidos deberían funcionar correctamente en producción!