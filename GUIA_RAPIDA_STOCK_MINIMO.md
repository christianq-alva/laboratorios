# 🚀 Guía Rápida - Sistema de Stock Mínimo

## ✅ IMPLEMENTACIÓN 100% COMPLETA

El sistema de gestión de stock mínimo está **totalmente funcional** y listo para usar.

---

## 📍 DÓNDE ENCONTRAR TODO

### 1️⃣ Configuración de Stock Mínimo (Vista Principal)

**Ubicación:** Configuración → Pestaña "Stock Mínimo"

```
MENÚ LATERAL
├─ Dashboard
├─ Horarios
├─ Equipos
├─ Insumos
├─ Incidencias
├─ 📋 Configuración  ← Click aquí
│   ├─ Tipos de Equipo
│   ├─ Docentes
│   ├─ Catálogo de Insumos
│   ├─ Laboratorios
│   ├─ Escuelas
│   └─ 🆕 Stock Mínimo  ← Nueva pestaña
└─ Reportes
```

**Vista de la Tabla:**

```
╔══════════════════════════════════════════════════════════════════╗
║ Configuración de Stock Mínimo por Laboratorio                    ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║ Laboratorio: [Lab Química ▼]                    [🔄 Actualizar]  ║
║                                                                   ║
║ 📊 Configurados: 15 | Sin configurar: 8 | Stock bajo: 3          ║
║                                                                   ║
╠═══════════╦══════════╦═════════╦═══════════╦═══════════╦═════════╣
║ Código    ║ Insumo   ║ Stock   ║ Stock     ║ Punto     ║ Estado  ║
║           ║          ║ Actual  ║ Mínimo    ║ Reorden   ║         ║
╠═══════════╬══════════╬═════════╬═══════════╬═══════════╬═════════╣
║ INS-0001  ║ Ácido    ║ 45 L    ║ 50 L      ║ 75 L      ║ ⚠️ BAJO ║
║           ║ Sulfúrico║         ║           ║           ║ [✏️]    ║
╠═══════════╬══════════╬═════════╬═══════════╬═══════════╬═════════╣
║ INS-0002  ║ Probetas ║ 120 u   ║ 100 u     ║ 150 u     ║ ✅ OK   ║
║           ║ 100ml    ║         ║           ║           ║ [✏️]    ║
╠═══════════╬══════════╬═════════╬═══════════╬═══════════╬═════════╣
║ INS-0003  ║ Buffer   ║ 8 L     ║ 15 L      ║ 20 L      ║ ⚠️ BAJO ║
║           ║ pH 7     ║         ║           ║           ║ [✏️]    ║
╠═══════════╬══════════╬═════════╬═══════════╬═══════════╬═════════╣
║ INS-0004  ║ Etanol   ║ 25 L    ║ No config ║ -         ║ Sin cfg ║
║           ║ 96%      ║         ║           ║           ║ [+]     ║
╚═══════════╩══════════╩═════════╩═══════════╩═══════════╩═════════╝

              [← 1-10 de 23 →]  [Filas por página: 10 ▼]
```

**Características:**
- ✅ Selector de laboratorio
- ✅ Vista completa de todos los insumos del laboratorio
- ✅ Stock actual calculado en tiempo real
- ✅ Estados visuales (Agotado, Bajo, Normal, etc.)
- ✅ Botón [+] para configurar nuevos
- ✅ Botón [✏️] para editar existentes
- ✅ Paginación
- ✅ Estadísticas rápidas

---

### 2️⃣ Configuración Rápida desde Insumos

**Ubicación:** Insumos → Botón ⚙️ en cada fila

**Características:**
- Configuración individual rápida
- Ver todas las configuraciones del insumo
- Agregar más laboratorios

---

### 3️⃣ Reportes de Alertas

**Ubicación:** Reportes → Últimas 2 pestañas

#### 📉 Insumos con Stock Bajo
- Muestra: Agotados, Bajo, Reordenar
- Filtro por laboratorio
- Estadísticas en tiempo real
- Exportable a CSV

#### 📅 Insumos Próximos a Vencer
- Muestra: Vencidos, Vence Hoy, Urgente, Próximo
- Filtro por laboratorio y días
- Estadísticas en tiempo real
- Exportable a CSV

---

## 🎯 Flujo de Trabajo Recomendado

### Setup Inicial (Una sola vez)

1. **Ir a Configuración → Stock Mínimo**
2. **Seleccionar Lab Química**
3. **Configurar stock mínimo** de los 10-15 insumos más importantes:
   - Reactivos críticos: stock alto
   - Materiales de uso diario: stock medio
   - Materiales ocasionales: stock bajo

