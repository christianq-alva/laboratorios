ALTER TABLE movimiento_insumo_detalle
ADD CONSTRAINT fk_mov_det_ref
FOREIGN KEY (mov_det_ref)
REFERENCES movimiento_insumo_detalle(id)
ON DELETE RESTRICT
ON UPDATE RESTRICT;