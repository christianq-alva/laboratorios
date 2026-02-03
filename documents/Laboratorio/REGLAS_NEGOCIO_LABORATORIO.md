# Reglas de Negocio: Laboratorio

## Descripción del Módulo

El módulo de **Laboratorio** gestiona los laboratorios: creación, actualización, eliminación, cambio de estado y configuración de insumos por laboratorio. Sigue el patrón **Controller → Service → Model** como módulo complejo. La visibilidad del listado depende del rol y de los laboratorios asignados al usuario.

---

## 1. Creación de Laboratorios

### 1.1 Campos Obligatorios

- **codigo**, **nombre**, **ubicacion**, **escuela_id**, **piso** según esquema de validación.
- **estado**: opcional; valores según configuración (p. ej. Activo, En Mantenimiento, Inhabilitado, Baja). Por defecto: `Activo`.

### 1.2 Reglas

- **escuela_id** debe corresponder a una escuela **existente**. Si no: "La escuela seleccionada no existe" (400). Validación en el modelo `Laboratorio.create`.

---

## 2. Actualización de Laboratorios

- El laboratorio debe **existir**. Si no: "Laboratorio no encontrado" (404). Validación en laboratorioService.update (getLaboratorioById).
- Si se envía **escuela_id**, debe existir. Mismo mensaje que en creación si no existe. Validación en el modelo `Laboratorio.update`.

---

## 3. Eliminación de Laboratorios

- El laboratorio debe existir. Si no: "Laboratorio no encontrado" (404). Validación en el modelo `Laboratorio.delete` (getLaboratorioById).
- **No se puede eliminar** si tiene relaciones: equipos, reservas, inventario_insumos o incidencias. Mensaje: "No se puede eliminar el laboratorio porque está relacionado con otras tablas del sistema y tiene datos asociados (equipos, insumos, horarios, incidencias u otros registros). Primero debes eliminar o reasignar estos registros para poder eliminar el laboratorio." (409). Validación en el modelo `Laboratorio.delete` (checkRelations).

---

## 4. Cambio de Estado

- El laboratorio debe existir. Si no: "Laboratorio no encontrado" (404). Validación en laboratorioService.changeEstado (getLaboratorioById).
- **No se puede cambiar el estado** si el laboratorio está **Activo** y cumple alguna de estas condiciones:
  - Tiene **reservas pendientes** (reservas con `estado = 'P'` y `fecha_inicio` en el futuro).
  - Tiene **insumos con saldo** en su inventario (al menos un insumo con stock > 0 en ese laboratorio).
  En ese caso: "No se puede cambiar el estado del laboratorio porque tiene reservas pendientes y/o insumos con saldo en su inventario. Cancele o reasigne las reservas y ajuste el inventario antes de cambiar el estado." (409). Validación en laboratorioService.changeEstado (Laboratorio.hasReservasPendientes, Inventario.tieneInsumosConSaldoPositivo).
- Si no aplica la restricción anterior, se actualiza el campo **estado** del laboratorio según valores permitidos en el esquema.

---

## 5. Configuración de Insumos

- El laboratorio debe existir. Si no: "Laboratorio no encontrado" (404). Validación en laboratorioService.configurarInsumos (exists).
- Se **reemplaza** la configuración anterior de insumos del laboratorio por la lista enviada (**insumo_ids**). Operación atómica en transacción: DELETE de filas en `inventario_insumos` para ese laboratorio_id, INSERT de las nuevas asociaciones.
- La transacción es manejada por **laboratorioService** (getConnection, beginTransaction, Laboratorio.configurarInsumos(..., connection), commit/rollback, release).

---

## 6. Consultas y Visibilidad

- **Listar laboratorios**: Filtrado por **rol** y **laboratorio_ids**. Jefe de Laboratorio solo ve laboratorios cuyos id están en sus laboratorio_ids; Administrador ve todos. Implementado en Laboratorio.getAllByUser.
- **Obtener insumos de un laboratorio**: El laboratorio debe existir; si no, 404. Devuelve los insumos configurados en `inventario_insumos` para ese laboratorio.

---

## 7. Resumen de Códigos y Mensajes

| Código | Situación |
|--------|-----------|
| 400 | Escuela no existe (crear/actualizar) |
| 404 | Laboratorio no encontrado (actualizar, eliminar, cambiar estado, insumos, configurar insumos) |
| 409 | No se puede eliminar por relaciones (equipos, reservas, inventario, incidencias); no se puede cambiar estado si está Activo y tiene reservas pendientes y/o insumos con saldo en inventario |

---

**Referencias en código**: `server/controllers/laboratorioController.js`, `server/services/laboratorioService.js`, `server/models/Laboratorio.js`, `server/models/Inventario.js`, `server/validations/schemas/laboratorio.js`.
