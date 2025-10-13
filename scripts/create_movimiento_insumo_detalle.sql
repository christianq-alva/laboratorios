-- Script para crear la tabla movimiento_insumo_detalle
-- Esta tabla permite una relación muchos a muchos entre movimientos_insumos e insumos
-- y almacena información específica por lote (cantidad, lote, fecha_vencimiento)

-- Crear la tabla movimiento_insumo_detalle
CREATE TABLE IF NOT EXISTS movimiento_insumo_detalle (
    id INT AUTO_INCREMENT PRIMARY KEY,
    movimiento_id INT NOT NULL,
    insumo_id INT NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    lote VARCHAR(50),
    fecha_vencimiento DATE,
    
    CONSTRAINT fk_movimiento_insumo_detalle_movimiento
        FOREIGN KEY (movimiento_id) 
        REFERENCES movimientos_insumos(id) 
        ON DELETE CASCADE,
        
    CONSTRAINT fk_movimiento_insumo_detalle_insumo
        FOREIGN KEY (insumo_id) 
        REFERENCES insumos(id) 
        ON DELETE CASCADE,
        
    INDEX idx_movimiento_id (movimiento_id),
    INDEX idx_insumo_id (insumo_id),
    INDEX idx_lote (lote)
) ENGINE=InnoDB;

-- Verificar que la tabla fue creada correctamente
DESCRIBE movimiento_insumo_detalle;

-- Mostrar las foreign keys
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'laboratorios_db'
  AND TABLE_NAME = 'movimiento_insumo_detalle'
  AND REFERENCED_TABLE_NAME IS NOT NULL;

