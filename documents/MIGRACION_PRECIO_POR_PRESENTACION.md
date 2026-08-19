# Migración: Precio por presentación (cantidad_por_presentacion)

**Fecha:** 2026-07-02

## Problema

El precio registrado en `insumos_precios` corresponde a la **presentación completa** del insumo
(botella, frasco, caja, etc.), pero el sistema lo trataba como precio por unidad de medida.
Ejemplo: Alcohol en frasco de 1000 ml a S/ 10.00 — al requerir 20 ml el sistema cobraba
20 × S/ 10.00 en lugar de 20 × (S/ 10.00 / 1000).

## Solución

Nueva columna `insumos.cantidad_por_presentacion`: contenido de la presentación **expresado en
la unidad de medida del insumo** (ej. unidad `ml`, presentación "Frasco 1000 ml" → `1000`).

El precio unitario real se deriva en las consultas:

```
precio_unitario_real = precio_presentacion / cantidad_por_presentacion
costo = precio_unitario_real * cantidad_usada * num_grupos
```

El valor por defecto `1` mantiene el comportamiento anterior para insumos aún no configurados
(el precio se sigue tratando como precio por unidad hasta que se cargue el contenido real).

## SQL

```sql
ALTER TABLE insumos
  ADD COLUMN cantidad_por_presentacion DECIMAL(12,4) NOT NULL DEFAULT 1
    COMMENT 'Contenido de la presentación en la unidad del insumo (ej. 1000 si es Frasco 1000 ml y la unidad es ml)'
    AFTER presentacion;

ALTER TABLE insumos
  ADD CONSTRAINT chk_insumos_cantidad_por_presentacion
    CHECK (cantidad_por_presentacion > 0);
```

## Reglas de negocio

- `cantidad_por_presentacion` es obligatorio, numérico y **mayor que 0** (default `1`).
- Debe expresarse en la **misma unidad de medida del insumo** (`unidad_id`). No hay conversión
  de unidades: si la presentación es "Frasco 1 L" y se consume en ml, la unidad del insumo debe
  ser `ml` y la cantidad por presentación `1000`.
- El precio configurado (`insumos_precios.precio`) sigue siendo el precio de la **presentación
  completa**; el redondeo a 2 decimales se aplica solo en los totales, nunca en el precio
  unitario derivado.

## Backfill pendiente

Los insumos existentes quedan con `cantidad_por_presentacion = 1`. Deben actualizarse con el
contenido real de cada presentación (editando el insumo o vía el Excel de actualización masiva
de precios con la columna `CANTIDAD_POR_PRESENTACION`).

## ⚠️ Advertencia al cambiar la unidad de un insumo

El stock, los movimientos de inventario y las cantidades requeridas de horarios se registran
como números sin unidad; la unidad del insumo (`unidad_id`) es solo la etiqueta con la que se
interpretan. Si durante el backfill se cambia la unidad de un insumo (ej. Alcohol de `L` a `ml`),
**todos sus registros históricos pasan a leerse en la unidad nueva sin re-escalarse**: un stock
de 20 que significaba "20 L" pasará a mostrarse como "20 ml".

Procedimiento recomendado al cambiar la unidad de un insumo con datos:
1. Anotar el stock disponible actual por laboratorio y lote.
2. Cambiar la unidad y la `cantidad_por_presentacion` del insumo.
3. Registrar un movimiento de ajuste (entrada) por la diferencia de escala
   (ej. stock 20 L → registrar entrada de 19 980 para que el stock lea 20 000 ml).
4. Revisar las cantidades requeridas de horarios futuros de ese insumo.

Los horarios pasados quedarán con cantidades en la escala antigua; sus costos históricos deben
interpretarse con cautela.
