-- Script para agregar columnas de mantenimiento a la tabla equipos
-- Ejecutar este script en la base de datos

USE laboratorios;

-- Agregar columnas de fechas de mantenimiento
ALTER TABLE equipos 
ADD COLUMN fecha_ultimo_mantenimiento DATE NULL COMMENT 'Fecha del último mantenimiento realizado',
ADD COLUMN fecha_proximo_mantenimiento DATE NULL COMMENT 'Fecha programada para el próximo mantenimiento';

-- Agregar índices para mejorar el rendimiento de consultas por fechas
CREATE INDEX idx_equipos_ultimo_mantenimiento ON equipos(fecha_ultimo_mantenimiento);
CREATE INDEX idx_equipos_proximo_mantenimiento ON equipos(fecha_proximo_mantenimiento);

-- Verificar que las columnas se agregaron correctamente
DESCRIBE equipos;
