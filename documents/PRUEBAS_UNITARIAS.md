# Guía de Pruebas Unitarias

## Objetivo de las pruebas unitarias

Las pruebas unitarias en esta aplicación tienen como fin **proteger la lógica de negocio y las reglas críticas** antes de la venta y el mantenimiento del producto. No buscan cubrir infraestructura ni frameworks, sino **funciones puras, validaciones y decisiones de negocio** que, si fallan, afectan directamente la integridad de los datos y el comportamiento esperado por el cliente.

---

## Principios que deben cumplir las pruebas unitarias

- **Rápidas**: Ejecución en milisegundos por test. Sin I/O de red ni base de datos.
- **Determinísticas**: Mismo resultado siempre con los mismos datos. Sin fechas/hora del sistema ni aleatoriedad no controlada.
- **Sin infraestructura**: No conectan a BD real, no llaman APIs externas, no dependen del framework HTTP. Se mockean dependencias cuando sea necesario.
- **Aisladas**: Cada test es independiente; no comparten estado ni orden de ejecución.
- **Enfocadas**: Una idea por test (una regla, un caso límite o un mensaje de error concreto).

---

## Módulos del sistema y pruebas sugeridas

A continuación se listan los módulos identificados, sus reglas de negocio relevantes y los casos de prueba unitarios sugeridos en formato checklist. **Qué NO probar** se indica al final de cada módulo.

---

## 1. Autenticación

**Responsabilidad**: Validar credenciales, estado del usuario y construcción del token/payload (sin firmar ni verificar JWT real).

**Reglas de negocio relevantes**:
- Usuario inactivo no puede iniciar sesión (mensaje específico).
- Credenciales incorrectas devuelven mensaje genérico.
- El payload del token incluye `userId`, `usuario`, `rol`, `laboratorio_ids`.

**Casos de prueba unitarios sugeridos**:
- [ ] Dado usuario válido y activo, la lógica de “puede iniciar sesión” devuelve verdadero.
- [ ] Dado usuario válido con estado inactivo, la lógica considera que no puede iniciar sesión y el mensaje es el definido (“Usuario inactivo…”).
- [ ] Dado usuario/contraseña inexistente o incorrecta, la lógica de credenciales devuelve falso (o equivalente) sin revelar si falló usuario o contraseña.
- [ ] Dado usuario con rol Jefe de Laboratorio, el objeto de sesión incluye `laboratorio_ids` (array, vacío o con IDs).
- [ ] Dado usuario con rol Administrador, el objeto de sesión no restringe por laboratorio (o `laboratorio_ids` según diseño).

**Casos límite y errores comunes**:
- [ ] Usuario vacío o nulo.
- [ ] Contraseña vacía o nula.
- [ ] Estado de usuario con valor no esperado (p. ej. distinto de activo/inactivo).

**Qué NO probar con pruebas unitarias**:
- Conexión a la base de datos para buscar el usuario.
- Firma y verificación real del JWT (es infraestructura).
- Middleware de autenticación que lee el token del header (integrar en tests de integración o E2E).

---

## 2. Configuración (Laboratorios, Escuelas, Docentes, Usuarios, Unidades, Tipos de equipo, Ciclos, Roles)

**Responsabilidad**: Validación de datos (esquemas), unicidad de campos, reglas de “no eliminar si tiene relaciones” y mensajes de error. La lógica que **solo** delega a la BD (crear/actualizar/eliminar) no se prueba de forma unitaria; sí las funciones puras de validación y las reglas que se pueden evaluar con mocks.

**Reglas de negocio relevantes** (resumen por entidad):
- **Laboratorio**: `escuela_id` debe existir; no eliminar si tiene equipos, insumos, horarios, incidencias u otras relaciones.
- **Escuela**: nombre único; no eliminar si tiene docentes u otras relaciones.
- **Docente**: correo único; no eliminar si tiene horarios programados.
- **Usuario**: usuario (login) único; no puede cambiar su propio estado; contraseña se hashea (si la función de hash es invocada desde una función pura o utilidad, se puede probar con mock).
- **Unidad**: símbolo y nombre únicos; no eliminar si tiene insumos asociados.
- **Tipo de equipo**: nombre único; no eliminar si tiene equipos asociados.
- **Ciclos / Roles**: existencia y uso en horarios/usuarios; sin reglas complejas adicionales documentadas.

