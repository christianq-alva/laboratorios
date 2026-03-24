/**
 * Convierte un valor a número de forma estricta.
 * Si el valor no puede representarse como número válido (NaN), lanza un error
 * con contexto suficiente para depuración.
 *
 * Uso: en la frontera de datos de API — normalizar campos que MySQL puede
 * devolver como string aunque el DTO los declare como number.
 */
export function toStrictNumber(value: unknown, field: string): number {
    const parsed = Number(value)
    if (isNaN(parsed)) {
        throw new Error(
            `Campo numérico inválido en respuesta de API: "${field}" recibió "${value}" (${typeof value})`
        )
    }
    return parsed
}
