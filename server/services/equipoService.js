import { pool } from '../config/database.js'
import { Equipo } from '../models/Equipo.js'
import { Laboratorio } from '../models/Laboratorio.js'
import { TipoEquipo } from '../models/TipoEquipo.js'
import { AppError } from '../utils/errors.js'

const estadosValidos = ['Operativo', 'En Mantenimiento', 'Fuera de Servicio']
const condicionesValidas = ['Excelente', 'Bueno', 'Regular', 'Malo']

export const equipoService = {

  async getEquipos(user_rol, user_laboratorio_ids, filters) {
    return await Equipo.getAll(user_rol, user_laboratorio_ids, filters)
  },

  async getEquipoByLaboratorio(laboratorio_id, filters) {
    return await Equipo.getByLaboratorio(laboratorio_id, filters)
  },

  async getActividadEquipos(user_rol, user_laboratorio_ids, laboratorio_id, fecha_inicio, fecha_fin, tipo_actividad, usuario_id) {
    return await Equipo.getActividadEquipos(user_rol, user_laboratorio_ids, laboratorio_id, fecha_inicio, fecha_fin, tipo_actividad, usuario_id)
  },

  async crearEquipo(datos, usuario_id, ip_address) {
    const existingCodigo = await Equipo.existsByCodigo(datos.codigo)
    if (existingCodigo) throw new AppError('Ya existe otro equipo con ese código', 400)

    const lab = await Laboratorio.getLaboratorioById(datos.laboratorio_id)
    if (!lab) throw new AppError('Laboratorio no encontrado', 404)

    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const equipo_id = await Equipo.create({
        codigo: datos.codigo,
        nombre: datos.nombre,
        descripcion: datos.descripcion ?? '',
        marca: datos.marca ?? '',
        modelo: datos.modelo ?? '',
        numero_serie: datos.numero_serie ?? '',
        estado: datos.estado ?? 'Operativo',
        fecha_ultimo_mantenimiento: datos.fecha_ultimo_mantenimiento || null,
        fecha_proximo_mantenimiento: datos.fecha_proximo_mantenimiento || null,
        comentarios: datos.comentarios || null,
        condicion: datos.condicion ?? 'Bueno',
        fecha_adquisicion: datos.fecha_adquisicion,
        tipo_equipo_id: datos.tipo_equipo_id,
        laboratorio_id: datos.laboratorio_id
      }, connection)
      await Equipo.registrarActividadEquipo({
        accion: 'crear',
        equipo_id,
        descripcion: `Equipo creado: ${datos.nombre} (${datos.codigo}) - Marca: ${datos.marca || 'N/A'}, Modelo: ${datos.modelo || 'N/A'}, Estado: ${datos.estado || 'Operativo'}, Condición: ${datos.condicion || 'Bueno'}. Laboratorio: ${lab.codigo}.`,
        usuario_id,
        ip_address
      }, connection)
      await connection.commit()
      return equipo_id
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  },

  async actualizarEquipo(equipoId, datos, usuario_id, ip_address) {
    const existingEquipo = await Equipo.existsById(equipoId)
    if (!existingEquipo) throw new AppError('Equipo no encontrado', 404)
    const existingCodigo = await Equipo.existsByCodigo(datos.codigo, equipoId)
    if (existingCodigo) throw new AppError('Ya existe otro equipo con ese código', 400)

    const equipoInfo = await Equipo.getById(equipoId)
    const tieneReservas = await Equipo.reservasActivasByLaboratorioId(equipoInfo.id, equipoInfo.laboratorio_id)
    if (tieneReservas && datos.laboratorio_id !== equipoInfo.laboratorio_id) {
      throw new AppError('No se puede actualizar. El equipo tiene reservas programadas en el laboratorio actual.', 400)
    }

    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const affectedRows = await Equipo.update(equipoId, {
        codigo: datos.codigo?.trim() ?? '',
        nombre: datos.nombre?.trim() ?? '',
        descripcion: datos.descripcion?.trim() ?? '',
        marca: datos.marca?.trim() ?? '',
        modelo: datos.modelo?.trim() ?? '',
        numero_serie: datos.numero_serie?.trim() ?? '',
        estado: datos.estado || 'Operativo',
        fecha_ultimo_mantenimiento: datos.fecha_ultimo_mantenimiento || null,
        fecha_proximo_mantenimiento: datos.fecha_proximo_mantenimiento || null,
        comentarios: datos.comentarios?.trim() ?? '',
        condicion: datos.condicion || 'Bueno',
        fecha_adquisicion: datos.fecha_adquisicion,
        tipo_equipo_id: datos.tipo_equipo_id,
        laboratorio_id: datos.laboratorio_id
      }, connection)
      if (affectedRows === 0) {
        await connection.rollback()
        throw new AppError('Equipo no encontrado', 404)
      }
      await Equipo.registrarActividadEquipo({
        accion: 'actualizar',
        equipo_id: equipoId,
        descripcion: `Equipo actualizado: ${datos.nombre?.trim()} - Marca: ${datos.marca?.trim() || 'N/A'}, Modelo: ${datos.modelo?.trim() || 'N/A'}, Estado: ${datos.estado || 'Operativo'}, Condición: ${datos.condicion || 'Bueno'}. Último mant.: ${datos.fecha_ultimo_mantenimiento || 'N/A'}, Próximo mant.: ${datos.fecha_proximo_mantenimiento || 'N/A'}.`,
        usuario_id,
        ip_address
      }, connection)
      await connection.commit()
      return { id: equipoId, nombre: datos.nombre?.trim(), descripcion: datos.descripcion, marca: datos.marca, modelo: datos.modelo, numero_serie: datos.numero_serie, estado: datos.estado }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  },

  async eliminarEquipo(equipoId, usuario_id, ip_address) {
    const existingEquipo = await Equipo.existsById(equipoId)
    if (!existingEquipo) throw new AppError('Equipo no encontrado', 404)
    const reservasActivas = await Equipo.reservasActivas(equipoId)
    if (reservasActivas) throw new AppError('No se puede eliminar. El equipo está siendo usado en el sistema.', 400)

    const equipoInfo = await Equipo.getById(equipoId)
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      await Equipo.delete(equipoId, connection)
      await Equipo.registrarActividadEquipo({
        accion: 'eliminar',
        equipo_id: equipoInfo.id,
        descripcion: `Equipo eliminado: ${equipoInfo.nombre} (${equipoInfo.codigo || 'N/A'}) - Marca: ${equipoInfo.marca || 'N/A'}, Modelo: ${equipoInfo.modelo || 'N/A'}, Estado: ${equipoInfo.estado || 'N/A'}, Condición: ${equipoInfo.condicion || 'N/A'}.`,
        usuario_id,
        ip_address
      }, connection)
      await connection.commit()
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  },

  async importarMasiva(rows, usuario_id, ip_address, laboratorio_id) {
    const existsLab = await Laboratorio.exists(laboratorio_id)
    if (!existsLab) {
      throw new AppError('Laboratorio no encontrado', 404)
    }
    const lab = await Laboratorio.getLaboratorioById(laboratorio_id)
    const tipos_equipo = await TipoEquipo.getAll()
    const connection = await pool.getConnection()
    let procesados = 0
    const errores = []
    const resultados = []
    try {
      await connection.beginTransaction()
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const rowNum = i + 2
        try {
          if (!row.NOMBRE) {
            errores.push(`Fila ${rowNum}: NOMBRE es obligatorio`)
            continue
          }
          const codigo = row.CODIGO ? row.CODIGO.toString().trim() : null
          const nombre = row.NOMBRE.toString().trim()
          const descripcion = row.DESCRIPCION ? row.DESCRIPCION.toString().trim() : ''
          const marca = row.MARCA ? row.MARCA.toString().trim() : ''
          const modelo = row.MODELO ? row.MODELO.toString().trim() : ''
          const numero_serie = row.NUMERO_SERIE ? row.NUMERO_SERIE.toString().trim() : ''
          const estado = row.ESTADO ? row.ESTADO.toString().trim() : 'Operativo'
          const comentarios = row.COMENTARIOS ? row.COMENTARIOS.toString().trim() : ''
          const condicion = row.CONDICION ? row.CONDICION.toString().trim() : 'Bueno'
          const tipo_equipo_id = row.TIPO_EQUIPO_ID ? parseInt(row.TIPO_EQUIPO_ID) : null

          if (!codigo) {
            errores.push(`Fila ${rowNum}: CODIGO es obligatorio`)
            continue
          }
          if (!nombre) {
            errores.push(`Fila ${rowNum}: NOMBRE es obligatorio`)
            continue
          }
          let fecha_ultimo_mantenimiento = null
          let fecha_proximo_mantenimiento = null
          if (row.FECHA_ULTIMO_MANTENIMIENTO) {
            const fechaStr = row.FECHA_ULTIMO_MANTENIMIENTO.toString().trim()
            if (fechaStr) {
              const fecha = new Date(fechaStr)
              if (!isNaN(fecha.getTime())) fecha_ultimo_mantenimiento = fecha.toISOString().split('T')[0]
              else {
                errores.push(`Fila ${rowNum}: Fecha de último mantenimiento inválida (use formato YYYY-MM-DD)`)
                continue
              }
            }
          }
          if (row.FECHA_PROXIMO_MANTENIMIENTO) {
            const fechaStr = row.FECHA_PROXIMO_MANTENIMIENTO.toString().trim()
            if (fechaStr) {
              const fecha = new Date(fechaStr)
              if (!isNaN(fecha.getTime())) fecha_proximo_mantenimiento = fecha.toISOString().split('T')[0]
              else {
                errores.push(`Fila ${rowNum}: Fecha de próximo mantenimiento inválida (use formato YYYY-MM-DD)`)
                continue
              }
            }
          }
          let fecha_adquisicion = null
          if (row.FECHA_ADQUISICION) {
            const fechaStr = row.FECHA_ADQUISICION.toString().trim()
            if (fechaStr) {
              const fecha = new Date(fechaStr)
              if (!isNaN(fecha.getTime())) fecha_adquisicion = fecha.toISOString().split('T')[0]
              else {
                errores.push(`Fila ${rowNum}: Fecha de adquisición inválida (use formato YYYY-MM-DD)`)
                continue
              }
            }
          }
          if (!tipo_equipo_id || !tipos_equipo.some(te => te.id === tipo_equipo_id)) {
            errores.push(`Fila ${rowNum}: TIPO_EQUIPO_ID es obligatorio y debe ser válido`)
            continue
          }
          if (!estadosValidos.includes(estado)) {
            errores.push(`Fila ${rowNum}: Estado inválido. Debe ser: ${estadosValidos.join(', ')}`)
            continue
          }
          if (!condicionesValidas.includes(condicion)) {
            errores.push(`Fila ${rowNum}: Condición inválida. Debe ser: ${condicionesValidas.join(', ')}`)
            continue
          }
          const equipoData = {
            codigo,
            nombre,
            descripcion,
            marca,
            modelo,
            numero_serie,
            estado,
            fecha_ultimo_mantenimiento,
            fecha_proximo_mantenimiento,
            comentarios,
            condicion,
            fecha_adquisicion,
            tipo_equipo_id,
            laboratorio_id
          }
          const equipo_id = await Equipo.create(equipoData, connection)
          await Equipo.registrarActividadEquipo({
            accion: 'crear',
            equipo_id,
            descripcion: `Equipo creado por importación masiva: ${nombre} (${codigo}) - Marca: ${marca || 'N/A'}, Modelo: ${modelo || 'N/A'}, Estado: ${estado}, Condición: ${condicion}. Laboratorio: ${lab?.codigo}.`,
            usuario_id,
            ip_address
          }, connection)
          resultados.push({ fila: rowNum, codigo, nombre, marca: marca || 'N/A', modelo: modelo || 'N/A', estado, laboratorio_id, tipo_equipo_id })
          procesados++
        } catch (error) {
          errores.push(`Fila ${rowNum}: ${error.message}`)
        }
      }
      if (errores.length > 0 && procesados === 0) {
        await connection.rollback()
        const err = new AppError('No se pudo procesar ningún registro', 400)
        err.errores = errores
        throw err
      }
      await connection.commit()
      return { procesados, errores, resultados }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  },

  async getDatosPlantillaEquipos() {
    const laboratorios = await Laboratorio.getAll()
    const tipos_equipo = await TipoEquipo.getAll()
    return { laboratorios, tipos_equipo }
  },

  async previsualizarImportacion(data, laboratorio_id) {
    const existsLab = await Laboratorio.exists(laboratorio_id)
    if (!existsLab) {
      throw new AppError('Laboratorio no encontrado', 404)
    }
    const { tipos_equipo } = await this.getDatosPlantillaEquipos()
    const previewData = []
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 2
      const erroresFila = []
      const codigo = row.CODIGO ? row.CODIGO.toString().trim() : null
      const nombre = row.NOMBRE ? row.NOMBRE.toString().trim() : ''
      const descripcion = row.DESCRIPCION ? row.DESCRIPCION.toString().trim() : ''
      const marca = row.MARCA ? row.MARCA.toString().trim() : ''
      const modelo = row.MODELO ? row.MODELO.toString().trim() : ''
      const numero_serie = row.NUMERO_SERIE ? row.NUMERO_SERIE.toString().trim() : ''
      const estado = row.ESTADO ? row.ESTADO.toString().trim() : 'Operativo'
      const comentarios = row.COMENTARIOS ? row.COMENTARIOS.toString().trim() : ''
      const condicion = row.CONDICION ? row.CONDICION.toString().trim() : 'Bueno'
      const tipo_equipo_id = row.TIPO_EQUIPO_ID ? parseInt(row.TIPO_EQUIPO_ID) : null
      if (!codigo) erroresFila.push('CODIGO es obligatorio')
      if (!nombre) erroresFila.push('NOMBRE es obligatorio')
      if (row.FECHA_ULTIMO_MANTENIMIENTO) {
        const fechaStr = row.FECHA_ULTIMO_MANTENIMIENTO.toString().trim()
        if (fechaStr && isNaN(new Date(fechaStr).getTime())) erroresFila.push('Fecha de último mantenimiento inválida (use formato YYYY-MM-DD)')
      }
      if (row.FECHA_PROXIMO_MANTENIMIENTO) {
        const fechaStr = row.FECHA_PROXIMO_MANTENIMIENTO.toString().trim()
        if (fechaStr && isNaN(new Date(fechaStr).getTime())) erroresFila.push('Fecha de próximo mantenimiento inválida (use formato YYYY-MM-DD)')
      }
      if (row.FECHA_ADQUISICION) {
        const fechaStr = row.FECHA_ADQUISICION.toString().trim()
        if (fechaStr && isNaN(new Date(fechaStr).getTime())) erroresFila.push('Fecha de adquisición inválida (use formato YYYY-MM-DD)')
      }
      if (!estadosValidos.includes(estado)) erroresFila.push(`Estado inválido. Debe ser: ${estadosValidos.join(', ')}`)
      if (!condicionesValidas.includes(condicion)) erroresFila.push(`Condición inválida. Debe ser: ${condicionesValidas.join(', ')}`)
      if (!tipo_equipo_id) erroresFila.push('TIPO_EQUIPO_ID es obligatorio')
      else if (!tipos_equipo.some(te => te.id === tipo_equipo_id)) erroresFila.push(`Tipo de equipo inválido: ${tipo_equipo_id}`)
      previewData.push({
        fila: rowNum,
        codigo,
        nombre,
        descripcion,
        marca,
        modelo,
        numero_serie,
        estado,
        comentarios,
        condicion,
        laboratorio_id,
        tipo_equipo_id,
        errores: erroresFila
      })
    }
    return previewData
  }
}
