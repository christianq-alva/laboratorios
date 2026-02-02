# Reglas de Negocio: Horarios (Reservas)

## Descripción del Módulo

El módulo de **Horarios** gestiona las reservas de laboratorios para clases o actividades. Cada reserva asocia un laboratorio, un docente, una escuela, un ciclo académico y un rango de fechas/horas. Opcionalmente se pueden asignar insumos y equipos requeridos.

---

## 1. Creación de Horarios

### 1.1 Entidades Requeridas

| Entidad | Regla | Mensaje de error |
|--------|--------|-------------------|
| **Escuela** | Debe existir en el sistema | "La escuela seleccionada no existe" |
| **Ciclo** | Debe existir en el sistema | "El ciclo seleccionado no existe" |
| **Docente** | Debe existir en el sistema | "Docente no encontrado" |
| **Laboratorio** | Implícito en la reserva; debe existir | — |

### 1.2 Cruce de Horarios

- **No puede haber dos reservas que se solapen** en el mismo laboratorio para el mismo rango de fechas/horas.
- **No puede haber dos reservas que se solapen** para el mismo docente en el mismo rango de fechas/horas.

**Cálculo de solapamiento**: Se considera conflicto si  
`(fecha_inicio_nueva < fecha_fin_existente) Y (fecha_fin_nueva > fecha_inicio_existente)`  
(o equivalentes según la implementación en `getCruceLab` / `getCruceDocente`).

**Tipos de conflicto**:
- **laboratorio**: "El laboratorio [nombre] ([ubicación]) ya está ocupado"
- **docente**: "El docente [nombre] ya tiene una clase programada"

En caso de conflicto se responde con **409 Conflict** e información del conflicto (`tipo_conflicto`, `conflicto_detalle`).

### 1.3 Fechas y Cantidad de Alumnos

