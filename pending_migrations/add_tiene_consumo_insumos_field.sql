-- Migración: Agregar campo tiene_consumo_insumos a tabla reservas
-- Fecha: 2025-01-XX
-- Descripción: Agrega un campo indicador para identificar rápidamente si un horario tiene consumo de insumos registrado.
--              Esto mejora el rendimiento de consultas y permite filtrado eficiente.

-- Agregar campo tiene_consumo_insumos
ALTER TABLE reservas 
ADD COLUMN tiene_consumo_insumos TINYINT(1) DEFAULT 0 
COMMENT 'Indica si el horario tiene un movimiento de consumo de insumos asociado (1 = sí, 0 = no)';

-- Migrar datos existentes: marcar horarios cerrados que ya tienen movimientos de salida
UPDATE reservas r
INNER JOIN movimientos_insumos m ON r.id = m.reserva_id 
  AND m.tipo_movimiento = 'salida'
SET r.tiene_consumo_insumos = 1
WHERE r.estado = 'C';

-- Crear índice para mejorar consultas de filtrado
CREATE INDEX idx_reservas_tiene_consumo ON reservas(tiene_consumo_insumos);

