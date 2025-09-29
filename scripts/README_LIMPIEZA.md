# Scripts de Limpieza de Datos

Este directorio contiene scripts para limpiar datos de equipos e insumos de forma segura, respetando las restricciones de claves foráneas.

## ⚠️ ADVERTENCIA IMPORTANTE

**ESTOS SCRIPTS ELIMINAN DATOS PERMANENTEMENTE**

- Los datos eliminados NO se pueden recuperar
- Asegúrate de hacer un respaldo antes de ejecutar
- Úsalos solo en entornos de desarrollo o cuando estés seguro

## 📋 Tablas que se ven afectadas

### Equipos y datos relacionados:
- `equipos` - Catálogo de equipos
- `inventario_equipos` - Stock de equipos por laboratorio
- `movimientos_equipos` - Historial de movimientos
- `detalle_reserva_equipos` - Equipos usados en reservas
- `actividad_equipos` - Log de actividad

### Insumos y datos relacionados:
- `insumos` - Catálogo de insumos
- `inventario_insumos` - Stock de insumos por laboratorio
- `movimientos_insumos` - Historial de movimientos
- `detalle_reserva_insumos` - Insumos usados en reservas
- `actividad_insumos` - Log de actividad

### Reservas/Horarios:
- `reservas` - Horarios programados
- `actividad_horarios` - Log de actividad de horarios

## 🚀 Cómo usar los scripts

### 1. Verificar datos actuales

```bash
node scripts/ejecutar_limpieza.js verificar
```

Esto te mostrará cuántos registros hay en cada tabla sin eliminar nada.

### 2. Limpiar solo equipos

```bash
node scripts/ejecutar_limpieza.js equipos
```

Elimina todos los equipos y sus datos relacionados (inventario, movimientos, etc.)

### 3. Limpiar solo insumos

```bash
node scripts/ejecutar_limpieza.js insumos
```

Elimina todos los insumos y sus datos relacionados (inventario, movimientos, etc.)

### 4. Limpiar solo reservas/horarios

```bash
node scripts/ejecutar_limpieza.js reservas
```

Elimina todas las reservas/horarios y sus detalles

### 5. Limpiar todo

```bash
node scripts/ejecutar_limpieza.js todo
```

Elimina equipos, insumos y reservas (limpieza completa)

## 📁 Archivos incluidos

- `limpiar_datos_equipos_insumos.js` - Script completo de limpieza
- `limpiar_datos_selectivo.js` - Script con opciones selectivas
- `ejecutar_limpieza.js` - Script simple para ejecutar desde línea de comandos
- `README_LIMPIEZA.md` - Este archivo de instrucciones

## 🔧 Orden de eliminación

Los scripts eliminan los datos en el orden correcto para respetar las claves foráneas:

1. **Actividades** (no tienen restricciones)
2. **Movimientos** (referencian equipos/insumos)
3. **Detalles de reservas** (referencian equipos/insumos y reservas)
4. **Inventarios** (referencian equipos/insumos)
5. **Reservas** (referencian laboratorios, docentes, grupos)
6. **Equipos e Insumos** (tablas principales)

## 🔄 Reset de contadores

Después de limpiar, los scripts resetean los contadores `AUTO_INCREMENT` para que los nuevos registros empiecen desde 1.

## 🛡️ Seguridad

- Todos los scripts usan transacciones de base de datos
- Si hay un error, se hace rollback automáticamente
- Los scripts verifican las dependencias antes de eliminar

## 📝 Ejemplo de uso

```bash
# 1. Primero verificar qué datos hay
node scripts/ejecutar_limpieza.js verificar

# 2. Limpiar solo equipos si es necesario
node scripts/ejecutar_limpieza.js equipos

# 3. Verificar que se limpió correctamente
node scripts/ejecutar_limpieza.js verificar

# 4. Si quieres limpiar todo
node scripts/ejecutar_limpieza.js todo
```

## 🆘 En caso de problemas

Si algo sale mal:

1. Los scripts usan transacciones, así que los datos no se corromperán
2. Revisa los logs de error en la consola
3. Verifica que la conexión a la base de datos esté funcionando
4. Asegúrate de tener permisos para eliminar datos

## 📞 Soporte

Si tienes problemas con los scripts, revisa:

1. Que la base de datos esté funcionando
2. Que tengas permisos de escritura
3. Que no haya otros procesos usando las tablas
4. Los logs de error en la consola
