PLATAFORMA DE GESTIÓN DE LABORATORIOS ACADEMICOS
COTIZACIÓN DE ALQUILER DE SOFTWARE
Cliente: Universidad Peruana Unión – Escuela de Medicina

INTRODUCCIÓN:
En este documento, presentamos una descripción detallada del software de gestión de laboratorios académicos y la cotización del alquiler.

SOFTWARE DE GESTIÓN DE LABORATORIOS ACADEMICOS:
El sistema integra la reserva y programación de horarios, control de inventario de insumos con sistema de lotes y vencimientos, gestión de equipos, registro de incidencias, reportes de gestión, y un sistema robusto de roles y permisos. El sistema está basado en el manejo de dos roles (Administrador y Jefe de laboratorio) y proporciona una solución integral para la gestión eficiente de recursos de laboratorio. Está compuesto por los siguientes módulos:

1. Configuración
Este módulo permite configurar la información necesaria para el funcionamiento del sistema y la gestión de usuarios:
-	El sistema permite crear, editar y eliminar tipos de equipo, unidades, docentes y escuelas con información básica.
-	Gestión de insumos: 
o	El sistema permite crear insumos con nombre, categoría (“Reactivos”, “Materiales”, “Material Biológico”), unidad de medida, presentación y descripción. 
o	El sistema permite editar la información completa del insumo.
o	El sistema permite eliminar un insumo siempre que no tenga registros asociados.
-	Gestión de laboratorios:
o	El sistema permite crear laboratorios con código, nombre, ubicación, piso, escuela y estado (“Activo”, “En Mantenimiento”, “Inhabilitado”, “De Baja”).
o	El sistema permite editar la información completa del laboratorio.
o	El sistema permite eliminar un laboratorio, siempre que no tengan registros asociados.
o	El sistema permite configurar insumos por cada laboratorio.
-	Gestión de usuarios:
o	El sistema permite crear usuarios con roles definidos de “Administrador” y “Jefe de Laboratorio”. En caso el rol sea “Jefe de laboratorio” el sistema pedirá la elección de laboratorios permitidos para el laboratorio seleccionado.
o	El sistema permite editar la información completa del usuario.
o	El sistema permite eliminar un usuario, siempre que no tengan registros asociados.
2.  Dashboard 
Vista de calendario mensual de reservas registradas, con información de hora de inicio y laboratorio.
3. Horarios
Gestión completa del ciclo de vida de reservas y programación de laboratorios con calendario semanal de reservas (programadas y cerradas) como vista principal. El módulo incluye:
-	Vista principal: Calendario semanal con separación por bloques de tiempo (horas académicas) con filtro por laboratorio.
-	Creación de reservas: El sistema permite crear reservas con información de laboratorio, docente, escuela, ciclo descripción del curso, cantidad de alumnos, fecha, hora de inicio y de fin (según bloques de tiempo) y color (paleta de colores definida), con validación automática de cruces de laboratorio y docente. La creación puede hacer de dos modos:
o	Unitaria: De manera adicional, el usuario puede incluir información de insumos (con cantidades por insumo) y equipos requeridos.
o	Recurrente: El usuario puede crear reservas para diversas fechas con la misma hora de inicio y de fin.
-	Edición de reservas: El sistema permite editar de manera unitaria la información completa de las reservas siempre que no se encuentren cerradas.
-	Eliminar reservas: El sistema permite eliminar reservas siempre que no se encuentren cerradas.
-	Finalización de reservas: El sistema permite cerrar una reserva con registro de consumo real de insumos (por lotes), permitiendo añadir más insumos de los requeridos en su creación.
-	Gestión de enlaces compartidos: El sistema permite crear y eliminar enlaces compartibles para visualización de horarios, de un laboratorio específico, sin necesidad de iniciar sesión. Estos enlaces pueden ser creados con expiraciones de 1 semana, 1 mes, 3 meses o un año.
-	Gestión de auditoría: El sistema permite visualizar los cambios realizados a reservas con la siguiente información: fecha de cambio, acción (“crear”, “editar”, “eliminar”), descripción, horario, laboratorio, docente y usuario. La vista cuenta con filtros por laboratorio, fecha de inicio y de fin, acción y usuario.
o	La vista permite el filtro por usuario solo para usuarios con rol “Administrador”
4. Insumos (Inventario de Insumos)
Gestión integral de inventario de insumos con manejo avanzado de lotes. El módulo incluye:
-	Vista principal: Tabla de insumos con código, nombre, categoría, unidad, presentación, total de lotes con stock disponible, stock actual y filtros por laboratorio. Por cada insumo, el sistema permite ver detalle de movimientos y detalle de lotes.
o	Detalle de movimientos: Vista de historial de movimientos de stock de insumo seleccionado, con información de fecha, tipo, cantidad, lote, laboratorio y descripción.
o	Detalle de lotes: Listado de lotes con stock disponible con información de lote, cantidad original, stock disponible, fecha de ingreso, fecha de vencimiento y estado.
-	Registro de movimiento: El sistema permite registrar movimientos de entrada y salida de stock de inventarios con selección de laboratorio y fecha de movimiento, y con descripción de movimiento.
o	Entradas: Para el ingreso de stock, el sistema permite crear lotes con cantidad y código de lote y fecha de vencimiento para insumos configurados para el laboratorio seleccionado.
o	Salidas: El sistema solo permite seleccionar lotes de insumos que cuenten con stock disponible para el laboratorio seleccionado.
-	Reabastecimiento masivo: El sistema permite reabastecer insumos de manera masiva con selección de laboratorio, fecha de movimiento y con descripción del reabastecimiento. Para el reabastecimiento el sistema cuenta con el siguiente flujo: 
o	Descarga de una plantilla: El sistema permite la descarga de una plantilla con instrucciones en formato Excel.
o	Previsualización de datos: Al subirse el archivo, el sistema provee una validación de la información consignada en el archivo.
o	 Confirmación de reabastecimiento: El sistema procesa el reabastecimiento masivo con la información validada del archivo.
-	Gestión de movimientos: El sistema permite visualizar los movimientos generados con la siguiente información: fecha de movimiento, tipo de movimiento (“entrada”, “salida”), descripción, fecha de registro y usuario. La vista cuenta con filtros por laboratorio, fecha de inicio y de fin, y tipo de movimientos.
o	La vista permite la eliminación movimientos solo para usuarios con rol “Administrador”.
5. Equipos (Inventario de Equipos)
Gestión completa de equipos de laboratorio con control de mantenimiento, estados y condiciones. El módulo incluye:
-	Vista principal: Tabla de equipos con código, nombre, categoría, unidad, presentación, total de lotes con stock disponible, stock actual. 
o	La vista cuenta con filtros laboratorio, tipo de equipo y estado de equipo.
o	Por cada equipo listado, el sistema permite las acciones editar y eliminar.
-	Creación de equipo: El sistema permite crear equipos con código, nombre, descripción, marca, modelo, número de serie, tipo de equipo (configurados previamente), laboratorio, estado (“Operativo”, “En mantenimiento”, “De baja”), fecha de adquisición, condición (“Excelente”, “Bueno”, ”Regular”, “Malo), fecha de último mantenimiento, fecha de próximo mantenimiento y observación.
-	Edición de equipo: El sistema permite editar la información completa del equipo. El laboratorio podrá ser modificado siempre y cuando el equipo no tenga reservas programadas en el laboratorio actual.
-	Eliminar reservas: El sistema permite eliminar reservas, siempre que el equipo no esté relacionado con registros de reservas de horario.
-	Importación masiva: El sistema permite crear equipos de manera masiva con selección de laboratorio. Para la importación el sistema cuenta con el siguiente flujo: 
o	Descarga de una plantilla: El sistema permite la descarga de una plantilla con instrucciones en formato Excel.
o	Previsualización de datos: Al subirse el archivo, el sistema provee una validación de la información consignada en el archivo.
o	 Confirmación de importación: El sistema procesa la importación masiva con la información validada del archivo.
-	Gestión de auditoría: El sistema permite visualizar los cambios realizados a reservas con la siguiente información: fecha de cambio, acción (“crear”, “editar”, “eliminar”), descripción, Equipo, laboratorio y usuario. La vista cuenta con filtros por laboratorio, fecha de inicio y de fin, acción y usuario.
o	La vista permite el filtro por usuario solo para usuarios con rol “Administrador”
6. Incidencias
Gestión básica de incidencias asociadas a las reservas de horarios. El módulo incluye:
-	Vista principal: Tabla de incidencias con título, laboratorio, docente, fecha de clase, fecha de reporte, usuario de reporte. 
o	La vista cuenta con filtros, por coincidencia de texto, para título, descripción, laboratorio y docente.
o	Por cada equipo listado, el sistema permite las acciones editar y eliminar.
-	Creación de incidencia: El sistema permite registrar incidencias con título, descripción y selección de reserva de horario. Para la selección de la reserva, se puede filtrar las reservas por fecha, laboratorio y docente. 
-	Eliminar incidencia: El sistema permite eliminar incidencias registradas sin restricción.
-	Ver incidencia: Por cada incidencia, el sistema permite visualizar la incidencia con información detallada de la reserva de horario asociada.
El módulo no permite la edición de incidencias.
7. Reportes
Reportes de gestión para evaluación de eficiencia en el consumo de insumos y proyección de requerimiento de insumos. El módulo incluye:
-	Reporte de consumo de insumos: El reporte compara lo planeado (requerido) con lo realmente usado (consumido). El sistema permite filtrar la información por laboratorio, escuela, ciclo, fecha de inicio y de fin.
-	Reporte de disponibilidad de insumos: El reporte muestra la capacidad de cubrir necesidades futuras según el stock disponible. El sistema permite filtrar la información por laboratorio, escuela, ciclo, fecha de inicio y de fin.
