# Reglas de Negocio: Incidencias

## Descripción del Módulo

El módulo de **Incidencias** permite reportar incidencias asociadas a una **reserva** (clase/horario) realizada en un laboratorio. Cada incidencia tiene título, descripción y queda ligada a la reserva, al laboratorio y al usuario que la reporta.

---

## 1. Creación de Incidencias

### 1.1 Datos Requeridos

- **reserva_id**: ID de la reserva (horario) sobre la que se reporta.
- **titulo**: título de la incidencia.
- **descripcion**: descripción del problema o evento.

El **reportado_por** se toma del usuario autenticado (`req.user.userId`).

### 1.2 Permisos para Crear

- **Administrador**: puede crear incidencias para **cualquier** reserva.
- **Jefe de Laboratorio**: solo puede crear incidencias para reservas cuyo **laboratorio_id** esté en su lista **laboratorio_ids**.
- Otros roles: no pueden crear incidencias (se devuelve 403: "No puedes crear incidencias para esta reserva").

La validación se hace con `Incidencia.canCreateForReserva(reserva_id, user)`.

---

## 2. Consulta de Incidencias

### 2.1 Listado por Usuario

- **Administrador**: ve **todas** las incidencias.
- **Jefe de Laboratorio**: solo incidencias de reservas pertenecientes a sus **laboratorio_ids**. Si no tiene laboratorios asignados, no ve ninguna.

Orden: por `fecha_reporte` descendente.

### 2.2 Detalle por ID

- Misma regla de visibilidad: Administrador ve cualquiera; Jefe de Laboratorio solo si la reserva de la incidencia está en sus laboratorios.
- Si no existe o no tiene permiso: 404 "Incidencia no encontrada o sin permisos para verla".

---

## 3. Eliminación de Incidencias

- El usuario debe tener permiso para **ver** la incidencia (mismas reglas que listado/detalle).
- **Administrador**: puede eliminar cualquier incidencia.
- **Jefe de Laboratorio**: puede eliminar incidencias de sus laboratorios.
- La verificación se hace con una sola lectura: `Incidencia.getById(incidenciaId, user)`. Si devuelve null (no existe o no tiene permiso): 404 "Incidencia no encontrada o no tienes permisos para eliminarla". Si devuelve la incidencia, se procede a eliminarla.

---

## 4. Horarios para Reportar Incidencias

- El endpoint de horarios para incidencias devuelve reservas (por ejemplo, último mes) según rol y laboratorio_ids, para que el usuario elija sobre qué reserva reportar.

---

## 5. Resumen de Códigos y Mensajes

| Código | Situación |
|--------|-----------|
| 403 | No puede crear incidencia para esa reserva |
| 404 | Incidencia no encontrada, sin permisos para verla o sin permisos para eliminarla |
| 500 | Error interno |

---

**Referencias en código**: `server/controllers/incidenciaController.js`, `server/models/Incidencia.js`.
