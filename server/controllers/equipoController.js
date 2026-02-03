import { equipoService } from '../services/equipoService.js'
import XLSX from 'xlsx'

export const getEquipos = async (req, res, next) => {
  try {
    const { tipo_equipo_id, estado, laboratorio_id } = req.query
    const filters = {}
    if (tipo_equipo_id) filters.tipo_equipo_id = tipo_equipo_id
    if (estado) filters.estado = estado
    if (laboratorio_id) filters.laboratorio_id = laboratorio_id
    const equipos = await equipoService.getEquipos(req.user.rol, req.user.laboratorio_ids, filters)
    res.status(200).json({
      success: true,
      data: equipos,
      total_equipos: equipos.length
    })
  } catch (error) {
    next(error)
  }
}

export const getEquipoByLaboratorio = async (req, res, next) => {
  try {
    const { laboratorio_id } = req.params
    const { tipo_equipo_id, estado } = req.query
    const filters = {}
    if (tipo_equipo_id) filters.tipo_equipo_id = tipo_equipo_id
    if (estado) filters.estado = estado
    const equipos = await equipoService.getEquipoByLaboratorio(laboratorio_id, filters)
    res.status(200).json({
      success: true,
      data: equipos
    })
  } catch (error) {
    next(error)
  }
}

export const createEquipo = async (req, res, next) => {
  try {
    const {
      codigo,
      nombre,
      descripcion,
      marca,
      modelo,
      numero_serie,
      estado = 'Operativo',
      fecha_ultimo_mantenimiento,
      fecha_proximo_mantenimiento,
      comentarios,
      condicion = 'Bueno',
      fecha_adquisicion,
      tipo_equipo_id,
      laboratorio_id
    } = req.body
    await equipoService.crearEquipo(
      {
        codigo,
        nombre,
        descripcion,
        marca,
        modelo,
        numero_serie,
        estado,
        fecha_ultimo_mantenimiento: fecha_ultimo_mantenimiento || null,
        fecha_proximo_mantenimiento: fecha_proximo_mantenimiento || null,
        comentarios: comentarios || null,
        condicion,
        fecha_adquisicion,
        tipo_equipo_id,
        laboratorio_id
      },
      req.user.userId,
      req.ip || req.connection?.remoteAddress
    )
    res.status(201).json({
      success: true,
      message: 'Equipo creado exitosamente'
    })
  } catch (error) {
    next(error)
  }
}