4. **Cambiar a Lab Física** y repetir con valores diferentes
5. **Repetir para cada laboratorio**

### Monitoreo Continuo (Semanal)

1. **Ir a Reportes → Insumos con Stock Bajo**
2. Revisar alertas
3. Solicitar reabastecimiento según prioridad:
   - 🔴 Agotados: URGENTE
   - 🟡 Bajo: Esta semana
   - 🔵 Reordenar: Próxima semana

4. **Ir a Reportes → Insumos Próximos a Vencer**
5. Coordinar uso de lotes próximos a vencer
6. Descartar lotes vencidos según protocolo

---

## 📊 Personalización por Laboratorio

### Ejemplo Real: Ácido Sulfúrico

**Lab Química (uso intensivo)**
```
Stock Actual:    45 L
Stock Mínimo:    50 L    ← Consumo diario
Punto Reorden:   75 L    ← Solicitar cuando llegue aquí
Stock Máximo:   200 L    ← Límite de almacenamiento
Observaciones: "Uso diario en prácticas de química analítica. 
                Consumo promedio: 10L/semana"
Estado: ⚠️ BAJO (necesita reabastecimiento)
```

**Lab Física (uso ocasional)**
```
Stock Actual:    12 L
Stock Mínimo:    10 L    ← Consumo esporádico
Punto Reorden:   15 L
Stock Máximo:    50 L
Observaciones: "Uso esporádico para experimentos específicos"
Estado: ✅ NORMAL
```

**Lab Biología (no usa)**
```
Sin configuración (este insumo no se usa en este laboratorio)
```

---

## 🎨 Interfaz Visual Completa

### Módulo de Configuración → Stock Mínimo

