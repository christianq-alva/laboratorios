// Función para convertir fecha a formato MySQL
export const convertirFechaParaMySQL = (fechaInput) => {
  if (!fechaInput) return null

  // Si la fecha ya viene en formato YYYY-MM-DD HH:MM:SS, la usamos directamente
  if (fechaInput.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
    return fechaInput
  }

  // Si viene en formato YYYY-MM-DDTHH:MM:SS (datetime-local con segundos)
  if (fechaInput.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)) {
    const resultado = fechaInput.replace('T', ' ')
    return resultado
  }

  // Si es una fecha ISO con zona horaria, mantenemos solo la parte local
  if (fechaInput.includes('T')) {
    // Tomamos solo los primeros 19 caracteres (YYYY-MM-DDTHH:MM:SS)
    const resultado = fechaInput.slice(0, 19).replace('T', ' ')
    return resultado
  }

  // Fallback: intentar parsear como fecha
  const fecha = new Date(fechaInput)
  if (!isNaN(fecha.getTime())) {
    // Usar la fecha local, no UTC
    const year = fecha.getFullYear()
    const month = String(fecha.getMonth() + 1).padStart(2, '0')
    const day = String(fecha.getDate()).padStart(2, '0')
    const hours = String(fecha.getHours()).padStart(2, '0')
    const minutes = String(fecha.getMinutes()).padStart(2, '0')
    const seconds = String(fecha.getSeconds()).padStart(2, '0')
    const resultado = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    return resultado
  }

  return null
}