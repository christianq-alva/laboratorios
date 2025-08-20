-- Crear tabla para enlaces compartidos
CREATE TABLE IF NOT EXISTS enlaces_compartidos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  laboratorio_id INT NOT NULL COMMENT 'ID del laboratorio compartido',
  token VARCHAR(512) NOT NULL UNIQUE COMMENT 'Token JWT para acceso público',
  creado_por INT NOT NULL COMMENT 'ID del usuario que creó el enlace',
  fecha_expiracion DATETIME NOT NULL COMMENT 'Fecha de expiración del enlace',
  activo BOOLEAN DEFAULT TRUE COMMENT 'Estado del enlace (activo/inactivo)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (laboratorio_id) REFERENCES laboratorios(id) ON DELETE CASCADE,
  FOREIGN KEY (creado_por) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_laboratorio_id (laboratorio_id),
  INDEX idx_creado_por (creado_por),
  INDEX idx_token (token),
  INDEX idx_activo (activo),
  INDEX idx_fecha_expiracion (fecha_expiracion)
) COMMENT = 'Tabla para almacenar enlaces compartibles de horarios de laboratorios';