- **fecha_inicio** y **fecha_fin** son obligatorias.
- **fecha_fin** debe ser **posterior** a **fecha_inicio**.
- **cantidad_alumnos** debe ser un entero **mayor a 0** (por defecto 1 en actualización).
- **color** debe ser un hexadecimal válido (#RRGGBB); por defecto `#4ecdc4`.

### 1.4 Insumos y Equipos

- **insumos**: array opcional. Cada elemento debe tener `insumo_id` (entero > 0) y `cantidad` (entero > 0).
- **equipos**: array opcional. Cada elemento debe tener `equipo_id` (entero > 0).
- Los insumos y equipos deben estar configurados/disponibles para el laboratorio (validación implícita en el modelo).

---

## 2. Actualización de Horarios

- Se aplican **las mismas reglas** que en creación para: escuela, ciclo, docente, cruces, fechas, insumos y equipos.
- Al verificar cruces se **excluye el horario que se está editando** (se pasa `horarioId` como `reserva_id`).
- Se reemplazan por completo los insumos y equipos asociados: se eliminan los anteriores y se insertan los nuevos.

---

## 3. Eliminación de Horarios

- El horario debe **existir**.
- **No se puede eliminar** un horario con estado **cerrado** (`estado === 'C'`).  
  Mensaje: "Horario cerrado, no se puede eliminar" (409).
- Al eliminar se borran en orden: `detalle_reserva_insumos`, `detalle_reserva_equipos`, y luego la reserva.
- Se registra la actividad de eliminación en `actividad_horarios`.

---

## 4. Cierre de Horarios

### 4.1 Cerrar Horario (sin insumos)

- El horario debe existir.
- El horario **no** debe estar ya cerrado.  
  Si está cerrado: "El Horario ya se encuentra cerrado" (409).
- Al cerrar se actualiza `reservas.estado` a cerrado (`'C'`).
- Se registra la actividad de cierre en `actividad_horarios` con acción `'cerrar'`.

### 4.2 Cerrar Horario con Insumos

- Mismas condiciones que cerrar sin insumos (existencia y no cerrado).
- Se requiere: `laboratorio_id`, `tipo_movimiento` (entrada/salida), `fecha_movimiento`, `reserva_id`, `detalles` (array de insumos con cantidades y, si es salida, `entrada_detalle_id`).
- Se cierra el horario y se registra un movimiento de inventario (salida típicamente) asociado a la reserva, con las reglas del módulo de Insumos (stock, lotes, etc.).
- **Se actualiza el campo `tiene_consumo_insumos = 1`** en la tabla `reservas` para indicar que el horario tiene consumo de insumos registrado.
- Se registra la actividad de cierre en `actividad_horarios` con acción `'cerrar'` incluyendo el ID del movimiento de inventario.

---

## 5. Reapertura de Horarios

### 5.1 Reabrir Horario

- El horario debe existir.
- El horario **debe** estar cerrado (`estado === 'C'`).  
  Si no está cerrado: "El horario no está cerrado" (409).
- Si el horario tiene un movimiento de inventario asociado (`movimientos_insumos.reserva_id`):
  - Se elimina el movimiento de inventario (esto revierte automáticamente los saldos de los lotes afectados).
  - **Se actualiza el campo `tiene_consumo_insumos = 0`** en la tabla `reservas` para indicar que ya no tiene consumo registrado.
  - Se actualiza el estado del horario a programado (`'P'`).
- Si el horario no tiene movimiento de inventario:
  - Se actualiza el estado del horario a programado (`'P'`).
- Se registra la actividad de reapertura en `actividad_horarios` con acción `'reabrir'`, indicando si se eliminó un movimiento de inventario.
- Después de reabrir, el horario puede ser editado nuevamente.

**Nota**: La eliminación del movimiento de inventario revierte los saldos de los lotes que fueron afectados por la salida original, restaurando el inventario al estado previo al cierre.

---

## 6. Consultas y Filtros

- **Rango de fechas**: En listado de horarios, si se envían `fecha_inicio` y `fecha_fin`, el rango máximo permitido es **60 días**. Si se excede: "El rango máximo permitido es de 60 días" (400). La fecha de inicio debe ser anterior a la fecha de fin.
- **Verificar disponibilidad**: Permite comprobar si hay conflicto para un laboratorio y docente en un rango de fechas, opcionalmente excluyendo un `horario_id` (por ejemplo, al editar).

### 6.1 Consulta de Horario por ID (`getHorarioById`)

- Retorna el horario completo con la siguiente información adicional:
  - **`insumos`**: Array de insumos requeridos/planificados (de `detalle_reserva_insumos`), con `cantidad_usada` (cantidad planificada).
  - **`insumos_consumidos`**: Array de insumos realmente consumidos (de `movimiento_insumo_detalle` cuando existe movimiento de salida asociado), con `cantidad_consumida` (suma de cantidades del movimiento). Solo aparece si el horario tiene `tiene_consumo_insumos = 1`.
  - **`tiene_consumo_insumos`**: Campo booleano (0/1) que indica si el horario tiene un movimiento de consumo de insumos asociado. Permite identificar rápidamente horarios con consumo registrado sin necesidad de consultas adicionales.
  - **`equipos`**: Array de equipos requeridos.

**Nota**: El campo `tiene_consumo_insumos` se mantiene automáticamente sincronizado:
- Se establece en `1` cuando se cierra un horario con consumo de insumos.
- Se establece en `0` cuando se reabre un horario que tenía movimiento asociado.

---

## 7. Permisos y Visibilidad

- Los horarios se filtran según el **rol** y los **laboratorio_ids** del usuario (Jefe de Laboratorio solo ve sus laboratorios; Administrador ve todos).
- Las acciones (crear, editar, eliminar, cerrar, reabrir, verificar disponibilidad) están sujetas a los permisos definidos en el sistema de autorización (recurso "Horario").

---

## 8. Actividad y Auditoría

- Se registra en `actividad_horarios` las acciones: **crear**, **editar**, **eliminar**, **cerrar**, **reabrir**, con descripción, reserva_id, usuario_id, ip_address y fecha (America/Lima).
- Las acciones de cierre y reapertura incluyen información sobre movimientos de inventario cuando aplica.

---

## 9. Resumen de Códigos HTTP y Mensajes

| Código | Situación |
|--------|-----------|
| 400 | Rango de fechas > 60 días; fecha_fin ≤ fecha_inicio |
| 404 | Escuela, ciclo, docente u horario no encontrado |
| 409 | Conflicto de horario (laboratorio o docente); horario cerrado (no se puede eliminar/cerrar dos veces); horario no cerrado (no se puede reabrir) |
| 500 | Error interno (con mensaje genérico o de excepción) |

---

**Referencias en código**: `server/controllers/horarioController.js`, `server/models/Horario.js`, `server/validations/schemas/horario.js`, rutas en `server/routes/horarioRoutes.js`.
