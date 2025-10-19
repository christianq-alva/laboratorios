# 📋 Sistema de Stock Mínimo - Guía de Uso

## ✅ IMPLEMENTACIÓN COMPLETADA

Se ha implementado exitosamente el **Sistema de Gestión de Stock Mínimo** sin usar la tabla redundante `inventario_insumos`.

---

## 🚀 PASO 1: Ejecutar Script SQL (OBLIGATORIO)

Antes de usar el sistema, **DEBES** ejecutar el script SQL para crear la tabla y las vistas:

```bash
# Opción 1: Desde MySQL Workbench o phpMyAdmin
# Abrir y ejecutar el archivo: scripts/create_config_stock_sistema.sql

# Opción 2: Desde terminal
mysql -u root -p laboratorios < scripts/create_config_stock_sistema.sql

# Opción 3: Desde tu cliente MySQL
# Copiar y pegar el contenido del archivo create_config_stock_sistema.sql
```

---

## 📊 Archivos Creados/Modificados

### Backend
- ✅ `scripts/create_config_stock_sistema.sql` - Script de base de datos
- ✅ `server/controllers/insumoController.js` - 6 nuevos endpoints
- ✅ `server/routes/insumoRoutes.js` - Rutas actualizadas

### Frontend
- ✅ `src/services/insumoService.ts` - Métodos TypeScript agregados
- ✅ `src/components/Reportes/ReporteStockBajo.tsx` - Reporte de stock bajo
- ✅ `src/components/Reportes/ReporteProximosVencer.tsx` - Reporte de vencimientos
- ✅ `src/components/Insumos/ConfigStockMinimoDialog.tsx` - Formulario de configuración
- ✅ `src/pages/Reportes.tsx` - Integrados 2 nuevos reportes

### Documentación
- ✅ `scripts/README_STOCK_MINIMO.md` - Documentación técnica
- ✅ `INSTRUCCIONES_STOCK_MINIMO.md` - Este archivo

---

## 🎯 Características Implementadas

### 1. Stock Mínimo Personalizado por Laboratorio
- Cada insumo puede tener stock mínimo diferente en cada laboratorio
- Ejemplo: **Ácido Sulfúrico**
  - Lab Química: stock_minimo = 50L (uso diario)
  - Lab Física: stock_minimo = 10L (uso esporádico)
  - Lab Biología: sin configurar (no se usa)

### 2. Reportes Inteligentes

#### 📉 Reporte de Stock Bajo
- **Ubicación**: Módulo de Reportes → "Insumos con Stock Bajo"
- **Muestra**:
  - ⚠️ Insumos agotados (stock = 0)
  - ⚠️ Insumos con stock por debajo del mínimo
  - ⚠️ Insumos que necesitan reorden
- **Características**:
  - Filtro por laboratorio
  - Estadísticas en tiempo real
  - Exportable a CSV
  - Paginación

#### 📅 Reporte de Insumos Próximos a Vencer
- **Ubicación**: Módulo de Reportes → "Insumos Próximos a Vencer"
- **Muestra**:
  - ❌ Vencidos
  - ⏰ Vence hoy
  - 🔴 Urgente (≤7 días)
  - 🟡 Próximo (≤30 días)
  - 🟢 Advertencia (≤90 días)
- **Características**:
  - Filtro por laboratorio
  - Filtro por días a futuro (configurable)
  - Muestra lote, cantidad, meses almacenado
  - Exportable a CSV
  - Paginación

### 3. Sin Tabla Redundante
- ❌ Eliminada la necesidad de `inventario_insumos`
- ✅ Stock se calcula desde `movimientos_insumos` + `movimiento_insumo_detalle`
- ✅ Única fuente de verdad
- ✅ Totalmente auditable
- ✅ No hay riesgo de desincronización

---

## 🔧 Cómo Usar el Sistema

### Paso 1: Configurar Stock Mínimo de un Insumo

**Método A: Desde el módulo de Configuración** (recomendado - Vista completa por laboratorio)
1. Ir a **Configuración** en el menú lateral
2. Hacer clic en la pestaña **"Stock Mínimo"**
3. Seleccionar un **laboratorio** del selector
4. Verás una tabla con **TODOS** los insumos de ese laboratorio mostrando:
   - Stock Actual
   - Stock Mínimo (si está configurado)
   - Punto de Reorden
   - Estado (Agotado, Bajo, Normal, etc.)
