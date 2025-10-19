# 🔍 Guía para Verificar el Problema de Stock en Insumos

## ⚠️ Pasos OBLIGATORIOS (en orden)

### 1️⃣ Reiniciar el Servidor Backend

El código del backend fue modificado para calcular correctamente el stock. **DEBES REINICIAR EL SERVIDOR**.

```bash
# En la terminal donde corre el backend:
# 1. Presiona Ctrl + C para detener el servidor

# 2. Espera 2-3 segundos

# 3. Reinicia el servidor:
npm run dev
# o
node server/index.js
```

**Espera a ver este mensaje en la consola:**
```
✅ Servidor corriendo en puerto 5000
✅ Base de datos conectada
```

---

### 2️⃣ Limpiar Caché del Navegador

El navegador puede estar usando datos antiguos en caché.

**Opción A - Recarga Forzada:**
1. En el navegador, presiona: `Ctrl + Shift + R` (Windows/Linux) o `Cmd + Shift + R` (Mac)

**Opción B - Limpiar Caché Manualmente:**
1. Presiona `F12` para abrir las herramientas de desarrollador
2. Click derecho en el botón de recargar (🔄) del navegador
3. Selecciona **"Vaciar caché y recargar de forma forzada"**

---

### 3️⃣ Abrir la Consola del Navegador

1. Presiona `F12` en el navegador
2. Ve a la pestaña **"Console"** (Consola)
3. Limpia la consola (icono 🚫 o Ctrl + L)

---

### 4️⃣ Crear un Nuevo Horario

1. Ve al módulo de **Horarios**
2. Click en **"Nuevo Horario"**
3. Selecciona un **Laboratorio**
4. Ve al paso de **"Insumos"**

---

### 5️⃣ Revisar los Logs en la Consola

Deberías ver estos logs en la consola del navegador:

```javascript
📦 Insumos cargados (nuevo): Array(22)
  0: {id: 1, nombre: "Ácido sulfúrico", stock_total_lotes: 20, stock_disponible: 20}
  1: {id: 2, nombre: "Alcohol etílico 70%", stock_total_lotes: 0, stock_disponible: 0}
  2: {id: 3, nombre: "CARGA 1", stock_total_lotes: 200, stock_disponible: 200}
  ...

- Ácido sulfúrico: stock_total_lotes=20, stock_disponible=20
- Alcohol etílico 70%: stock_total_lotes=0, stock_disponible=0
- CARGA 1: stock_total_lotes=200, stock_disponible=200
...

✅ Insumos con stock: 2 de 22
```

---

## 🔍 Qué Debes Ver

### ✅ **CORRECTO:**
```
Disponibles (2)
• Ácido sulfúrico - Stock: 20
• CARGA 1 - Stock: 200
```

### ❌ **INCORRECTO (Si aún pasa):**
```
Disponibles (3)
• Ácido sulfúrico - Stock: 20
• Alcohol etílico 70% - Stock: 0  ← NO DEBERÍA APARECER
• CARGA 1 - Stock: 200
```

---

## 📋 Si TODAVÍA Aparecen Insumos con Stock 0

**Copia EXACTAMENTE los logs de la consola y envíamelos:**

1. Busca en la consola del navegador:
   - `📦 Insumos cargados (nuevo):`
   - La lista completa que aparece debajo
   - `✅ Insumos con stock:`

2. Copia TODO ese bloque de logs

3. También toma una captura de pantalla de la lista de insumos disponibles

---

## 🔴 Verificación en el Backend (Terminal del Servidor)

En la terminal donde corre el servidor backend, busca estos logs:

```
📦 Insumos encontrados para laboratorio 1 : 22
📋 Primeros 3 insumos con stock: [
  { nombre: 'Ácido sulfúrico', stock_disponible: 20, stock_total_lotes: 20 },
  { nombre: 'Alcohol etílico 70%', stock_disponible: 0, stock_total_lotes: 0 },
  { nombre: 'CARGA 1', stock_disponible: 200, stock_total_lotes: 200 }
]
```

**Si NO ves estos logs:** El servidor backend **NO se reinició correctamente**.

---

## 🛠️ Solución Definitiva (Si Nada Funciona)

Si después de seguir TODOS los pasos anteriores aún aparecen insumos con stock 0:

```bash
# 1. Detén TODOS los servidores (backend y frontend)
Ctrl + C en todas las terminales

# 2. Espera 5 segundos

# 3. Reinicia el backend
npm run dev

# 4. Espera a que inicie completamente

# 5. En otra terminal, reinicia el frontend
npm run dev

# 6. Abre el navegador en modo incógnito
Ctrl + Shift + N (Chrome)
Ctrl + Shift + P (Firefox)
```

---

## 📞 Si Necesitas Ayuda Adicional

Envíame:
1. ✅ Captura de pantalla de la lista de insumos
2. ✅ Logs de la consola del navegador (bloque completo)
3. ✅ Logs de la terminal del servidor backend
4. ✅ Confirmación de que reiniciaste el servidor

**Sin estos datos, no puedo ayudarte más eficientemente.**

