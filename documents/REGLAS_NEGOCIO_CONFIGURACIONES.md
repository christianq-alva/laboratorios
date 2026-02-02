# Reglas de Negocio: Configuraciones

Este documento agrupa las reglas de negocio de los módulos de **configuración**: Laboratorios, Escuelas, Docentes, Usuarios, Unidades de medida, Tipos de equipo, Ciclos y Roles. Solo se documentan **Roles** y **Ciclos** de forma breve cuando aplican reglas explícitas en controladores; el resto se detalla por entidad.

---

## 1. Laboratorios

**Módulo complejo** (Controller → Service → Model). Flujo y reglas detalladas: `documents/Laboratorio/FLUJO_LABORATORIO.md`, `documents/Laboratorio/REGLAS_NEGOCIO_LABORATORIO.md`.

### 1.1 Creación

- **codigo**, **nombre**, **ubicacion**, **escuela_id**, **piso** son obligatorios.
- **escuela_id** debe corresponder a una escuela **existente**. Si no: "La escuela seleccionada no existe" (400).
- **estado**: uno de `Activo`, `En Mantenimiento`, `Inhabilitado`, `Baja`. Por defecto: `Activo`.

### 1.2 Actualización

- El laboratorio debe existir.
- Si se envía **escuela_id**, debe existir. Mismo mensaje que en creación si no existe.

### 1.3 Eliminación

- Si la base de datos impide el borrado por relaciones (equipos, insumos, horarios, incidencias, etc.), se devuelve 400 con mensaje: "No se puede eliminar el laboratorio porque está relacionado con otras tablas del sistema y tiene datos asociados (equipos, insumos, horarios, incidencias u otros registros). Primero debes eliminar o reasignar estos registros para poder eliminar el laboratorio."

### 1.4 Cambio de Estado

- Permite actualizar el **estado** del laboratorio (Activo, En Mantenimiento, etc.) según esquema y permisos.

### 1.5 Configuración de Insumos

- Se puede asignar la lista de insumos configurados por laboratorio (tabla `inventario_insumos`). Se reemplaza la configuración anterior por la nueva lista de `insumo_ids`.

### 1.6 Visibilidad

- Listado filtrado por **rol** y **laboratorio_ids**: Jefe de Laboratorio solo ve sus laboratorios; Administrador ve todos.

---

## 2. Escuelas

### 2.1 Creación

- **nombre** obligatorio.
- El **nombre** no puede estar duplicado. Si ya existe una escuela con ese nombre: "Ya existe una escuela con ese nombre" (409).

### 2.2 Actualización

- La escuela debe existir.
- El **nombre** no puede coincidir con el de **otra** escuela (excluyendo la actual). Si existe otra con ese nombre: "Ya existe otra escuela con ese nombre" (409).

### 2.3 Eliminación

- La escuela debe existir.
- **No se puede eliminar** si tiene **docentes** u otras relaciones (según `Escuela.checkRelations`). Mensaje: "No se puede eliminar. La escuela \"[nombre]\" está siendo usada en el sistema: [detalle]." (409).

---

## 3. Docentes

### 3.1 Creación

- **nombre** obligatorio; **correo**, **escuela_id** según esquema.
- El **correo** (si se envía) no puede estar ya usado por otro docente. Si existe: "Ya existe un docente con ese correo" (400).

### 3.2 Actualización

- El docente debe existir.
- Si se envía **correo**, no puede estar usado por **otro** docente (excluyendo el actual). "Ya existe otro docente con ese correo" (400).

### 3.3 Eliminación

- El docente debe existir.
- **No se puede eliminar** si tiene **horarios programados** (reservas activas o con registros). Mensaje: "No se puede eliminar. El docente tiene horarios programados" (400).

---

## 4. Usuarios

### 4.1 Creación

