import { AppError } from './errors.js'

/**
 * Traduce errores técnicos de MySQL a AppError con mensaje y código HTTP adecuados.
 * @param {Error} error - Error capturado de pool.execute/query
 * @param {string} [entityName='Registro'] - Nombre de la entidad para mensajes (ej: "Usuario", "Laboratorio")
 * @throws {AppError}
 */
export function handleDBError(error, entityName = 'Registro') {
  // Error de duplicado (clave única violada)
  if (error.code === 'ER_DUP_ENTRY') {
    throw new AppError(`${entityName} duplicado`, 409)
  }

  // Error de clave foránea (referencia no existe)
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    throw new AppError(`${entityName} relacionado no existe`, 400)
  }

  // Error de fila referenciada (no se puede eliminar porque otros registros lo referencian)
  if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_FOREIGN_KEY_CONSTRAINT') {
    throw new AppError(`No se puede eliminar. ${entityName} está siendo usado en el sistema.`, 409)
  }

  // Error de campo NULL (campo obligatorio faltante)
  if (error.code === 'ER_BAD_NULL_ERROR') {
    throw new AppError('Faltan campos obligatorios', 400)
  }

  // Errores de conexión a la base de datos
  if (error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST') {
    throw new AppError('Error de conexión a base de datos', 500)
  }

  // Error desconocido de base de datos
  console.log(error)
  throw new AppError('Error de base de datos', 500)
}