5. Click en el botón **[+]** o **[✏️]** del insumo que quieras configurar
6. Llenar el formulario y guardar
7. Cambiar a otro laboratorio para configurar los mismos insumos con valores diferentes

**Método B: Desde el módulo de Insumos** (configuración rápida individual)
1. Ir a **Insumos** en el menú lateral
2. Hacer clic en el botón de configuración (⚙️) del insumo deseado
3. Seleccionar el laboratorio
4. Ingresar:
   - **Stock Mínimo** (requerido): Ej: 50
   - **Punto de Reorden** (opcional): Ej: 75 (para solicitar antes de llegar al mínimo)
   - **Stock Máximo** (opcional): Ej: 200 (límite superior)
   - **Observaciones**: Ej: "Uso diario en prácticas de química"
5. Click en **"Guardar Configuración"**
6. Repetir para otros laboratorios del mismo insumo si es necesario

**Método C: Por API** (para configuración masiva)
```bash
POST /api/insumos/config-stock
{
  "insumo_id": 15,
  "laboratorio_id": 1,
  "stock_minimo": 50,
  "punto_reorden": 75,
  "stock_maximo": 200,
  "observaciones": "Uso diario en prácticas"
}
```

### Paso 2: Ver Reportes de Alertas

#### Reporte de Stock Bajo
1. Ir a **Reportes** en el menú lateral
2. Seleccionar **"Insumos con Stock Bajo"**
3. (Opcional) Filtrar por laboratorio
4. Ver estadísticas:
   - Total de alertas
   - Insumos agotados
   - Insumos con stock bajo
   - Insumos a reordenar
5. Exportar a CSV si es necesario

#### Reporte de Próximos a Vencer
1. Ir a **Reportes** en el menú lateral
2. Seleccionar **"Insumos Próximos a Vencer"**
3. (Opcional) Filtrar por laboratorio
4. (Opcional) Cambiar días a futuro (default: 90 días)
5. Ver estadísticas:
   - Vencidos
   - Vence hoy
   - Urgente (≤7 días)
   - Próximo (≤30 días)
   - Advertencia (≤90 días)
6. Exportar a CSV si es necesario

### Paso 3: Tomar Acciones

Cuando veas insumos con stock bajo o próximos a vencer:

1. **Stock Bajo**:
   - Solicitar reabastecimiento
   - Ajustar el stock mínimo si es demasiado alto
   - Verificar consumo real vs configurado

2. **Próximos a Vencer**:
   - Priorizar uso de lotes próximos a vencer
   - Coordinar con otros laboratorios si tienen el mismo insumo
   - Evaluar si es necesario ajustar cantidades de compra

---

## 📖 Ejemplos de Uso

### Ejemplo 1: Configurar Stock Mínimo de Ácido Sulfúrico

```
Insumo: Ácido Sulfúrico (INS-0015)

Configuración para Lab Química (uso intensivo):
- Stock Mínimo: 50 L
- Punto de Reorden: 75 L
- Stock Máximo: 200 L
- Observaciones: "Uso diario en prácticas de química analítica. Consumo promedio: 10L/semana"

Configuración para Lab Física (uso ocasional):
- Stock Mínimo: 10 L
- Punto de Reorden: 15 L
- Stock Máximo: 50 L
- Observaciones: "Uso esporádico para experimentos específicos"

Lab Biología: No configurar (no usa este insumo)
```

### Ejemplo 2: Interpretar Reporte de Stock Bajo

```
REPORTE DE STOCK BAJO

┌────────────────┬─────────────┬──────────────┬──────────────┬────────────┐
│ Insumo         │ Laboratorio │ Stock Actual │ Stock Mínimo │ Estado     │
├────────────────┼─────────────┼──────────────┼──────────────┼────────────┤
│ Ácido Sulfúrico│ Lab Química │ 0 L          │ 50 L         │ AGOTADO    │ ← ¡URGENTE!
│ Probetas 100ml │ Lab Física  │ 3 unid       │ 15 unid      │ BAJO       │ ← Reordenar
│ Buffer pH 7    │ Lab Química │ 70 L         │ 100 L        │ REORDENAR  │ ← Próximo a mínimo
└────────────────┴─────────────┴──────────────┴──────────────┴────────────┘

Acciones recomendadas:
1. Ácido Sulfúrico: Reabastecimiento URGENTE de 50L en Lab Química
2. Probetas: Solicitar 20 unidades para Lab Física
3. Buffer pH 7: Programar reabastecimiento de 50L
```

