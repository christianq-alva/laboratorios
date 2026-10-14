/**
 * Costo de depreciación de una línea de horario (equipo o material reutilizable).
 *
 * Fórmula acordada en la estructura de costos por práctica 2026-1:
 *   valor_unitario × (porcentaje / 100) × cantidad × num_grupos
 *
 * Devuelve `null` cuando el bien no está configurado para depreciar (sin valor
 * o sin categoría): se guarda NULL y los reportes lo leen como S/ 0.00, igual
 * que hacen hoy con los insumos sin precio.
 *
 * El resultado se redondea a 4 decimales para calzar con DECIMAL(12,4). El
 * redondeo a céntimos se aplica solo en los totales, nunca por línea.
 */
export const calcularCostoDepreciacion = (valor_unitario, porcentaje, cantidad, num_grupos) => {
  const valor = Number(valor_unitario ?? 0)
  const pct = Number(porcentaje ?? 0)
  const cant = Number(cantidad ?? 0)
  const grupos = Number(num_grupos ?? 1)

  if (![valor, pct, cant, grupos].every(Number.isFinite)) return null
  if (valor <= 0 || pct <= 0 || cant <= 0 || grupos <= 0) return null

  return Number((valor * (pct / 100) * cant * grupos).toFixed(4))
}