```
┌────────────────────────────────────────────────────────────────┐
│ 📋 Configuración                                                │
├────────────────────────────────────────────────────────────────┤
│ [Tipos Equipo] [Docentes] [Catálogo] [Labs] [Escuelas] [Stock]│← Tabs
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Configuración de Stock Mínimo por Laboratorio   [🔄 Actualizar│
│                                                                 │
│  Laboratorio: [Lab Química ▼]                                  │
│                                                                 │
│  📊 Total: 23 | Configurados: 15 | Sin configurar: 8 | Bajo: 3│
│                                                                 │
│ ┌──────────┬────────────┬────────┬─────────┬────────┬────────┐│
│ │ Código   │ Insumo     │ Stock  │ Stock   │ Punto  │ Estado ││
│ │          │            │ Actual │ Mínimo  │ Reorden│        ││
│ ├──────────┼────────────┼────────┼─────────┼────────┼────────┤│
│ │ INS-0001 │ Ácido Sulf │ 45 L   │ 50 L    │ 75 L   │⚠️ BAJO ││
│ │          │            │        │         │        │  [✏️]  ││
│ ├──────────┼────────────┼────────┼─────────┼────────┼────────┤│
│ │ INS-0002 │ Probetas   │ 120 u  │ 100 u   │ 150 u  │✅ OK   ││
│ │          │            │        │         │        │  [✏️]  ││
│ ├──────────┼────────────┼────────┼─────────┼────────┼────────┤│
│ │ INS-0003 │ Buffer pH7 │ 8 L    │ 15 L    │ 20 L   │⚠️ BAJO ││
│ │          │            │        │         │        │  [✏️]  ││
│ ├──────────┼────────────┼────────┼─────────┼────────┼────────┤│
│ │ INS-0004 │ Etanol 96% │ 25 L   │ No cfg  │ -      │Sin cfg ││
│ │          │            │        │         │        │  [+]   ││
│ └──────────┴────────────┴────────┴─────────┴────────┴────────┘│
│                                                                 │
│              [← Anterior] 1-10 de 23 [Siguiente →]             │
│              Filas por página: [10 ▼]                          │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Al hacer click en [✏️] o [+]:

```
╔════════════════════════════════════════════════════════════╗
║  ⚙️ Configurar Stock Mínimo                        [X]     ║
║  Ácido Sulfúrico                                           ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  📋 Configuraciones Existentes (2)                        ║
║  ┌──────────────┬────────┬─────────┬────────┐            ║
║  │ Laboratorio  │ Stock  │ Mínimo  │ Estado │            ║
║  ├──────────────┼────────┼─────────┼────────┤            ║
║  │ Lab Química  │  45 L  │  50 L   │ ⚠️ Bajo│            ║
║  │ Lab Física   │  12 L  │  10 L   │ ✅ OK  │            ║
║  └──────────────┴────────┴─────────┴────────┘            ║
║                                                            ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━          ║
║                                                            ║
║  🆕 Nueva Configuración                                    ║
║                                                            ║
║  Laboratorio: [Lab Biología ▼]                            ║
║  Stock Mínimo: [    20     ] *                            ║
║  Punto Reorden: [    30     ]                             ║
║  Stock Máximo: [   100     ]                              ║
║  Observaciones:                                            ║
║  ┌────────────────────────────────────────────────┐       ║
║  │ Uso moderado en prácticas de bioquímica        │       ║
║  │ Consumo promedio: 3L/semana                    │       ║
║  └────────────────────────────────────────────────┘       ║
║                                                            ║
║                              [Cerrar] [💾 Guardar]         ║
╚════════════════════════════════════════════════════════════╝
```

---

## 🎯 Casos de Uso

### Caso 1: Configurar Stock de Insumo Nuevo

1. Ve a **Configuración → Stock Mínimo**
2. Selecciona **Lab Química**
3. Busca el insumo "Ácido Clorhídrico"
4. Click en **[+]** (botón azul con +)
5. Llena:
   - Stock Mínimo: **50**
   - Punto Reorden: **75**
   - Observaciones: "Uso diario"
6. **Guardar**
7. Cambia a **Lab Física** y repite con valores diferentes

---

### Caso 2: Ver Alertas de Stock Bajo

1. Ve a **Reportes** (menú lateral)
2. Click en **"Insumos con Stock Bajo"**
3. Verás tarjetas con:
   - 🔴 Agotados: 2
   - 🟡 Stock Bajo: 5
   - 🔵 Reordenar: 3
4. En la tabla verás **qué** insumos y **cuánto** falta
5. Exporta a CSV si necesitas
6. Solicita reabastecimiento

---

### Caso 3: Ver Insumos por Vencer

1. Ve a **Reportes** (menú lateral)
2. Click en **"Insumos Próximos a Vencer"**
3. Cambia los días si quieres (default: 90 días)
4. Verás lotes clasificados por urgencia:
   - 🔴 Vencidos
   - 🟡 Urgente (≤7 días)
   - 🔵 Próximo (≤30 días)
5. Prioriza el uso de lotes próximos a vencer
6. Coordina con otros laboratorios si tienen el mismo insumo

---

## 🔑 Funciones Principales

### ConfigStockTable (Configuración → Stock Mínimo)
✅ Vista completa de todos los insumos por laboratorio  
✅ Stock actual calculado en tiempo real  
✅ Configurar/Editar stock mínimo  
✅ Estados visuales (Agotado, Bajo, Normal)  
✅ Estadísticas rápidas  
✅ Paginación  

### ReporteStockBajo (Reportes)
✅ Alertas de insumos agotados  
✅ Alertas de stock bajo  
✅ Alertas de reorden  
✅ Filtro por laboratorio  
✅ Exportación CSV  
✅ Estadísticas detalladas  

### ReporteProximosVencer (Reportes)
✅ Lotes vencidos o por vencer  
✅ Clasificación por urgencia  
✅ Filtro por laboratorio y días  
✅ Información de almacenamiento  
✅ Exportación CSV  
✅ Estadísticas detalladas  

---

## 📌 Ventajas del Sistema

### 1. Personalización Total
- Cada laboratorio configura según su necesidad
- Mismo insumo, stock mínimo diferente

### 2. Sin Tabla Redundante
- No usa `inventario_insumos`
- Todo desde movimientos
- Única fuente de verdad

### 3. Alertas Inteligentes
- Estados calculados automáticamente
- Priorización visual
- Estadísticas en tiempo real

### 4. Auditable
- Todos los cambios rastreables
- Fechas de configuración
- Observaciones documentadas

---

## ⚡ Quick Start

1. **Ejecuta el script SQL** (si aún no lo hiciste):
   ```bash
   node scripts/ejecutar_stock_minimo_v2.js
   ```

2. **Abre la aplicación**

3. **Ve a Configuración → Stock Mínimo**

4. **Selecciona un laboratorio**

5. **Configura los insumos más importantes**

6. **Ve a Reportes** para ver las alertas

---

## 🎉 ¡Sistema Listo!

Todo está implementado y funcionando. Solo necesitas:
- ✅ Abrir la aplicación
- ✅ Ir a Configuración → Stock Mínimo
- ✅ Empezar a configurar

**¡Disfruta del nuevo sistema!** 🚀

