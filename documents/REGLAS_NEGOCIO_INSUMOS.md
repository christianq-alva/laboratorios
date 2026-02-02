# Reglas de Negocio: Insumos

## Descripción del Módulo

El módulo de **Insumos** gestiona el catálogo de insumos (reactivos, materiales, material biológico) y sus **unidades de medida**. No incluye el stock por laboratorio ni los movimientos; eso corresponde al módulo **Inventario**.

---

## 1. Catálogo de Insumos

### 1.1 Creación de Insumos

- **nombre**: obligatorio.
- **unidad_id**: obligatorio; la unidad debe existir.
- **categoria**: debe ser una de: `Reactivos`, `Materiales`, `Material_Biologico`.
- **descripcion**, **presentacion**: opcionales.
- El **código** se genera automáticamente con formato `INS-XXXX` (según ID insertado).

### 1.2 Actualización de Insumos

- El insumo debe **existir**.
- Mismas reglas de formato que en creación (nombre, unidad_id, categoria, etc.).

### 1.3 Eliminación de Insumos

- El insumo debe existir.
- **No se puede eliminar** si:
  - Tiene registros en **movimiento_insumo_detalle** (lotes/movimientos), o
  - Está configurado en **inventario_insumos** (asignado a algún laboratorio).

Mensaje: "No se puede eliminar. El insumo \"[nombre]\" está siendo usado en el sistema: [detalle de relaciones]." (409).

---

## 2. Resumen de Códigos (Insumos)

| Código | Situación |
|--------|-----------|
| 400 | Datos incompletos; validación de esquema (Zod) |
| 404 | Insumo no encontrado |
| 409 | Eliminar insumo con relaciones (lotes o laboratorios configurados) |
| 500 | Error interno |

---

**Referencias en código**: `server/controllers/insumoController.js`, `server/models/Insumo.js`, `server/validations/schemas/insumo.js`.
