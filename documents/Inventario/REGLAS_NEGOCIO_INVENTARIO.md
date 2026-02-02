# Reglas de Negocio: Inventario

## Descripción del Módulo

El módulo de **Inventario** gestiona el stock por laboratorio mediante movimientos de **entrada** y **salida**, con trazabilidad por lote y fecha de vencimiento. Utiliza el catálogo de **Insumos**; solo los insumos configurados por laboratorio pueden tener movimientos.

---

## 1. Movimientos de Inventario

### 1.1 Tipos de Movimiento

- **entrada**: incrementa stock. Se puede indicar lote y fecha de vencimiento por detalle.
- **salida**: disminuye stock. **Debe** indicarse de qué lote/entrada se sale (`entrada_detalle_id`).

### 1.2 Reglas de Salida

- Para cada detalle de tipo **salida** es obligatorio **entrada_detalle_id** (referencia al detalle de una entrada previa).
- El **saldo** del detalle de entrada referenciado debe ser **≥ cantidad** solicitada.  
  Si no: "Saldo insuficiente en el lote [id]. Disponible: [X], solicitado: [Y]."
- Al registrar la salida se **descuenta** el saldo del detalle de entrada (`movimiento_insumo_detalle.saldo`).

### 1.3 Registro de Movimiento Manual

- **laboratorio_id**, **tipo_movimiento**, **fecha_movimiento**, **detalles** (array con al menos un elemento) son requeridos.
- **reserva_id** y **observaciones** son opcionales.
- Cada detalle: `insumo_id`, `cantidad` (entero > 0). Para salida: `entrada_detalle_id` obligatorio; para entrada: opcionalmente `lote`, `fecha_vencimiento`.
- Los insumos deben estar configurados para el laboratorio (inventario_insumos).

### 1.4 Reabastecimiento Masivo

- Se envía `datos_reabastecimiento` (array), `fecha_movimiento`, `laboratorio_id`, y opcionalmente `motivo_general`.
- Cada elemento puede incluir código de insumo, lote, fecha de vencimiento y cantidad.
- Los insumos deben estar configurados para el laboratorio; si un código no es válido para el laboratorio, se reporta en errores.

### 1.5 Eliminación de Movimiento

- Permite eliminar un movimiento de inventario (y sus detalles). Se revierten saldos cuando el movimiento es una salida (se devuelve cantidad al lote de entrada referenciado). Si el movimiento estaba ligado a una reserva, la reserva puede actualizarse a estado pendiente según lógica en `Inventario.eliminarMovimientoInventario`.

---

## 2. Cierre de Horario con Insumos

- Al cerrar un horario con consumo de insumos se registra un movimiento de tipo **salida** asociado a `reserva_id`.
- Los detalles deben cumplir las reglas de salida (entrada_detalle_id, saldo suficiente).
- El horario no debe estar ya cerrado.

---

## 3. Consultas y Permisos

- **Insumos con stock**: Se filtran por rol. Jefe de Laboratorio solo ve insumos de sus `laboratorio_ids`.
- **Lotes con saldo**: Por laboratorio e insumo; solo se consideran lotes con saldo > 0 cuando aplica.
- **Actividad de insumos**: Filtrada por rol, laboratorio, rango de fechas y tipo de movimiento.

---

## 4. Configuración de Insumos por Laboratorio

- Un laboratorio tiene una lista de insumos “configurados” en **inventario_insumos**.
- Solo esos insumos pueden tener movimientos (entrada/salida) en ese laboratorio.
- La plantilla de reabastecimiento y la validación de movimientos usan esta configuración.

---

## 5. Resumen de Mensajes y Códigos

| Código | Situación |
|--------|-----------|
| 400 | Datos incompletos; archivo Excel sin datos válidos; validación de esquema (Zod) |
| 404 | Laboratorio o movimiento no encontrado |
| 409 | Horario ya cerrado (al cerrar con insumos) |
| 500 | Saldo insuficiente en lote; error interno |

---

**Referencias en código**: `server/controllers/inventarioController.js`, `server/services/inventarioService.js`, `server/models/Inventario.js`, `server/validations/schemas/inventario.js`.

**Nomenclatura**: El modelo expone `Inventario.registrarMovimiento(connection, ...)` para registrar cualquier movimiento (entrada/salida); lo usan el flujo de movimiento manual (`inventarioService.registrarMovimientoManual`) y el de reabastecimiento masivo (`inventarioService.ejecutarReabastecimientoMasivo`). La ruta y el controller del movimiento manual siguen llamándose "movimiento-manual" / `registrarMovimientoManual`.
