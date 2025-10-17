-- Script para crear la tabla tipos_equipo y agregar relación con equipos
-- Ejecutar en orden: Fase 1 primero, luego Fase 2 (después de asignar tipos a equipos existentes)

-- ============================================
-- FASE 1: Crear tabla y agregar columna nullable
-- ============================================
START TRANSACTION;

-- Crear tabla tipos_equipo
CREATE TABLE tipos_equipo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion VARCHAR(255),
  estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tipos_equipo_estado (estado),
  INDEX idx_tipos_equipo_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Poblar con tipos de equipo comunes
INSERT INTO tipos_equipo (nombre, descripcion) VALUES
('Monitor', 'Monitor de signos vitales'),
('Bomba de Infusión', 'Bombas volumétricas o de jeringa'),
('Desfibrilador', 'Equipo de desfibrilación y cardioversión'),
('Microscopio', 'Microscopios ópticos y electrónicos'),
('Centrífuga', 'Centrífugas de laboratorio'),
('Incubadora', 'Incubadoras de laboratorio'),
('Autoclave', 'Equipo de esterilización por vapor'),
('Balanza', 'Balanza analítica y de precisión'),
('Espectrofotómetro', 'Equipos de análisis espectral'),
('Refrigerador', 'Refrigeradores y congeladores de laboratorio'),
('Agitador', 'Agitadores magnéticos y mecánicos'),
('Baño María', 'Baño maría de laboratorio'),
('Destilador', 'Destiladores de agua'),
('pH-metro', 'Medidores de pH'),
('Termómetro', 'Termómetros de laboratorio'),
('Otro', 'Otro tipo de equipo');

-- Agregar columna tipo_equipo_id a la tabla equipos (nullable durante transición)
ALTER TABLE equipos
  ADD COLUMN tipo_equipo_id INT NULL AFTER nombre,
  ADD INDEX idx_equipos_tipo_equipo_id (tipo_equipo_id),
  ADD CONSTRAINT fk_equipos_tipo_equipo
    FOREIGN KEY (tipo_equipo_id) REFERENCES tipos_equipo(id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

COMMIT;

-- ============================================
-- FASE 2: Hacer obligatoria la columna (ejecutar después del backfill)
-- ============================================
-- Descomentar y ejecutar cuando todos los equipos tengan asignado un tipo:
-- ALTER TABLE equipos MODIFY COLUMN tipo_equipo_id INT NOT NULL;

-- ============================================
-- SCRIPT DE BACKFILL (OPCIONAL)
-- ============================================
-- Asignar tipos automáticamente basado en nombres comunes:

-- Monitores
-- UPDATE equipos e
-- JOIN tipos_equipo t ON t.nombre = 'Monitor'
-- SET e.tipo_equipo_id = t.id
-- WHERE e.tipo_equipo_id IS NULL 
--   AND (e.nombre LIKE '%monitor%' OR e.nombre LIKE '%Monitor%');

-- Microscopios
-- UPDATE equipos e
-- JOIN tipos_equipo t ON t.nombre = 'Microscopio'
-- SET e.tipo_equipo_id = t.id
-- WHERE e.tipo_equipo_id IS NULL 
--   AND (e.nombre LIKE '%microscopio%' OR e.nombre LIKE '%Microscopio%');

-- Centrífugas
-- UPDATE equipos e
-- JOIN tipos_equipo t ON t.nombre = 'Centrífuga'
-- SET e.tipo_equipo_id = t.id
-- WHERE e.tipo_equipo_id IS NULL 
--   AND (e.nombre LIKE '%centrífuga%' OR e.nombre LIKE '%Centrífuga%' OR e.nombre LIKE '%centrifuga%');

-- Autoclave
-- UPDATE equipos e
-- JOIN tipos_equipo t ON t.nombre = 'Autoclave'
-- SET e.tipo_equipo_id = t.id
-- WHERE e.tipo_equipo_id IS NULL 
--   AND (e.nombre LIKE '%autoclave%' OR e.nombre LIKE '%Autoclave%');

-- Balanzas
-- UPDATE equipos e
-- JOIN tipos_equipo t ON t.nombre = 'Balanza'
-- SET e.tipo_equipo_id = t.id
-- WHERE e.tipo_equipo_id IS NULL 
--   AND (e.nombre LIKE '%balanza%' OR e.nombre LIKE '%Balanza%');

-- Asignar "Otro" a los que no tienen tipo
-- UPDATE equipos e
-- JOIN tipos_equipo t ON t.nombre = 'Otro'
-- SET e.tipo_equipo_id = t.id
-- WHERE e.tipo_equipo_id IS NULL;