**Casos de prueba unitarios sugeridos**:

### Laboratorio
- [ ] Validación: todos los campos obligatorios presentes y con formato correcto.
- [ ] Validación: `estado` solo acepta valores permitidos (Activo, En Mantenimiento, Inhabilitado, Baja).
- [ ] Validación: `escuela_id` numérico/entero cuando aplica (la existencia en BD se mockea o se prueba en integración).
- [ ] Regla “no eliminar”: dada una función que recibe “tiene relaciones” verdadero, devuelve error o mensaje esperado.

### Escuela
- [ ] Validación: nombre obligatorio.
- [ ] Unicidad: mismo nombre que otra escuela (excluyendo la actual en edición) debe detectarse cuando se pasa el resultado del “existe otro” (mock) y la lógica de negocio devuelve el mensaje 409 definido.

### Docente
- [ ] Validación: nombre obligatorio; correo con formato válido si aplica.
- [ ] Unicidad: correo ya usado por otro docente (mock) → mensaje 400 definido.
- [ ] Regla “no eliminar si tiene horarios”: cuando “tiene horarios” es verdadero, la lógica de negocio impide eliminación con mensaje esperado.

### Usuario
- [ ] Validación: campos obligatorios (nombre_completo, usuario, contrasena, rol_id).
- [ ] Unicidad: usuario (login) ya existe (mock) → mensaje 409.
- [ ] Regla “no cambiar propio estado”: cuando `usuarioId === req.user.userId` (o equivalente), la lógica devuelve 403 con mensaje “No puedes cambiar tu propio estado”.
- [ ] Si existe una función pura que normaliza `laboratorio_ids` para Jefe de Laboratorio (p. ej. array de IDs), probar con vacío, con IDs válidos y con valores no numéricos si aplica.

### Unidad
- [ ] Validación: símbolo y nombre obligatorios.
- [ ] Unicidad: símbolo y nombre no pueden repetirse (excluyendo la actual en edición); mensajes 409 definidos.
- [ ] Regla “no eliminar si tiene insumos”: cuando “tiene insumos” es verdadero, devuelve error con mensaje esperado.

### Tipo de equipo
- [ ] Validación: nombre obligatorio.
- [ ] Unicidad: nombre ya existe en otro tipo (mock) → mensaje 409.
- [ ] Regla “no eliminar si tiene equipos”: cuando “tiene equipos asociados” es verdadero, mensaje con cantidad de equipos si aplica.

**Casos límite y errores comunes**:
- [ ] Strings vacíos o solo espacios en campos obligatorios.
- [ ] Longitudes máximas (nombre, código, etc.) según esquema.
- [ ] Valores de enumeración (estado, condición) fuera del conjunto permitido.
- [ ] IDs numéricos negativos o cero cuando no estén permitidos.

**Qué NO probar con pruebas unitarias**:
- Inserciones/actualizaciones/eliminaciones reales en la base de datos.
- Existencia real de `escuela_id`, `rol_id`, etc. en BD (sí se puede probar la reacción ante “no existe” con mocks).

---

## 3. Horarios (Reservas)

**Responsabilidad**: Validación de fechas, cálculo de solapamiento entre rangos, reglas de cierre y eliminación (estado cerrado), y mensajes de conflicto.