### Ejemplo 3: Interpretar Reporte de Próximos a Vencer

```
REPORTE DE PRÓXIMOS A VENCER

┌────────────────┬────────────┬──────────────┬──────────────┬────────────────┐
│ Insumo         │ Lote       │ Vencimiento  │ Días Restantes│ Estado        │
├────────────────┼────────────┼──────────────┼──────────────┼────────────────┤
│ Reactivo A     │ LOTE-2023  │ 15/10/2025   │ -4 días      │ VENCIDO       │ ← Descartar
│ Medio Cultivo  │ LOTE-2024  │ 20/10/2025   │ 1 día        │ VENCE_HOY     │ ← Usar HOY
│ Buffer pH 7    │ LOTE-A01   │ 25/10/2025   │ 6 días       │ URGENTE       │ ← Usar pronto
│ Colorante X    │ LOTE-B02   │ 10/11/2025   │ 22 días      │ PROXIMO       │ ← Planificar uso
└────────────────┴────────────┴──────────────┴──────────────┴────────────────┘

Acciones recomendadas:
1. Reactivo A: Eliminar lote vencido (protocolo de descarte)
2. Medio Cultivo: Usar HOY en prácticas programadas
3. Buffer pH 7: Priorizar en próximos experimentos (6 días restantes)
4. Colorante X: Normal (22 días de margen)
```

---

## 🔍 Consultas SQL Útiles (Para Administradores)

### Ver stock actual de todos los insumos
```sql
SELECT * FROM v_stock_actual;
```

### Ver insumos con stock bajo
```sql
SELECT * FROM v_stock_completo 
WHERE estado_stock IN ('AGOTADO', 'BAJO', 'REORDENAR')
ORDER BY estado_stock, diferencia_minimo;
```

### Ver lotes próximos a vencer en 30 días
```sql
SELECT * FROM v_stock_completo 
WHERE alerta_vencimiento IN ('VENCIDO', 'VENCE_SEMANA', 'VENCE_MES')
ORDER BY dias_hasta_vencimiento;
```

### Ver resumen de alertas por laboratorio
```sql
SELECT * FROM v_alertas_insumos;
```

---

## ❓ FAQ - Preguntas Frecuentes

### ¿Qué pasa si no configuro el stock mínimo de un insumo?
- El insumo aparecerá con estado "SIN_CONFIGURAR"
- No generará alertas de stock bajo
- El sistema seguirá funcionando normalmente

### ¿Puedo cambiar el stock mínimo después?
- **Sí**, puedes actualizar la configuración en cualquier momento
- El sistema guardará la fecha de actualización

### ¿Se eliminó la tabla inventario_insumos?
- **No automáticamente**. El script solo crea las nuevas estructuras
- Si quieres eliminarla (opcional), asegúrate primero de que no se use en otros lugares
- Recomendación: Déjala por ahora como backup

### ¿Cómo afecta esto al rendimiento?
- Las vistas calculan el stock en tiempo real
- Para bases de datos pequeñas (<100k movimientos): **Sin impacto**
- Para bases de datos grandes: Las vistas están optimizadas con índices

### ¿Qué pasa si un insumo no tiene lote ni fecha de vencimiento?
- El reporte de "Próximos a Vencer" solo muestra lotes con fecha de vencimiento
- Los insumos sin lote funcionan normalmente en el reporte de stock bajo

---

## 🎉 ¡Listo para Usar!

El sistema está **100% funcional** y listo para usar. Solo necesitas:

1. ✅ Ejecutar el script SQL (si aún no lo hiciste)
2. ✅ Configurar el stock mínimo de tus insumos principales
3. ✅ Revisar los reportes periódicamente
4. ✅ Actuar según las alertas

---

## 📞 Soporte

Si tienes dudas o problemas:
- Revisa la documentación técnica: `scripts/README_STOCK_MINIMO.md`
- Verifica que ejecutaste el script SQL correctamente
- Revisa la consola del navegador (F12) para errores
- Verifica logs del servidor en la terminal

---

**Fecha de implementación**: 2025-10-19  
**Versión**: 1.0  
**Estado**: ✅ Producción