export const updateEquipo = async (req, res, next) => {
  try {
    const { id } = req.params
    const {
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
    } = req.body
    const result = await equipoService.actualizarEquipo(
      id,
      {
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
      },
      req.user.userId,
      req.ip || req.connection?.remoteAddress
    )
    res.status(200).json({
      success: true,
      message: 'Equipo actualizado exitosamente',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const deleteEquipo = async (req, res, next) => {
  try {
    const { id } = req.params
    await equipoService.eliminarEquipo(
      id,
      req.user.userId,
      req.ip || req.connection?.remoteAddress
    )
    res.status(200).json({
      success: true,
      message: 'Equipo eliminado exitosamente'
    })
  } catch (error) {
    next(error)
  }
}

export const getActividadEquipos = async (req, res, next) => {
  try {
    const { laboratorio_id, fecha_inicio, fecha_fin, tipo_actividad, usuario_id } = req.query
    const actividad = await equipoService.getActividadEquipos(req.user.rol, req.user.laboratorio_ids, laboratorio_id, fecha_inicio, fecha_fin, tipo_actividad, usuario_id)
    res.status(200).json({
      success: true,
      data: actividad,
      total_registros: actividad.length,
      filtros_aplicados: {
        laboratorio_id: laboratorio_id || null,
        fecha_inicio: fecha_inicio || null,
        fecha_fin: fecha_fin || null,
        tipo_actividad: tipo_actividad || null,
        usuario_id: usuario_id || null
      }
    })
  } catch (error) {
    next(error)
  }
}

export const generarPlantillaImportacionEquipos = async (req, res, next) => {
  try {
    const { tipos_equipo } = await equipoService.getDatosPlantillaEquipos()
    const wb = XLSX.utils.book_new()
    const plantillaData = [
      [
        'CODIGO',
        'NOMBRE',
        'TIPO_EQUIPO_ID',
        'DESCRIPCION',
        'MARCA',
        'MODELO',
        'NUMERO_SERIE',
        'ESTADO',
        'FECHA_ULTIMO_MANTENIMIENTO',
        'FECHA_PROXIMO_MANTENIMIENTO',
        'COMENTARIOS',
        'CONDICION',
        'FECHA_ADQUISICION'
      ],
      [
        'EQP-0001',
        'Simulador de Paciente Adulto',
        '1',
        'Simulador de alta fidelidad para prácticas clínicas',
        'Laerdal',
        'SimMan 3G',
        'SM3G-2023-001',
        'Operativo',
        '2024-01-15',
        '2024-07-15',
        'Requiere calibración semestral',
        'Excelente',
        '2023-01-01'
      ],
      [
        'EQP-0002',
        'Microscopio Óptico Binocular',
        '2',
        'Microscopio para observación de muestras biológicas',
        'Olympus',
        'CX23',
        'CX23-2024-005',
        'Operativo',
        '2024-03-20',
        '2024-09-20',
        'Limpiar lentes semanalmente',
        'Bueno',
        '2024-01-01'
      ]
    ]
    const wsPlantilla = XLSX.utils.aoa_to_sheet(plantillaData)
    wsPlantilla['!cols'] = [
      { width: 30 }, { width: 30 }, { width: 15 }, { width: 40 }, { width: 15 }, { width: 15 },
      { width: 20 }, { width: 15 }, { width: 25 }, { width: 25 }, { width: 35 }, { width: 12 },
      { width: 15 }
    ]
    XLSX.utils.book_append_sheet(wb, wsPlantilla, 'Plantilla Equipos')
    const instruccionesData = [
      ['INSTRUCCIONES PARA IMPORTACIÓN MASIVA DE EQUIPOS'],
      [''],
      ['En la pantalla de importación debes seleccionar primero el laboratorio. Todos los equipos del archivo se registrarán en ese laboratorio.'],
      [''],
      ['COLUMNAS OBLIGATORIAS:'],
      ['• CODIGO: Código del equipo (Ej.: EQP-0001)'],
      ['• NOMBRE: Nombre del equipo (texto, máximo 255 caracteres)'],
      ['• TIPO_EQUIPO_ID: ID del tipo de equipo'],
      ['• FECHA_ADQUISICION: Fecha de compra (formato YYYY-MM-DD)'],
      [''],
      ['COLUMNAS OPCIONALES:'],
      ['• DESCRIPCION, MARCA, MODELO, NUMERO_SERIE'],
      ['• ESTADO: Operativo | En Mantenimiento | Fuera de Servicio'],
      ['• FECHA_ULTIMO_MANTENIMIENTO, FECHA_PROXIMO_MANTENIMIENTO (YYYY-MM-DD)'],
      ['• COMENTARIOS, CONDICION: Excelente | Bueno | Regular | Malo'],
      [''],
      ['TIPOS DE EQUIPOS DISPONIBLES:'],
      ['ID', 'NOMBRE'],
      ...tipos_equipo.map(te => [te.id, te.nombre])
    ]
    const wsInstrucciones = XLSX.utils.aoa_to_sheet(instruccionesData)
    wsInstrucciones['!cols'] = [{ width: 80 }, { width: 15 }, { width: 30 }]
    wsInstrucciones['A1'].s = { font: { bold: true, sz: 14 }, alignment: { horizontal: 'center' } }
    XLSX.utils.book_append_sheet(wb, wsInstrucciones, 'INSTRUCCIONES')
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })
    const timestamp = new Date().toISOString().slice(0, 10)
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename=plantilla_equipos_${timestamp}.xlsx`)
    res.send(buffer)
  } catch (error) {
    next(error)
  }
}

export const previsualizarImportacionMasivaEquipos = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ningún archivo'
      })
    }
    const { laboratorio_id } = req.body
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)
    if (data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El archivo Excel está vacío o no tiene el formato correcto'
      })
    }
    const previewData = await equipoService.previsualizarImportacion(data, laboratorio_id)
    res.status(200).json({
      data: previewData,
      total_filas: previewData.length
    })
  } catch (error) {
    next(error)
  }
}

export const importacionMasivaEquipos = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ningún archivo'
      })
    }
    const { laboratorio_id } = req.body
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)
    if (data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El archivo Excel está vacío o no tiene el formato correcto'
      })
    }
    const result = await equipoService.importarMasiva(
      data,
      req.user.userId,
      req.ip || req.connection?.remoteAddress,
      laboratorio_id
    )
    res.status(200).json({
      success: true,
      message: `Importación completada: ${result.procesados} equipos creados`,
      procesados: result.procesados,
      errores: result.errores.length,
      detalles_errores: result.errores,
      resultados: result.resultados
    })
  } catch (error) {
    next(error)
  }
}
