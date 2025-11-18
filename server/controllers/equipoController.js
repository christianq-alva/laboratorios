import { pool } from '../config/database.js'
import { Equipo } from '../models/Equipo.js'
import XLSX from 'xlsx'
import { Laboratorio } from '../models/Laboratorio.js'
import { TipoEquipo } from '../models/TipoEquipo.js'
const estadosValidos = ['Operativo', 'En Mantenimiento', 'Fuera de Servicio']
const condicionesValidas = ['Excelente', 'Bueno', 'Regular', 'Malo']
export const getEquipos = async (req, res) => {
  try {
    const { tipo_equipo_id, estado, laboratorio_id } = req.query
    
    const filters = {}
    if (tipo_equipo_id) {
      filters.tipo_equipo_id = parseInt(tipo_equipo_id)
    }
    if (estado) {
      filters.estado = estado
    }
    if (laboratorio_id) {
      filters.laboratorio_id = parseInt(laboratorio_id)
    }
    
    let equipos = await Equipo.getAll(req.user.rol, req.user.laboratorio_ids, filters)
    res.status(200).json({
      success: true,
      data: equipos,
      total_equipos: equipos.length
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}
export const getEquipoByLaboratorio = async (req, res) => {
  try {
    const { laboratorio_id } = req.params
    const { tipo_equipo_id, estado } = req.query
    
    const filters = {}
    if (tipo_equipo_id) {
      filters.tipo_equipo_id = parseInt(tipo_equipo_id)
    }
    if (estado) {
      filters.estado = estado
    }
    
    const equipos = await Equipo.getByLaboratorio(laboratorio_id, filters)
    res.status(200).json({
      success: true,
      data: equipos
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}
export const createEquipo = async (req, res) => {
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
      laboratorio_id,
      inventario_inicial = []
    } = req.body
    // Validar fechas de mantenimiento
    if (fecha_ultimo_mantenimiento && fecha_proximo_mantenimiento) {
      const fechaUltimo = new Date(fecha_ultimo_mantenimiento)
      const fechaProximo = new Date(fecha_proximo_mantenimiento)
      if (fechaProximo < fechaUltimo) {
        return res.status(400).json({
          success: false,
          message: 'La fecha del próximo mantenimiento no puede ser anterior a la fecha del último mantenimiento'
        })
      }
    }
    const existingCodigo = await Equipo.existsByCodigo(codigo)
    if (existingCodigo) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe otro equipo con ese código'
      })
    }
    // Crear el equipo
    const equipo_id = await Equipo.create({
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
    })
    // Registrar actividad de creación
    await Equipo.registrarActividadEquipo({
      accion: 'crear',
      equipo_id: equipo_id,
      descripcion: `Equipo creado: ${nombre} (${codigo}) - Marca: ${marca || 'N/A'}, Modelo: ${modelo || 'N/A'}, Estado: ${estado}, Condición: ${condicion}. Inventario inicial en ${inventario_inicial.length} laboratorio(s).`,
      usuario_id: req.user.userId,
      ip_address: req.ip || req.connection.remoteAddress
    })
    res.status(201).json({
      success: true,
      message: 'Equipo creado exitosamente',

    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}
export const updateEquipo = async (req, res) => {
  try {
    const { id } = req.params
    const equipoId = parseInt(id, 10)
    const { codigo, nombre, descripcion, marca, modelo, numero_serie, estado, fecha_ultimo_mantenimiento, fecha_proximo_mantenimiento, comentarios, condicion, fecha_adquisicion, tipo_equipo_id, laboratorio_id } = req.body
    // Validar ID
    if (isNaN(equipoId) || equipoId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de equipo inválido'
      })
    }
    // Validar datos
    if (!nombre?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nombre es requerido'
      })
    }
    if (!tipo_equipo_id) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de equipo es requerido'
      })
    }
    // Validar fechas de mantenimiento
    if (fecha_ultimo_mantenimiento && fecha_proximo_mantenimiento) {
      const fechaUltimo = new Date(fecha_ultimo_mantenimiento)
      const fechaProximo = new Date(fecha_proximo_mantenimiento)
      if (fechaProximo < fechaUltimo) {
        return res.status(400).json({ 
          success: false,
          message: 'La fecha del próximo mantenimiento no puede ser anterior a la fecha del último mantenimiento'
        })
      }
    }
    // Verificar que el equipo existe
    const existingEquipo = await Equipo.existsById(equipoId)
    if (!existingEquipo) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado'
      })
    }
    const existingCodigo = await Equipo.existsByCodigo(codigo, equipoId)
    if (existingCodigo) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe otro equipo con ese código'
      })
    }
    const equipoInfo = await Equipo.getById(equipoId)
    const reservasActivasByLaboratorioId = await Equipo.reservasActivasByLaboratorioId(equipoInfo.id, equipoInfo.laboratorio_id)
    if (reservasActivasByLaboratorioId && laboratorio_id !== equipoInfo.laboratorio_id) {
      return res.status(400).json({
        success: false,
        message: 'No se puede actualizar. El equipo tiene reservas programadas en el laboratorio actual.'
      })
    }
    const affectedRows = await Equipo.update(equipoId, {
      codigo: codigo.trim(),
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || '',
      marca: marca?.trim() || '',
      modelo: modelo?.trim() || '',
      numero_serie: numero_serie?.trim() || '',
      estado: estado || 'Operativo',
      fecha_ultimo_mantenimiento: fecha_ultimo_mantenimiento || null,
      fecha_proximo_mantenimiento: fecha_proximo_mantenimiento || null,
      comentarios: comentarios?.trim() || '',
      condicion: condicion || 'Bueno',
      fecha_adquisicion: fecha_adquisicion,
      tipo_equipo_id: tipo_equipo_id,
      laboratorio_id: laboratorio_id
    })
    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado'
      })
    }
    // Registrar actividad de actualización
    await Equipo.registrarActividadEquipo({
      accion: 'actualizar',
      equipo_id: equipoId,
      descripcion: `Equipo actualizado: ${nombre.trim()} - Marca: ${marca?.trim() || 'N/A'}, Modelo: ${modelo?.trim() || 'N/A'}, Estado: ${estado || 'Operativo'}, Condición: ${condicion || 'Bueno'}. Último mant.: ${fecha_ultimo_mantenimiento || 'N/A'}, Próximo mant.: ${fecha_proximo_mantenimiento || 'N/A'}.`,
      usuario_id: req.user.userId,
      ip_address: req.ip || req.connection.remoteAddress
    })
    res.status(200).json({
      success: true,
      message: 'Equipo actualizado exitosamente',
      data: { id: equipoId, nombre: nombre.trim(), descripcion, marca, modelo, numero_serie, estado }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    })
  }
}
export const deleteEquipo = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const { id } = req.params
    const equipoId = parseInt(id, 10)
    // Validar ID
    if (isNaN(equipoId) || equipoId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de equipo inválido'
      })
    }
    // Verificar que el equipo existe y capturar información completa
    const existingEquipo = await Equipo.existsById(equipoId)
    if (!existingEquipo) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado'
      })
    }
    const reservasActivas = await Equipo.reservasActivas(equipoId)
    // Verificar si el equipo está siendo usado en reservas activas
    if (reservasActivas) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar. El equipo está siendo usado en el sistema.'
      })
    }
    const equipoInfo = await Equipo.getById(equipoId)
    // Eliminar equipo
    await Equipo.delete(equipoId)
    // Registrar actividad de eliminación
    await Equipo.registrarActividadEquipo({
      accion: 'eliminar',
      equipo_id: equipoInfo.id,
      descripcion: `Equipo eliminado: ${equipoInfo.nombre} (${equipoInfo.codigo || 'N/A'}) - Marca: ${equipoInfo.marca || 'N/A'}, Modelo: ${equipoInfo.modelo || 'N/A'}, Estado: ${equipoInfo.estado || 'N/A'}, Condición: ${equipoInfo.condicion || 'N/A'}.`,
      usuario_id: req.user.userId,
      ip_address: req.ip || req.connection.remoteAddress
    })
    res.status(200).json({
      success: true,
      message: 'Equipo eliminado exitosamente'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno al eliminar el equipo'
    })
  }
}
// Obtener actividad de equipos
export const getActividadEquipos = async (req, res) => {
  try {
    const { laboratorio_id, fecha_inicio, fecha_fin, tipo_actividad, usuario_id } = req.query
    const actividad = await Equipo.getActividadEquipos(req.user.rol, req.user.laboratorio_ids, laboratorio_id, fecha_inicio, fecha_fin, tipo_actividad, usuario_id)
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
    console.error('Error en getActividadEquipos:', error)
    res.status(500).json({ 
      success: false,
      message: error.message })
  }
}
// Generar plantilla Excel para importación masiva de equipos
export const generarPlantillaImportacionEquipos = async (req, res) => {
  try {
    console.log('📊 Generando plantilla Excel para importación masiva de equipos...')
    // Obtener laboratorios para referencia
    const laboratorios = await Laboratorio.getAll()
    // Obtener tipos de equipo para referencia
    const tipos_equipo = await TipoEquipo.getAll()
    // Crear workbook
    const wb = XLSX.utils.book_new()
    // Hoja 1: Plantilla de equipos
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
        'FECHA_ADQUISICION',
        'LABORATORIO_CODIGO',
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
        '2023-01-01',
        'LAB-001',
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
        '2024-01-01',
        'LAB-002',
      ]
    ]
    const wsPlantilla = XLSX.utils.aoa_to_sheet(plantillaData)
    // Configurar ancho de columnas
    wsPlantilla['!cols'] = [
      { width: 30 }, // CODIGO
      { width: 30 }, // NOMBRE
      { width: 15 }, // TIPO_EQUIPO_ID
      { width: 40 }, // DESCRIPCION
      { width: 15 }, // MARCA
      { width: 15 }, // MODELO
      { width: 20 }, // NUMERO_SERIE
      { width: 15 }, // ESTADO
      { width: 25 }, // FECHA_ULTIMO_MANTENIMIENTO
      { width: 25 }, // FECHA_PROXIMO_MANTENIMIENTO
      { width: 35 }, // COMENTARIOS
      { width: 12 }, // CONDICION
      { width: 15 }, // FECHA_ADQUISICION
      { width: 15 }, // LABORATORIO_CODIGO
    ]
    XLSX.utils.book_append_sheet(wb, wsPlantilla, 'Plantilla Equipos')
    // Hoja 2: Instrucciones y validaciones
    const instruccionesData = [
      ['INSTRUCCIONES PARA IMPORTACIÓN MASIVA DE EQUIPOS'],
      [''],
      ['COLUMNAS OBLIGATORIAS:'],
      ['• CODIGO: Código del equipo (Ej.: EQP-0001)'],
      ['• NOMBRE: Nombre del equipo (texto, máximo 255 caracteres)'],
      ['• TIPO_EQUIPO_ID: ID del tipo de equipo'],
      ['• FECHA_ADQUISICION: Fecha de compra (formato YYYY-MM-DD)'],
      ['• LABORATORIO_CODIGO: Código del laboratorio'],
      [''],
      ['COLUMNAS OPCIONALES:'],
      ['• DESCRIPCION: Descripción detallada del equipo'],
      ['• MARCA: Marca del fabricante'],
      ['• MODELO: Modelo específico del equipo'],
      ['• NUMERO_SERIE: Número de serie único'],
      ['• ESTADO: Operativo | En Mantenimiento | Fuera de Servicio (por defecto: Operativo)'],
      ['• FECHA_ULTIMO_MANTENIMIENTO: Formato YYYY-MM-DD'],
      ['• FECHA_PROXIMO_MANTENIMIENTO: Formato YYYY-MM-DD'],
      ['• COMENTARIOS: Observaciones adicionales'],
      ['• CONDICION: Excelente | Bueno | Regular | Malo (por defecto: Bueno)'],
      [''],
      ['LABORATORIOS DISPONIBLES:'],
      ['CODIGO', 'NOMBRE'],
      ...laboratorios.map(lab => [lab.codigo, lab.nombre]),
      [''],
      ['TIPOS DE EQUIPOS DISPONIBLES:'],
      ['ID', 'NOMBRE'],
      ...tipos_equipo.map(te => [te.id, te.nombre]),
      [''],
      ['NOTAS IMPORTANTES:'],
      ['• Las fechas deben estar en formato YYYY-MM-DD'],
      ['• El laboratorio y tipo de equipo deben ser válidos'],
      ['• Los estados deben ser: Operativo, En Mantenimiento o Fuera de Servicio'],
      ['• Las condiciones deben ser: Excelente, Bueno, Regular o Malo'],
      ['• La fecha de adquisición debe estar en formato YYYY-MM-DD'],
      ['• Los números de serie deben ser únicos'],
      ['• Elimine esta hoja antes de importar el archivo']
    ]
    const wsInstrucciones = XLSX.utils.aoa_to_sheet(instruccionesData)
    wsInstrucciones['!cols'] = [{ width: 80 }, { width: 15 }, { width: 30 }]
    // Hacer la primera fila más grande y en negrita
    wsInstrucciones['A1'].s = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: 'center' }
    }
    XLSX.utils.book_append_sheet(wb, wsInstrucciones, 'INSTRUCCIONES')
    // Configurar respuesta para descarga
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })
    const timestamp = new Date().toISOString().slice(0, 10)

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename=plantilla_equipos_${timestamp}.xlsx`)
    res.send(buffer)
  } catch (error) {
    console.error('❌ Error al generar plantilla Excel de equipos:', error)
    res.status(500).json({
      success: false,
      message: 'Error al generar la plantilla Excel de equipos'
    })
  }
}
// Previsualizar importación masiva de equipos
export const previsualizarImportacionMasivaEquipos = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ningún archivo'
      })
    }
    // Leer archivo Excel
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
    // Obtener laboratorios existentes
    const laboratorios = await Laboratorio.getAll()
    // Obtener tipos de equipo existentes
    const tipos_equipo = await TipoEquipo.getAll()
    const previewData = []
    const erroresGenerales = []
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 2 // +2 porque Excel empieza en 1 y tenemos header
      const erroresFila = []
      // Validar y limpiar datos
      const codigo = row.CODIGO ? row.CODIGO.toString().trim() : null
      const nombre = row.NOMBRE ? row.NOMBRE.toString().trim() : ''
      const descripcion = row.DESCRIPCION ? row.DESCRIPCION.toString().trim() : ''
      const marca = row.MARCA ? row.MARCA.toString().trim() : ''
      const modelo = row.MODELO ? row.MODELO.toString().trim() : ''
      const numero_serie = row.NUMERO_SERIE ? row.NUMERO_SERIE.toString().trim() : ''
      const estado = row.ESTADO ? row.ESTADO.toString().trim() : 'Operativo'
      const comentarios = row.COMENTARIOS ? row.COMENTARIOS.toString().trim() : ''
      const condicion = row.CONDICION ? row.CONDICION.toString().trim() : 'Bueno'
      const laboratorio_codigo = row.LABORATORIO_CODIGO ? row.LABORATORIO_CODIGO.toString().trim() : null
      const tipo_equipo_id = row.TIPO_EQUIPO_ID ? parseInt(row.TIPO_EQUIPO_ID) : null
      // Validar campos obligatorios
      if (!codigo) {
        erroresFila.push('CODIGO es obligatorio')
      }
      if (!nombre) {
        erroresFila.push('NOMBRE es obligatorio')
      }
      // Validar fechas de mantenimiento
      let fecha_ultimo_mantenimiento = ''
      let fecha_proximo_mantenimiento = ''
      if (row.FECHA_ULTIMO_MANTENIMIENTO) {
        const fechaStr = row.FECHA_ULTIMO_MANTENIMIENTO.toString().trim()
        if (fechaStr) {
          const fecha = new Date(fechaStr)
          if (!isNaN(fecha.getTime())) {
            fecha_ultimo_mantenimiento = fecha.toISOString().split('T')[0]
          } else {
            erroresFila.push('Fecha de último mantenimiento inválida (use formato YYYY-MM-DD)')
          }
        }
      }
      if (row.FECHA_PROXIMO_MANTENIMIENTO) {
        const fechaStr = row.FECHA_PROXIMO_MANTENIMIENTO.toString().trim()
        if (fechaStr) {
          const fecha = new Date(fechaStr)
          if (!isNaN(fecha.getTime())) {
            fecha_proximo_mantenimiento = fecha.toISOString().split('T')[0]
          } else {
            erroresFila.push('Fecha de próximo mantenimiento inválida (use formato YYYY-MM-DD)')
          }
        }
      }
      // Validar fecha de adquisición
      let fecha_adquisicion = ''
      if (row.FECHA_ADQUISICION) {
        const fechaStr = row.FECHA_ADQUISICION.toString().trim()
        if (fechaStr) {
          const fecha = new Date(fechaStr)
          if (!isNaN(fecha.getTime())) {
            fecha_adquisicion = fecha.toISOString().split('T')[0]
          } else {
            erroresFila.push('Fecha de adquisición inválida (use formato YYYY-MM-DD)')
          }
        }
      }
      // Validar estado 
      if (!estadosValidos.includes(estado)) {
        erroresFila.push(`Estado inválido. Debe ser: ${estadosValidos.join(', ')}`)
      }
      // Validar condición
      if (!condicionesValidas.includes(condicion)) {
        erroresFila.push(`Condición inválida. Debe ser: ${condicionesValidas.join(', ')}`)
      }
      if (!laboratorio_codigo) {
        erroresFila.push('LABORATORIO_CODIGO es obligatorio')
      } else if (!laboratorios.some(lab => lab.codigo === laboratorio_codigo)) {
        erroresFila.push(`Laboratorio inválido: ${laboratorio_codigo}`)
      }
      if (!tipo_equipo_id) {
        erroresFila.push('TIPO_EQUIPO_ID es obligatorio')
      } else if (!tipos_equipo.some(te => te.id === tipo_equipo_id)) {
        erroresFila.push(`Tipo de equipo inválido: ${tipo_equipo_id}`)
      }
      previewData.push({
        fila: rowNum,
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
        laboratorio_codigo,
        tipo_equipo_id,
        errores: erroresFila
      })
    }
    console.log(`📊 Previsualización de equipos completada: ${previewData.length} filas procesadas`)
    res.status(200).json({
      data: previewData,
      total_filas: previewData.length,
      errores_generales: erroresGenerales
    })
  } catch (error) {
    console.error('❌ Error en previsualización de equipos:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno en la previsualización de equipos',
      error: error.message
    })
  }
}
// Importación masiva de equipos desde Excel
export const importacionMasivaEquipos = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ningún archivo'
      })
    }
    // Leer archivo Excel
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
    // Obtener laboratorios existentes
    const laboratorios = await Laboratorio.getAll()
    // Obtener tipos de equipo existentes
    const tipos_equipo = await TipoEquipo.getAll()
    let procesados = 0
    let errores = []
    const resultados = []
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 2 // +2 porque Excel empieza en 1 y tenemos header
      try {
        // Validar campos obligatorios
        if (!row.NOMBRE) {
          errores.push(`Fila ${rowNum}: NOMBRE es obligatorio`)
          continue
        }
        // Limpiar y validar datos
        const codigo = row.CODIGO ? row.CODIGO.toString().trim() : null
        const nombre = row.NOMBRE.toString().trim()
        const descripcion = row.DESCRIPCION ? row.DESCRIPCION.toString().trim() : ''
        const marca = row.MARCA ? row.MARCA.toString().trim() : ''
        const modelo = row.MODELO ? row.MODELO.toString().trim() : ''
        const numero_serie = row.NUMERO_SERIE ? row.NUMERO_SERIE.toString().trim() : ''
        const estado = row.ESTADO ? row.ESTADO.toString().trim() : 'Operativo'
        const comentarios = row.COMENTARIOS ? row.COMENTARIOS.toString().trim() : ''
        const condicion = row.CONDICION ? row.CONDICION.toString().trim() : 'Bueno'
        const laboratorio_codigo = row.LABORATORIO_CODIGO ? row.LABORATORIO_CODIGO.toString().trim() : null
        const tipo_equipo_id = row.TIPO_EQUIPO_ID ? parseInt(row.TIPO_EQUIPO_ID) : null
        // Validar campos obligatorios
        if (!codigo) {
          errores.push(`Fila ${rowNum}: CODIGO es obligatorio`)
          continue
        }
        if (!nombre) {
          errores.push(`Fila ${rowNum}: NOMBRE es obligatorio`)
          continue
        }
        // Validar fechas de mantenimiento
        let fecha_ultimo_mantenimiento = null
        let fecha_proximo_mantenimiento = null
        if (row.FECHA_ULTIMO_MANTENIMIENTO) {
          const fechaStr = row.FECHA_ULTIMO_MANTENIMIENTO.toString().trim()
          if (fechaStr) {
            const fecha = new Date(fechaStr)
            if (!isNaN(fecha.getTime())) {
              fecha_ultimo_mantenimiento = fecha.toISOString().split('T')[0]
            } else {
              errores.push(`Fila ${rowNum}: Fecha de último mantenimiento inválida (use formato YYYY-MM-DD)`)
              continue
            }
          }
        }
        if (row.FECHA_PROXIMO_MANTENIMIENTO) {
          const fechaStr = row.FECHA_PROXIMO_MANTENIMIENTO.toString().trim()
          if (fechaStr) {
            const fecha = new Date(fechaStr)
            if (!isNaN(fecha.getTime())) {
              fecha_proximo_mantenimiento = fecha.toISOString().split('T')[0]
            } else {
              errores.push(`Fila ${rowNum}: Fecha de próximo mantenimiento inválida (use formato YYYY-MM-DD)`)
              continue
            }
          }
        }
        // Validar fecha de adquisición
        let fecha_adquisicion = null
        if (row.FECHA_ADQUISICION) {
          const fechaStr = row.FECHA_ADQUISICION.toString().trim()
          if (fechaStr) {
            const fecha = new Date(fechaStr)
            if (!isNaN(fecha.getTime())) {
              fecha_adquisicion = fecha.toISOString().split('T')[0]
            } else {
              errores.push(`Fila ${rowNum}: Fecha de adquisición inválida (use formato YYYY-MM-DD)`)
              continue
            }
          }
        }
        if (!laboratorio_codigo) {
          errores.push(`Fila ${rowNum}: LABORATORIO_CODIGO es obligatorio`)
          continue
        } else if (!laboratorios.some(lab => lab.codigo === laboratorio_codigo)) {
          errores.push(`Fila ${rowNum}: Laboratorio inválido: ${laboratorio_codigo}`)
          continue
        }
        const laboratorio_id = laboratorios.find(lab => lab.codigo === laboratorio_codigo)?.id
        if (!tipo_equipo_id) {
          errores.push(`Fila ${rowNum}: TIPO_EQUIPO_ID es obligatorio`)
          continue
        } else if (!tipos_equipo.some(te => te.id === tipo_equipo_id)) {
          errores.push(`Fila ${rowNum}: Tipo de equipo inválido: ${tipo_equipo_id}`)
          continue
        }
        // Validar estado
        if (!estadosValidos.includes(estado)) {
          errores.push(`Fila ${rowNum}: Estado inválido. Debe ser: ${estadosValidos.join(', ')}`)
          continue
        }
        // Validar condición
        if (!condicionesValidas.includes(condicion)) {
          errores.push(`Fila ${rowNum}: Condición inválida. Debe ser: ${condicionesValidas.join(', ')}`)
          continue
        }
        // Crear el equipo
        const equipo_id = await Equipo.create({
          codigo: codigo,
          nombre: nombre,
          descripcion: descripcion,
          marca: marca,
          modelo: modelo,
          numero_serie: numero_serie,
          estado: estado,
          fecha_ultimo_mantenimiento: fecha_ultimo_mantenimiento,
          fecha_proximo_mantenimiento: fecha_proximo_mantenimiento,
          comentarios: comentarios,
          condicion: condicion,
          fecha_adquisicion: fecha_adquisicion,
          tipo_equipo_id: tipo_equipo_id,
          laboratorio_id: laboratorio_id
        })
        // Registrar actividad de creación
        await Equipo.registrarActividadEquipo({
          accion: 'crear',
          equipo_id: equipo_id,
          descripcion: `Equipo creado por importación masiva: ${nombre} (${codigo}) - Marca: ${marca || 'N/A'}, Modelo: ${modelo || 'N/A'}, Estado: ${estado}, Condición: ${condicion}. Inventario en  laboratorio ${laboratorio_codigo}.`,
          usuario_id: req.user.userId,
          ip_address: req.ip || req.connection.remoteAddress
        })
        resultados.push({
          fila: rowNum,
          codigo: codigo,
          nombre: nombre,
          marca: marca || 'N/A',
          modelo: modelo || 'N/A',
          estado: estado,
          laboratorio_id: laboratorio_id,
          tipo_equipo_id: tipo_equipo_id
        })
        procesados++
      } catch (error) {
        errores.push(`Fila ${rowNum}: ${error.message}`)
      }
    }
    if (errores.length > 0 && procesados === 0) {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        message: 'No se pudo procesar ningún registro',
        errores: errores
      })
    }
    await connection.commit()
    res.status(200).json({
      success: true,
      message: `Importación completada: ${procesados} equipos creados`,
      procesados: procesados,
      errores: errores.length,
      detalles_errores: errores,
      resultados: resultados
    })
  } catch (error) {
    await connection.rollback()
    res.status(500).json({
      success: false,
      message: 'Error interno en la importación masiva de equipos',
      error: error.message
    })
  } finally {
    connection.release()
  }
}