- **nombre_completo**, **usuario**, **contrasena**, **rol_id** según esquema. **laboratorio_ids** opcional (array; aplica para rol Jefe de Laboratorio).
- El **usuario** (login) debe ser **único**. Si ya existe: respuesta 409 con mensaje "Ya existe un usuario con ese nombre de usuario" (o el que lance el modelo).

### 4.2 Actualización

- El usuario debe existir.
- Si se envía **usuario**, no puede coincidir con el de otro usuario (excluyendo el actual). Mismo tipo de mensaje 409.
- La contraseña se hashea antes de guardar si se envía.

### 4.3 Eliminación

- El usuario debe existir. No se permite eliminar si falla el delete en BD.

### 4.4 Cambio de Estado

- Permite activar/desactivar usuario (**estado**: activo/inactivo según esquema).
- **Un usuario no puede cambiar su propio estado.** Si `req.user.userId === usuarioId`: 403 "No puedes cambiar tu propio estado".

---

## 5. Unidades de Medida

### 5.1 Creación

- **simbolo**, **nombre** obligatorios; **descripcion** opcional.
- **simbolo** debe ser **único**. Si ya existe: "Ya existe una unidad con ese símbolo" (409).
- **nombre** debe ser **único**. Si ya existe: "Ya existe una unidad con ese nombre" (409).

### 5.2 Actualización

- La unidad debe existir.
- **simbolo** no puede repetirse en otra unidad (excluyendo la actual). "Ya existe otra unidad con ese símbolo" (409).
- **nombre** no puede repetirse en otra unidad. "Ya existe otra unidad con ese nombre" (409).

### 5.3 Eliminación

- La unidad debe existir.
- **No se puede eliminar** si hay **insumos** que usan esa unidad. Mensaje: "No se puede eliminar. La unidad \"[nombre]\" está siendo usada en el sistema: [detalle]." (409).

---

## 6. Tipos de Equipo

### 6.1 Creación

- **nombre** obligatorio; **descripcion** opcional.
- El **nombre** debe ser **único**. Si ya existe: "Ya existe un tipo de equipo con ese nombre" (409 vía modelo).

### 6.2 Actualización

- El tipo debe existir.
- El **nombre** no puede coincidir con el de otro tipo (excluyendo el actual). Mismo mensaje 409.

### 6.3 Eliminación

- El tipo debe existir.
- **No se puede eliminar** si tiene **equipos** asociados (`equipos.tipo_equipo_id`). Mensaje: "No se puede eliminar el tipo porque tiene [N] equipo(s) asociado(s)" (409).

---

## 7. Ciclos

- Se usan en horarios (reservas). Deben existir al crear/actualizar un horario. No se documentan aquí reglas de creación/edición/borrado salvo que existan en controladores específicos.

---

## 8. Roles

- Definidos en el sistema (por ejemplo Administrador, Jefe de Laboratorio). La asignación de **rol_id** a usuarios y la restricción de **laboratorio_ids** para Jefe de Laboratorio siguen las reglas de Usuarios y de permisos en el resto de módulos.

---

## 9. Resumen por Entidad

| Entidad      | Unicidad / Restricciones principales                    | No eliminar si…                          |
|-------------|----------------------------------------------------------|------------------------------------------|
| Laboratorio | Escuela debe existir                                     | Tiene relaciones (equipos, horarios, etc.) |
| Escuela     | Nombre único                                             | Tiene docentes u otras relaciones        |
| Docente     | Correo único                                             | Tiene horarios programados               |
| Usuario     | Usuario (login) único; no cambiar propio estado         | —                                        |
| Unidad      | Símbolo y nombre únicos                                  | Tiene insumos asociados                  |
| Tipo Equipo | Nombre único                                             | Tiene equipos asociados                  |

---

**Referencias en código**: `server/controllers/laboratorioController.js`, `escuelaController.js`, `docenteController.js`, `usuarioController.js`, `unidadController.js`, `tipoEquipoController.js`; modelos y esquemas de validación correspondientes en `server/models/` y `server/validations/schemas/`.
