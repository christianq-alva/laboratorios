# Reglas de Negocio: Equipos

## Descripción del Módulo

El módulo de **Equipos** gestiona los equipos de laboratorio: creación, actualización, eliminación, asignación a laboratorio y a tipo de equipo, estados operativos y fechas de mantenimiento. También permite importación masiva desde Excel.

---

## 1. Creación de Equipos

### 1.1 Campos Obligatorios

- **codigo**: único en el sistema, entre 1 y 50 caracteres.
- **nombre**: entre 1 y 255 caracteres.
- **tipo_equipo_id**: debe existir en `tipos_equipo`.
- **laboratorio_id**: debe existir (implícito en creación).
- **fecha_adquisicion**: formato YYYY-MM-DD (requerido en esquema de validación/importación).

### 1.2 Campos Opcionales

- descripcion, marca, modelo, numero_serie, comentarios (longitudes máximas según esquema).
- **estado**: uno de `Operativo`, `En Mantenimiento`, `Fuera de Servicio`. Por defecto: `Operativo`.
- **condicion**: uno de `Excelente`, `Bueno`, `Regular`, `Malo`. Por defecto: `Bueno`.
- **fecha_ultimo_mantenimiento**, **fecha_proximo_mantenimiento**: formato YYYY-MM-DD.

### 1.3 Reglas de Fechas de Mantenimiento

- Si se informan ambas, **fecha_proximo_mantenimiento** no puede ser **anterior** a **fecha_ultimo_mantenimiento**.  
  Mensaje: "La fecha del próximo mantenimiento no puede ser anterior a la fecha del último mantenimiento" (400).

### 1.4 Unicidad

- **codigo**: no puede repetirse. Si ya existe: "Ya existe otro equipo con ese código" (400).

---

## 2. Actualización de Equipos

- El equipo debe **existir**.
- **nombre** y **tipo_equipo_id** son requeridos en el cuerpo de la petición (según validación).
- **codigo** debe ser único excluyendo el equipo actual; mismo mensaje que en creación si hay duplicado.
- Misma regla de fechas de mantenimiento (próximo ≥ último).
- **No se puede cambiar el laboratorio** del equipo si tiene **reservas activas** en el laboratorio actual.  
  Mensaje: "No se puede actualizar. El equipo tiene reservas programadas en el laboratorio actual." (400).

---

## 3. Eliminación de Equipos

- El equipo debe existir.
- **No se puede eliminar** si tiene **reservas activas** (registros en `detalle_reserva_equipos`).  
  Mensaje: "No se puede eliminar. El equipo está siendo usado en el sistema." (400).
- Tras eliminar se registra la actividad en `actividad_equipos`.

---

## 4. Importación Masiva (Excel)

- **Laboratorio**: el usuario selecciona el laboratorio de destino en la UI antes de subir el archivo. El **laboratorio_id** se envía en el cuerpo de la petición (FormData); el Excel **no** incluye la columna LABORATORIO_CODIGO. Todos los equipos del archivo se importan en el laboratorio seleccionado.
- Columnas obligatorias en el Excel: **CODIGO**, **NOMBRE**, **TIPO_EQUIPO_ID**, **FECHA_ADQUISICION**.
- **TIPO_EQUIPO_ID** debe existir en `tipos_equipo`.
- **ESTADO**: uno de Operativo, En Mantenimiento, Fuera de Servicio.
- **CONDICION**: uno de Excelente, Bueno, Regular, Malo.
- Fechas en formato YYYY-MM-DD.
- El **laboratorio_id** enviado en la petición debe existir; si no existe se responde 404.
- Si hay errores en todas las filas y ningún registro se procesa, se responde 400 con lista de errores; si al menos uno se procesa, se hace commit parcial y se devuelve resultado con detalle de procesados y errores.

---

## 5. Consultas y Filtros

- Listado de equipos filtrado por **rol** y **laboratorio_ids** (Jefe de Laboratorio solo ve equipos de sus laboratorios).
- Filtros opcionales: tipo_equipo_id, estado, laboratorio_id.

---

## 6. Resumen de Códigos y Mensajes

| Código | Situación |
|--------|-----------|
| 400 | Código duplicado; fechas de mantenimiento inválidas; equipo con reservas (no cambiar lab / no eliminar); ID inválido |
| 404 | Equipo o tipo de equipo no encontrado; laboratorio no encontrado (importación masiva) |
| 500 | Error interno |

---

**Referencias en código**: `server/controllers/equipoController.js`, `server/models/Equipo.js`, `server/validations/schemas/equipo.js`.