**Reglas de negocio relevantes**:
- Escuela, ciclo, docente y laboratorio deben existir (la verificación se mockea en unitarias).
- No puede haber solapamiento en el mismo laboratorio ni para el mismo docente en el mismo rango de fechas. Fórmula: `(fecha_inicio_nueva < fecha_fin_existente) Y (fecha_fin_nueva > fecha_inicio_existente)`.
- Al editar, se excluye el horario actual al buscar cruces.
- `fecha_fin` debe ser posterior a `fecha_inicio`.
- Rango de consulta máximo 60 días; si se excede, mensaje 400.
- No se puede eliminar ni “cerrar de nuevo” un horario ya cerrado (estado `'C'`); mensaje 409.
- `cantidad_alumnos` entero mayor a 0; `color` hexadecimal válido (#RRGGBB).
- Insumos y equipos: insumo_id/equipo_id > 0, cantidad > 0 para insumos; validación de “pertenecen al laboratorio” se mockea o se deja para integración.

**Casos de prueba unitarios sugeridos**:
- [ ] **Solapamiento laboratorio**: dos rangos [A1, A2] y [B1, B2] que se solapan → la función de “hay conflicto” devuelve verdadero.
- [ ] **Sin solapamiento**: rangos contiguos o separados → “hay conflicto” devuelve falso.
- [ ] **Límites**: mismo instante de fin e inicio (ej. 10:00–11:00 y 11:00–12:00) → sin conflicto.
- [ ] **Exclusión al editar**: al verificar cruces excluyendo `horario_id` X, si el único cruce es el propio X, no hay conflicto.
- [ ] Validación: `fecha_fin` ≤ `fecha_inicio` → error con mensaje definido.
- [ ] Validación: rango de fechas de listado > 60 días → error 400 con mensaje “El rango máximo permitido es de 60 días”.
- [ ] Regla “no eliminar si cerrado”: estado `'C'` → intento de eliminar devuelve 409 “Horario cerrado, no se puede eliminar”.
- [ ] Regla “no cerrar si ya cerrado”: estado `'C'` → intento de cerrar devuelve 409 “El Horario ya se encuentra cerrado”.
- [ ] Validación: `cantidad_alumnos` ≤ 0 o no entero → error.
- [ ] Validación: `color` no hexadecimal o formato incorrecto → error o valor por defecto según diseño.
- [ ] Formato de fechas: función que convierte fecha de entrada a formato MySQL (p. ej. `convertirFechaParaMySQL`) con ISO, datetime-local y fallback → salida esperada sin depender de hora del sistema.

**Casos límite y errores comunes**:
- [ ] Fechas en distintos formatos (ISO con Z, sin Z, solo fecha).
- [ ] Zona horaria: que la lógica use de forma consistente America/Lima (o la definida) en mensajes o comparaciones que se prueben sin BD.
- [ ] Arrays de insumos/equipos vacíos vs. con elementos inválidos (cantidad 0, insumo_id 0).

**Qué NO probar con pruebas unitarias**:
- Consultas SQL reales (`getCruceLab`, `getCruceDocente` contra BD).
- Transacciones de creación/edición/eliminación en BD.
- Registro en `actividad_horarios` (auditoría) contra BD.

---

## 4. Insumos e Inventario

**Responsabilidad**: Validación de catálogo (categoría, unidad_id), reglas de salida (saldo suficiente por lote, obligatoriedad de `entrada_detalle_id`), y regla de no eliminar insumo si tiene movimientos o está configurado en laboratorios.

**Reglas de negocio relevantes**:
- Categoría una de: Reactivos, Materiales, Material_Biologico.
- Código de insumo generado automáticamente (INS-XXXX); no se prueba generación contra BD, sí que el formato sea el esperado si hay función pura.
- No eliminar insumo si tiene registros en movimiento_insumo_detalle o en inventario_insumos (configuración por laboratorio).
- Salida: cada detalle debe tener `entrada_detalle_id`; el saldo del lote referenciado debe ser ≥ cantidad solicitada; al registrar salida se descuenta saldo (lógica que actualiza saldo se puede probar con mocks).
- Insumos en movimientos deben estar configurados para el laboratorio (validación con mock de “insumos permitidos”).
- Reabastecimiento masivo: validación de filas (código, cantidad, lote, fecha vencimiento); insumos deben estar configurados para el laboratorio.
- Eliminación de movimiento: reversión de saldos en salida (lógica pura de “cuánto devolver” a qué lote).

**Casos de prueba unitarios sugeridos**:
- [ ] Validación: categoría solo acepta Reactivos, Materiales, Material_Biologico.
- [ ] Validación: unidad_id obligatorio y numérico.
- [ ] Regla “no eliminar insumo”: cuando “tiene movimientos o está en inventario_insumos” es verdadero → error 409 con mensaje que incluya nombre y detalle.
- [ ] Salida: detalle sin `entrada_detalle_id` → error.
- [ ] Salida: cantidad solicitada > saldo del lote (mock de saldo) → error “Saldo insuficiente en el lote…” con valores correctos.
- [ ] Salida: cantidad ≤ saldo → lógica de “nuevo saldo” o “cantidad a descontar” correcta (con mocks).
- [ ] Entrada: detalles con lote y fecha_vencimiento opcionales; formato de fecha YYYY-MM-DD.
- [ ] Reabastecimiento masivo: fila con código de insumo no permitido para el laboratorio → incluida en lista de errores, no se inserta.
- [ ] Reabastecimiento masivo: fila con cantidad no numérica o ≤ 0 → error de validación.
- [ ] Eliminación de movimiento (reversión): dado un movimiento de salida con detalle (entrada_detalle_id, cantidad), la función que calcula “devolución al lote” devuelve los valores esperados.

**Casos límite y errores comunes**:
- [ ] Cantidad cero o negativa en entrada/salida.
- [ ] Múltiples detalles de salida sobre el mismo lote (saldo suficiente solo para parte).
- [ ] Fecha de vencimiento en el pasado (si la regla de negocio la rechaza o solo advierte).

**Qué NO probar con pruebas unitarias**:
- Conexión a BD para obtener lotes o saldos reales.
- Transacciones de movimiento (INSERT/UPDATE) reales.
- Descarga de plantilla Excel ni subida de archivo.

---

## 5. Equipos

**Responsabilidad**: Validación de campos (código, nombre, estado, condición, fechas), unicidad de código, reglas de fechas de mantenimiento (próximo ≥ último), y restricciones de actualización/eliminación (reservas activas).

**Reglas de negocio relevantes**:
- Código único en el sistema; nombre y tipo_equipo_id obligatorios; laboratorio_id implícito en creación.
- Estado: Operativo, En Mantenimiento, Fuera de Servicio. Condición: Excelente, Bueno, Regular, Malo.
- `fecha_proximo_mantenimiento` no puede ser anterior a `fecha_ultimo_mantenimiento`.
- No cambiar laboratorio del equipo si tiene reservas activas en el laboratorio actual.
- No eliminar equipo si tiene reservas activas (detalle_reserva_equipos).
- Importación masiva: columnas obligatorias; LABORATORIO_CODIGO y TIPO_EQUIPO_ID deben existir (mock); si todas las filas fallan → 400; si al menos una es válida → commit parcial y respuesta con procesados y errores.

**Casos de prueba unitarios sugeridos**:
- [ ] Validación: código único (cuando mock indica “ya existe”) → 400 “Ya existe otro equipo con ese código”.
- [ ] Validación: `fecha_proximo_mantenimiento` < `fecha_ultimo_mantenimiento` → 400 “La fecha del próximo mantenimiento no puede ser anterior…”.
- [ ] Validación: `fecha_proximo_mantenimiento` = `fecha_ultimo_mantenimiento` o mayor → aceptado.
- [ ] Validación: estado y condición solo aceptan valores permitidos.
- [ ] Regla “no cambiar laboratorio”: cuando “tiene reservas en laboratorio actual” es verdadero → 400 “No se puede actualizar. El equipo tiene reservas programadas en el laboratorio actual.”
- [ ] Regla “no eliminar”: cuando “tiene reservas activas” es verdadero → 400 “No se puede eliminar. El equipo está siendo usado en el sistema.”
- [ ] Importación masiva (lógica de filas): fila con LABORATORIO_CODIGO inexistente → error en esa fila.
- [ ] Importación masiva: fila con TIPO_EQUIPO_ID inexistente → error en esa fila.
- [ ] Importación masiva: todas las filas con error → resultado “ninguno procesado” y lista de errores (400).
- [ ] Importación masiva: algunas filas válidas y otras inválidas → resultado con “procesados” y “errores” (commit parcial).

**Casos límite y errores comunes**:
- [ ] Código vacío o longitud > 50.
- [ ] Fechas en formato incorrecto (YYYY-MM-DD).
- [ ] Estado o condición con valor no permitido en Excel.

**Qué NO probar con pruebas unitarias**:
- CRUD real contra BD.
- Consultas de “tiene reservas” contra BD (sí el resultado de esa consulta mockeado y la reacción de negocio).
- Lectura/escritura real del archivo Excel.

---

## 6. Incidencias

**Responsabilidad**: Reglas de permiso por rol (crear para reserva, ver, eliminar) según laboratorio del usuario. La lógica “¿puede este usuario crear/ver/eliminar esta incidencia?” debe ser probable con mocks (reserva, laboratorio_ids del usuario, rol).

**Reglas de negocio relevantes**:
- Crear: Administrador puede para cualquier reserva; Jefe de Laboratorio solo si laboratorio_id de la reserva está en su laboratorio_ids; otro rol → 403.
- Ver (listado/detalle): Administrador ve todas; Jefe de Laboratorio solo las de sus laboratorios; sin laboratorios asignados → ninguna.
- Eliminar: mismo criterio que ver (una lectura con getById); 404 “Incidencia no encontrada o no tienes permisos para eliminarla” cuando no aplica.
- reserva_id, titulo, descripcion requeridos; reportado_por = usuario autenticado.

**Casos de prueba unitarios sugeridos**:
- [ ] `canCreateForReserva(reserva_id, user)`: Administrador → verdadero para cualquier reserva (mock de reserva).
- [ ] `canCreateForReserva`: Jefe de Laboratorio con laboratorio_ids [1,2] y reserva.laboratorio_id = 1 → verdadero.
- [ ] `canCreateForReserva`: Jefe de Laboratorio con laboratorio_ids [1,2] y reserva.laboratorio_id = 3 → falso (403).
- [ ] `canCreateForReserva`: Jefe de Laboratorio con laboratorio_ids vacío → falso.
- [ ] `eliminarIncidencia`: si `getById(incidenciaId, user)` devuelve null (no existe o sin permiso) → 404; si devuelve incidencia → se llama a `delete` (mock de getById/delete; mismo criterio que ver).
- [ ] Visibilidad listado: usuario con rol Jefe y laboratorio_ids [1] recibe solo incidencias de reservas de laboratorio 1 (lógica de filtrado con mocks).
- [ ] Validación: reserva_id, titulo, descripcion obligatorios.

**Casos límite y errores comunes**:
- [ ] reserva_id inexistente (mock) → 404 antes de evaluar permiso.
- [ ] Usuario sin rol o rol desconocido → sin permiso.

**Qué NO probar con pruebas unitarias**:
- Consultas a BD para obtener incidencia o reserva.
- Middleware de autorización que usa el framework (mejor en integración).

---

## 7. Enlaces compartidos (ShareLink)

**Responsabilidad**: Validación de `expires_in_days` (1 semana, 1 mes, 3 meses, 1 año según documentación), generación de token/URL (si es función pura o con mock de generación), y verificación de token (activo, no expirado, laboratorio_id coincidente) como lógica pura cuando no se toque BD.

**Reglas de negocio relevantes**:
- laboratorio_id debe existir (mock en unitarias).
- createOrUpdate: si ya existe enlace para laboratorio y usuario, actualizar; si no, crear. Expiración según `expires_in_days`.
- verifyToken(token, laboratorio_id): válido solo si token activo, no expirado y laboratorio_id coincide; si no, razón (expirado, inválido, laboratorio no coincide).

**Casos de prueba unitarios sugeridos**:
- [ ] Validación: `expires_in_days` solo acepta valores permitidos (ej. 7, 30, 90, 365); otro valor → error o valor por defecto según diseño.
- [ ] Cálculo de fecha de expiración: dada una “fecha actual” fija y expires_in_days = 30, la fecha de expiración es la esperada (función pura).
- [ ] verifyToken (lógica): token expirado (fecha_expiracion < hoy) → valid: false, reason indicando expiración.
- [ ] verifyToken: laboratorio_id no coincide con el del enlace → valid: false.
- [ ] verifyToken: token activo, no expirado, laboratorio_id coincide → valid: true.

**Casos límite y errores comunes**:
- [ ] Token vacío o nulo.
- [ ] laboratorio_id no numérico o negativo.

**Qué NO probar con pruebas unitarias**:
- Persistencia real de ShareLink en BD.
- Generación criptográfica real del token (sí la decisión de “válido/inválido” con datos ya obtenidos).

---

## 8. Reportes

**Responsabilidad**: Cálculos puros que se puedan extraer (por ejemplo: comparación requerido vs. consumido, proyección de disponibilidad). Filtros por laboratorio, escuela, ciclo, rango de fechas suelen delegar a SQL; si hay funciones que agregan o transforman datos en memoria, probar esas.

**Reglas de negocio relevantes**:
- Reporte consumo: comparar lo planeado (requerido) con lo usado (consumido) por laboratorio, escuela, ciclo, fechas.
- Reporte disponibilidad: capacidad de cubrir necesidades según stock disponible; mismos filtros.
- Permisos: Jefe de Laboratorio solo ve datos de sus laboratorios (lógica de filtrado de parámetros con mock de usuario).

**Casos de prueba unitarios sugeridos**:
- [ ] Si existe una función que calcula “diferencia requerido - consumido” por insumo o por agrupación → probar con listas mock (valores numéricos, ceros, negativos).
- [ ] Si existe una función que determina “puede cubrir” según stock y requerimiento → probar con pares (stock, requerido) límite (igual, menor, mayor).
- [ ] Filtros: usuario Jefe con laboratorio_ids [1,2] solo puede pasar laboratorio_id 1 o 2 (o ambos); si se pasa 3, la lógica rechaza o ignora (según diseño).

**Qué NO probar con pruebas unitarias**:
- Consultas SQL de reportes contra BD.
- Generación de archivos Excel/PDF.
- Permisos a nivel de middleware HTTP.

---

## 9. Dashboard

**Responsabilidad**: Si el dashboard solo arma parámetros de consulta (laboratorio, rango de fechas) según usuario y query, se pueden probar funciones puras que construyan esos parámetros. Si es solo una vista que llama a horarios/actividad, no suele haber lógica de negocio adicional; en ese caso, no es prioritario para unitarias.

**Casos de prueba unitarios sugeridos** (solo si hay lógica extraída):
- [ ] Construcción de rango por defecto (ej. mes actual) con zona horaria fija → fechas de inicio y fin esperadas.
- [ ] Usuario Jefe: laboratorio_ids aplicados al filtro de eventos/horarios.

**Qué NO probar con pruebas unitarias**:
- Renderizado de calendario ni llamadas HTTP al backend.

---

## 10. Permisos (Abilities / CASL)

**Responsabilidad**: Dado un usuario (rol, laboratorio_ids), la función que construye las habilidades debe devolver el conjunto correcto de permisos (create/read/update/delete por recurso).

**Reglas de negocio relevantes**:
- Administrador: manage all.
- Jefe de Laboratorio: create/read/update/delete en Horario, Inventario, Equipo; create/read/update en ShareLink; create/read/delete en Incidencia; solo read en Laboratorio, Insumo, TipoEquipo, Unidad, Docente, Ciclo, Escuela.
- Otro rol: sin permisos (build vacío).

**Casos de prueba unitarios sugeridos**:
- [ ] Usuario con rol Administrador → can('manage', 'all') o equivalente.
- [ ] Usuario con rol Jefe de Laboratorio → puede create/read/update/delete en Horario, Inventario, Equipo; create/read/update ShareLink; create/read/delete Incidencia; solo read en Laboratorio, Insumo, Horario, TipoEquipo, Unidad, Docente, Ciclo, Escuela.
- [ ] Usuario con rol null o distinto de los dos anteriores → no puede ninguna acción sobre los recursos definidos (o solo las que se documenten).
- [ ] Jefe de Laboratorio: no puede delete en ShareLink (solo create, read, update según documentación).

**Casos límite**:
- [ ] Usuario sin laboratorio_ids (array vacío o undefined): permisos siguen siendo los del rol; el filtro por laboratorio se aplica en capa de datos/middleware.

**Qué NO probar con pruebas unitarias**:
- Middleware que usa la librería de permisos contra `req.user` y responde 403 (integrar en tests de integración).

---

## Qué NO probar con pruebas unitarias (global)

- Conexión a base de datos, pools, reintentos.
- Rutas HTTP, middlewares de autenticación/autorización que lean headers y respondan status codes (salvo la lógica de decisión extraída y probada con mocks).
- Llamadas a APIs externas.
- Envío de correos o notificaciones reales.
- Generación de JWT con librería criptográfica (sí la decisión “usuario puede iniciar sesión” con datos ya cargados).
- Subida/descarga real de archivos (Excel, PDF).
- Framework (Express, etc.) y su comportamiento por defecto.

---

## Convención sugerida para nombrar pruebas

- **Formato**: `[Módulo/Entidad] – [Regla o escenario]: [condición] → [resultado esperado]`.
- **Ejemplos**:
  - `Horarios – Solapamiento: dos reservas en mismo laboratorio en mismo rango → conflicto laboratorio`
  - `Equipos – Fechas mantenimiento: próximo < último → error 400`
  - `Insumos – Salida: cantidad mayor que saldo del lote → error saldo insuficiente`
  - `Incidencias – Permiso: Jefe de Laboratorio y reserva de otro laboratorio → no puede crear`
  - `Autenticación – Estado: usuario inactivo → no puede iniciar sesión`

Alternativa corta por tecnología:
- `describe`: módulo o entidad.
- `it` / `test`: “debería [resultado] cuando [condición]” (ej. “debería devolver conflicto cuando los rangos se solapan”).

---

## Recomendaciones finales

1. **Prioridad**: Implementar primero pruebas para Horarios (solapamiento y cierre), Insumos (salidas y saldo), Equipos (fechas y reservas), Configuración (unicidades y “no eliminar”) y Permisos (defineAbilities). Son los que más impacto tienen en la integridad y en la venta del producto.
2. **Extraer lógica**: Donde la regla esté mezclada con SQL o HTTP, extraer a funciones puras (por ejemplo “haySolapamiento(a1, a2, b1, b2)”, “puedeEliminarInsumo(insumo, relaciones)”) y testearlas sin mocks de BD cuando sea posible.
3. **Un mensaje, un test**: Cada mensaje de error documentado en las reglas de negocio debería tener al menos un test que verifique que ese mensaje (o clave) se devuelve en la condición indicada.
4. **Mantenimiento**: Revisar este documento cuando se añadan nuevas reglas en los documentos de `documents/REGLAS_NEGOCIO_*.md` y añadir los nuevos ítems al checklist del módulo correspondiente.
5. **Cobertura**: No buscar un porcentaje alto de líneas; priorizar ramas de negocio (if/else por regla de negocio) y casos límite documentados aquí.
6. **Estabilidad**: Evitar tests que dependan de orden de ejecución, de hora del sistema o de datos globales; usar inyección de dependencias o mocks para fechas y para acceso a datos.
7. **Documentación**: Mantener este archivo como contrato de “qué debe cumplir el sistema”; al vender la aplicación, sirve como guía de qué comportamientos están garantizados por pruebas automatizadas.

---

*Referencia: reglas de negocio en `documents/REGLAS_NEGOCIO_*.md` y `documents/REGLAS_NEGOCIO_CONFIGURACIONES.md`; descripción del sistema en `DESCRIPCION_SISTEMA.md`.*
