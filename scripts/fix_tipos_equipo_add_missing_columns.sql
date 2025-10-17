-- Script para agregar columnas faltantes a la tabla tipos_equipo
-- Ejecutar si recibes el error: Unknown column 'estado' in 'field list'

-- Verificar si la columna estado existe, si no existe, agregarla
ALTER TABLE tipos_equipo
ADD COLUMN IF NOT EXISTS estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo' AFTER descripcion;

-- Verificar si la columna updated_at existe, si no existe, agregarla
ALTER TABLE tipos_equipo
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- Agregar índices si no existen
CREATE INDEX IF NOT EXISTS idx_tipos_equipo_estado ON tipos_equipo(estado);
CREATE INDEX IF NOT EXISTS idx_tipos_equipo_nombre ON tipos_equipo(nombre);

-- Verificar la estructura final
DESCRIBE tipos_equipo;

-- Ver los datos
SELECT * FROM tipos_equipo;

