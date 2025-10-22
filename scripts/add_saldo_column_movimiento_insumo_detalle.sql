-- Script para agregar columna 'saldo' a movimiento_insumo_detalle
-- Esta columna almacena el saldo disponible de cada lote de entrada
-- Fecha: 2025-10-22

-- Agregar columna saldo (solo para movimientos de entrada)
ALTER TABLE movimiento_insumo_detalle
ADD COLUMN saldo INT DEFAULT NULL AFTER cantidad,
ADD INDEX idx_saldo (saldo);

-- Inicializar saldo para movimientos de tipo 'entrada' existentes
-- El saldo inicial es igual a la cantidad ingresada
UPDATE movimiento_insumo_detalle mid
INNER JOIN movimientos_insumos mi ON mid.movimiento_id = mi.id
SET mid.saldo = mid.cantidad
WHERE mi.tipo_movimiento = 'entrada';

-- Para salidas, el saldo debe ser NULL (no aplica)
UPDATE movimiento_insumo_detalle mid
INNER JOIN movimientos_insumos mi ON mid.movimiento_id = mi.id
SET mid.saldo = NULL
WHERE mi.tipo_movimiento = 'salida';

-- Verificar resultado
SELECT 
  mi.tipo_movimiento,
  COUNT(*) as total_registros,
  SUM(CASE WHEN mid.saldo IS NOT NULL THEN 1 ELSE 0 END) as con_saldo
FROM movimiento_insumo_detalle mid
INNER JOIN movimientos_insumos mi ON mid.movimiento_id = mi.id
GROUP BY mi.tipo_movimiento;

-- Comentarios:
-- - saldo solo se usa en movimientos de tipo 'entrada'
-- - saldo se reduce cuando se registra una salida manual
-- - saldo NULL indica que es un movimiento de salida o que el lote está agotado

