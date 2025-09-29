import { pool } from '../config/database.js'
import { Insumo } from '../models/Insumo.js'
import multer from 'multer'
import XLSX from 'xlsx'

export const getInsumos = async (req, res) => {
  try {
    const { laboratorio_id } = req.query // Obtener el laboratorio específico de la consulta
    
    console.log('🔍 getInsumos - Parámetros:', { 
      laboratorio_id, 
      user_role: req.user.rol, 
      user_laboratorio_ids: req.user.laboratorio_ids 
    })
    
    let insumos = []
    
    // Si se especifica un laboratorio específico
    if (laboratorio_id) {
      const labId = parseInt(laboratorio_id)
      
      // Verificar permisos: Admin puede ver cualquier lab, Jefe solo sus asignados
      if (req.user.rol === 'Administrador' || req.user.laboratorio_ids.includes(labId)) {
        console.log('✅ Usuario autorizado para ver insumos del laboratorio:', labId)
        insumos = await Insumo.getByLaboratorio(labId)
        console.log('📦 Insumos encontrados:', insumos.length)
      } else {
        console.log('❌ Usuario no autorizado para ver insumos del laboratorio:', labId)
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permisos para ver los insumos de este laboratorio' 
        })
      }
    } else {
      // Sin laboratorio específico, devolver todos según rol
      if (req.user.rol === 'Jefe de Laboratorio') {
        // Solo insumos de sus laboratorios
        for (const labId of req.user.laboratorio_ids) {
          const insumosLab = await Insumo.getByLaboratorio(labId)
          insumos = [...insumos, ...insumosLab]
        }
      } else if (req.user.rol === 'Administrador') {
        // Todos los insumos con información de stock
        const [rows] = await pool.execute(`
          SELECT i.*, 
                 GROUP_CONCAT(CONCAT(l.nombre, ':', COALESCE(inv.cantidad, 0)) SEPARATOR '; ') as stock_por_laboratorio
          FROM insumos i
          LEFT JOIN inventario_insumos inv ON i.id = inv.insumo_id
          LEFT JOIN laboratorios l ON inv.laboratorio_id = l.id
          GROUP BY i.id, i.codigo, i.nombre, i.descripcion, i.unidad_medida, i.categoria, i.presentacion, i.condicion, i.fecha_vencimiento, i.observacion
          ORDER BY i.categoria, i.codigo, i.nombre
        `)
        insumos = rows
      }
    }
    
    res.json({ 
      success: true, 
      data: insumos,
      laboratorio_filtrado: laboratorio_id || null,
      total_insumos: insumos.length
    })
  } catch (error) {
    console.error('Error en getInsumos:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

export const createInsumo = async (req, res) => {
    const connection = await pool.getConnection()
    
    try {
      await connection.beginTransaction()
      
      const { 
        nombre, 
        descripcion, 
        unidad_medida,
        categoria = 'Materiales', // ← NUEVO: Categoría del insumo
        presentacion,
        condicion = 'Bueno',
        fecha_vencimiento,
        observacion,
        stock_inicial = [] // ← NUEVO: Array de stock por laboratorio
      } = req.body
      
      console.log('🔍 Creando insumo con stock:', req.body)
      
      // Generar código único para el insumo
      let codigo
      let intentos = 0
      const maxIntentos = 10
      
      do {
        const [maxId] = await connection.execute('SELECT MAX(id) as max_id FROM insumos')
        const nextId = (maxId[0].max_id || 0) + 1 + intentos
        codigo = `INS-${nextId.toString().padStart(4, '0')}`
        
        // Verificar si el código ya existe
        const [existing] = await connection.execute('SELECT id FROM insumos WHERE codigo = ?', [codigo])
        
        if (existing.length === 0) {
          break // Código único encontrado
        }
        
        intentos++
        console.log(`⚠️ Código ${codigo} ya existe, intentando con siguiente...`)
      } while (intentos < maxIntentos)
      
      if (intentos >= maxIntentos) {
        throw new Error('No se pudo generar un código único para el insumo')
      }
      
      console.log(`✅ Código único generado: ${codigo}`)
      
      // 1️⃣ CREAR EL INSUMO (catálogo)
      const [insumoResult] = await connection.execute(`
        INSERT INTO insumos (codigo, nombre, descripcion, unidad_medida, categoria, presentacion, condicion, fecha_vencimiento, observacion) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [codigo, nombre, descripcion, unidad_medida, categoria, presentacion, condicion, fecha_vencimiento || null, observacion])
      
      const insumo_id = insumoResult.insertId
      console.log('✅ Insumo creado con ID:', insumo_id)
      
      // 2️⃣ AGREGAR STOCK INICIAL (si se proporciona)
      if (stock_inicial && stock_inicial.length > 0) {
        for (const stock of stock_inicial) {
          const { laboratorio_id, cantidad, observaciones = 'Stock inicial' } = stock
          
          // Verificar permisos del laboratorio
          if (req.user.rol === 'Jefe de Laboratorio') {
            if (!req.user.laboratorio_ids.includes(parseInt(laboratorio_id))) {
              await connection.rollback()
              return res.status(403).json({ 
                success: false, 
                message: `No puedes agregar stock al laboratorio ${laboratorio_id}` 
              })
            }
          }
          
          console.log(`🔄 Agregando stock: Lab ${laboratorio_id}, Cantidad ${cantidad}`)
          
          // Crear entrada en inventario
          await connection.execute(`
            INSERT INTO inventario_insumos (insumo_id, laboratorio_id, cantidad)
            VALUES (?, ?, ?)
          `, [insumo_id, laboratorio_id, cantidad])
          
          // Crear fecha en zona horaria de Perú
          const fechaPeru = new Date().toLocaleString('en-CA', { 
            timeZone: 'America/Lima',
            year: 'numeric',
            month: '2-digit', 
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          }).replace(', ', ' ')

          // Registrar movimiento de entrada
          await connection.execute(`
            INSERT INTO movimientos_insumos 
            (insumo_id, laboratorio_id, usuario_id, tipo_movimiento, cantidad, observaciones, fecha_movimiento)
            VALUES (?, ?, ?, 'entrada', ?, ?, ?)
          `, [insumo_id, laboratorio_id, req.user.userId, cantidad, observaciones, fechaPeru])
        }
      }
      
      await connection.commit()
      
      res.json({ 
        success: true, 
        message: 'Insumo creado con stock inicial',
        insumo_id: insumo_id,
        laboratorios_con_stock: stock_inicial.length
      })
      
    } catch (error) {
      await connection.rollback()
      console.error('Error en createInsumo:', error)
      res.status(500).json({ success: false, message: error.message })
    } finally {
      connection.release()
    }
  }

// Obtener actividad de movimientos de insumos
export const getActividadInsumos = async (req, res) => {
  try {
    const { laboratorio_id, fecha_inicio, fecha_fin, tipo_movimiento } = req.query
    
    console.log('🔍 getActividadInsumos - Parámetros:', { 
      laboratorio_id, 
      fecha_inicio, 
      fecha_fin, 
      tipo_movimiento,
      user_role: req.user.rol, 
      user_laboratorio_ids: req.user.laboratorio_ids 
    })
    
    let query = `
      SELECT 
        m.id,
        m.fecha_movimiento,
        m.tipo_movimiento,
        m.cantidad,
        m.observaciones,
        i.nombre as insumo_nombre,
        i.unidad_medida,
        l.nombre as laboratorio_nombre,
        u.nombre_completo as usuario_nombre,
        rol.nombre as usuario_rol,
        r.descripcion as reserva_descripcion,
        r.fecha_inicio as reserva_fecha_inicio,
        r.fecha_fin as reserva_fecha_fin
      FROM movimientos_insumos m
      INNER JOIN insumos i ON m.insumo_id = i.id
      INNER JOIN laboratorios l ON m.laboratorio_id = l.id
      INNER JOIN usuarios u ON m.usuario_id = u.id
      INNER JOIN roles rol ON u.rol_id = rol.id
      LEFT JOIN reservas r ON m.reserva_id = r.id
      WHERE 1=1
    `
    
    const params = []
    
    // Filtros según permisos del usuario
    if (req.user.rol === 'Jefe de Laboratorio') {
      query += ` AND m.laboratorio_id IN (${req.user.laboratorio_ids.join(',')})`
    }
    
    // Filtros opcionales
    if (laboratorio_id) {
      query += ` AND m.laboratorio_id = ?`
      params.push(laboratorio_id)
    }
    
    if (fecha_inicio) {
      query += ` AND DATE(m.fecha_movimiento) >= ?`
      params.push(fecha_inicio)
    }
    
    if (fecha_fin) {
      query += ` AND DATE(m.fecha_movimiento) <= ?`
      params.push(fecha_fin)
    }
    
    if (tipo_movimiento) {
      query += ` AND m.tipo_movimiento = ?`
      params.push(tipo_movimiento)
    }
    
    query += ` ORDER BY m.fecha_movimiento DESC LIMIT 100`
    
    const [rows] = await pool.execute(query, params)
    
    // Convertir fechas al formato ISO para el frontend
    const actividadConFechasISO = rows.map(row => ({
      ...row,
      fecha_movimiento: row.fecha_movimiento ? new Date(row.fecha_movimiento).toISOString() : null,
      reserva_fecha_inicio: row.reserva_fecha_inicio ? new Date(row.reserva_fecha_inicio).toISOString() : null,
      reserva_fecha_fin: row.reserva_fecha_fin ? new Date(row.reserva_fecha_fin).toISOString() : null
    }))
    
    console.log('📊 Actividad encontrada:', rows.length)
    
    res.json({ 
      success: true, 
      data: actividadConFechasISO,
      total_movimientos: rows.length,
      filtros_aplicados: {
        laboratorio_id: laboratorio_id || null,
        fecha_inicio: fecha_inicio || null,
        fecha_fin: fecha_fin || null,
        tipo_movimiento: tipo_movimiento || null
      }
    })
  } catch (error) {
    console.error('Error en getActividadInsumos:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

export const reabastecimientoInsumos = async (req, res) => {
  const connection = await pool.getConnection()
  
  try {
    await connection.beginTransaction()
    
    const { laboratorio_id, motivo_general, insumos } = req.body
    const userId = req.user.userId
    
    console.log('📦 Procesando reabastecimiento:', { laboratorio_id, motivo_general, insumos_count: insumos?.length })
    
    // Validaciones
    if (!laboratorio_id || !insumos || !Array.isArray(insumos) || insumos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Datos incompletos: laboratorio_id e insumos son requeridos'
      })
    }
    
    // Verificar permisos del usuario sobre el laboratorio
    if (req.user.rol === 'Jefe de Laboratorio') {
      if (!req.user.laboratorio_ids.includes(parseInt(laboratorio_id))) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para agregar insumos a este laboratorio'
        })
      }
    }
    
    // Verificar que el laboratorio existe
    const [labCheck] = await connection.execute(
      'SELECT id, nombre FROM laboratorios WHERE id = ?',
      [laboratorio_id]
    )
    
    if (labCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Laboratorio no encontrado'
      })
    }
    
    const laboratorioNombre = labCheck[0].nombre
    let insumosActualizados = 0
    
    // Procesar cada insumo
    for (const insumoData of insumos) {
      const { insumo_id, cantidad, observaciones } = insumoData
      
      console.log('🔍 Procesando insumo:', { insumo_id, cantidad, observaciones })
      
      if (!insumo_id || cantidad <= 0) {
        console.log('⚠️ Saltando insumo con datos inválidos:', insumoData)
        continue
      }
      
      // Verificar que el insumo existe
      const [insumoCheck] = await connection.execute(
        'SELECT id, nombre FROM insumos WHERE id = ?',
        [insumo_id]
      )
      
      if (insumoCheck.length === 0) {
        console.log('⚠️ Insumo no encontrado:', insumo_id)
        continue
      }
      
      // Verificar si ya existe stock para este insumo en este laboratorio
      const [stockExistente] = await connection.execute(
        'SELECT cantidad FROM inventario_insumos WHERE insumo_id = ? AND laboratorio_id = ?',
        [insumo_id, laboratorio_id]
      )
      
      console.log('📦 Stock existente:', stockExistente.length > 0 ? stockExistente[0] : 'No existe')
      
      if (stockExistente.length > 0) {
        // Actualizar stock existente
        console.log('🔄 Actualizando stock existente...')
        await connection.execute(`
          UPDATE inventario_insumos 
          SET cantidad = cantidad + ?
          WHERE insumo_id = ? AND laboratorio_id = ?
        `, [cantidad, insumo_id, laboratorio_id])
        console.log('✅ Stock actualizado')
      } else {
        // Crear nuevo registro de stock
        console.log('🆕 Creando nuevo registro de stock...')
        await connection.execute(`
          INSERT INTO inventario_insumos (insumo_id, laboratorio_id, cantidad)
          VALUES (?, ?, ?)
        `, [insumo_id, laboratorio_id, cantidad])
        console.log('✅ Nuevo stock creado')
      }
      
      // Crear fecha en zona horaria de Perú
      const fechaPeru = new Date().toLocaleString('en-CA', { 
        timeZone: 'America/Lima',
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(', ', ' ')

      // Registrar movimiento en el historial
      console.log('📝 Registrando movimiento...', { insumo_id, laboratorio_id, cantidad, userId })
      try {
        await connection.execute(`
          INSERT INTO movimientos_insumos 
          (insumo_id, laboratorio_id, tipo_movimiento, cantidad, observaciones, usuario_id, fecha_movimiento)
          VALUES (?, ?, 'entrada', ?, ?, ?, ?)
        `, [insumo_id, laboratorio_id, cantidad, observaciones || motivo_general, userId || 1, fechaPeru])
        console.log('✅ Movimiento registrado')
      } catch (movError) {
        console.error('❌ Error al registrar movimiento:', movError.message)
        // Continuar sin fallar el reabastecimiento
      }
      
      insumosActualizados++
      console.log(`✅ Insumo ${insumoCheck[0].nombre} reabastecido: +${cantidad}`)
    }
    
    await connection.commit()
    
    console.log(`🎉 Reabastecimiento completado: ${insumosActualizados} insumos actualizados`)
    
    res.json({
      success: true,
      message: `Reabastecimiento completado exitosamente en ${laboratorioNombre}`,
      data: {
        laboratorio_id: parseInt(laboratorio_id),
        laboratorio_nombre: laboratorioNombre,
        insumos_actualizados: insumosActualizados,
        motivo: motivo_general
      }
    })
    
  } catch (error) {
    await connection.rollback()
    console.error('❌ Error en reabastecimiento:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno al procesar reabastecimiento'
    })
  } finally {
    connection.release()
  }
}

// Configuración de multer para subida de archivos
const storage = multer.memoryStorage()
export const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true)
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'), false)
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB límite
  }
})

// Generar plantilla Excel para carga masiva
export const generarPlantillaExcel = async (req, res) => {
  try {
    console.log('📊 Generando plantilla Excel para carga masiva...')
    
    // Obtener todos los insumos y laboratorios con códigos
    const [insumos] = await pool.execute(`
      SELECT codigo, nombre, unidad_medida 
      FROM insumos 
      ORDER BY codigo
    `)
    
    const [laboratorios] = await pool.execute(`
      SELECT codigo, nombre 
      FROM laboratorios 
      ORDER BY codigo
    `)
    
    // Crear workbook
    const wb = XLSX.utils.book_new()
    
    // Hoja 1: Plantilla para completar
    const plantillaData = [
      ['CODIGO_INSUMO', 'CANTIDAD', 'CODIGO_LABORATORIO'],
      ['INS-0001', '50', 'LAB-0001'],
      ['INS-0002', '100', 'LAB-0002'],
      ['', '', '']
    ]
    
    const wsPlantilla = XLSX.utils.aoa_to_sheet(plantillaData)
    
    // Configurar ancho de columnas
    wsPlantilla['!cols'] = [
      { width: 15 },
      { width: 10 },
      { width: 18 }
    ]
    
    // Agregar comentarios/validaciones en las celdas
    wsPlantilla['A1'].c = [{
      a: 'Sistema',
      t: 'Código único del insumo (ej: INS-0001)'
    }]
    
    wsPlantilla['B1'].c = [{
      a: 'Sistema',
      t: 'Cantidad a abastecer (número entero positivo)'
    }]
    
    wsPlantilla['C1'].c = [{
      a: 'Sistema',
      t: 'Código único del laboratorio (ej: LAB-0001)'
    }]
    
    XLSX.utils.book_append_sheet(wb, wsPlantilla, 'Plantilla Reabastecimiento')
    
    // Hoja 2: Lista de insumos disponibles
    const insumosData = [
      ['CODIGO', 'NOMBRE', 'UNIDAD_MEDIDA'],
      ...insumos.map(i => [i.codigo, i.nombre, i.unidad_medida])
    ]
    
    const wsInsumos = XLSX.utils.aoa_to_sheet(insumosData)
    wsInsumos['!cols'] = [
      { width: 12 },
      { width: 30 },
      { width: 15 }
    ]
    
    XLSX.utils.book_append_sheet(wb, wsInsumos, 'Insumos Disponibles')
    
    // Hoja 3: Lista de laboratorios disponibles
    const laboratoriosData = [
      ['CODIGO', 'NOMBRE'],
      ...laboratorios.map(l => [l.codigo, l.nombre])
    ]
    
    const wsLaboratorios = XLSX.utils.aoa_to_sheet(laboratoriosData)
    wsLaboratorios['!cols'] = [
      { width: 12 },
      { width: 40 }
    ]
    
    XLSX.utils.book_append_sheet(wb, wsLaboratorios, 'Laboratorios Disponibles')
    
    // Generar buffer del archivo
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    
    // Configurar headers para descarga
    res.setHeader('Content-Disposition', 'attachment; filename=plantilla_reabastecimiento.xlsx')
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Length', buffer.length)
    
    console.log('✅ Plantilla Excel generada exitosamente')
    res.send(buffer)
    
  } catch (error) {
    console.error('Error generando plantilla Excel:', error)
    res.status(500).json({
      success: false,
      message: 'Error al generar la plantilla Excel'
    })
  }
}

// Procesar archivo Excel cargado
export const procesarArchivoExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha subido ningún archivo'
      })
    }
    
    console.log('📊 Procesando archivo Excel:', req.file.originalname)
    
    // Leer el archivo Excel desde el buffer
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // Convertir a JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    
    // Validar que tenga datos
    if (jsonData.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'El archivo Excel debe contener al menos una fila de datos además del encabezado'
      })
    }
    
    // Validar encabezados esperados
    const headers = jsonData[0]
    const expectedHeaders = ['CODIGO_INSUMO', 'CANTIDAD', 'CODIGO_LABORATORIO']
    
    const headersValid = expectedHeaders.every(header => 
      headers.some(h => h && h.toString().toUpperCase().includes(header))
    )
    
    if (!headersValid) {
      return res.status(400).json({
        success: false,
        message: 'El archivo debe contener las columnas: CODIGO_INSUMO, CANTIDAD, CODIGO_LABORATORIO'
      })
    }
    
    // Procesar datos
    const datosReabastecimiento = []
    const errores = []
    
    for (let i = 1; i < jsonData.length; i++) {
      const fila = jsonData[i]
      
      // Saltar filas vacías
      if (!fila || fila.every(cell => !cell)) continue
      
      const codigoInsumo = fila[0]?.toString().trim()
      const cantidad = parseInt(fila[1])
      const codigoLaboratorio = fila[2]?.toString().trim()
      
      // Validar datos básicos
      if (!codigoInsumo || !cantidad || !codigoLaboratorio) {
        errores.push(`Fila ${i + 1}: Datos incompletos`)
        continue
      }
      
      if (isNaN(cantidad) || cantidad <= 0) {
        errores.push(`Fila ${i + 1}: La cantidad debe ser un número entero positivo`)
        continue
      }
      
      datosReabastecimiento.push({
        fila: i + 1,
        codigo_insumo: codigoInsumo,
        cantidad: cantidad,
        codigo_laboratorio: codigoLaboratorio
      })
    }
    
    if (datosReabastecimiento.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se encontraron datos válidos para procesar',
        errores: errores
      })
    }
    
    // Validar que los códigos existan en la base de datos
    const codigosInsumos = [...new Set(datosReabastecimiento.map(d => d.codigo_insumo))]
    const codigosLaboratorios = [...new Set(datosReabastecimiento.map(d => d.codigo_laboratorio))]
    
    // Verificar insumos
    const [insumosExistentes] = await pool.execute(`
      SELECT codigo, id, nombre, unidad_medida 
      FROM insumos 
      WHERE codigo IN (${codigosInsumos.map(() => '?').join(',')})
    `, codigosInsumos)
    
    // Verificar laboratorios
    const [laboratoriosExistentes] = await pool.execute(`
      SELECT codigo, id, nombre 
      FROM laboratorios 
      WHERE codigo IN (${codigosLaboratorios.map(() => '?').join(',')})
    `, codigosLaboratorios)
    
    // Crear mapas para búsqueda rápida
    const mapaInsumos = new Map(insumosExistentes.map(i => [i.codigo, i]))
    const mapaLaboratorios = new Map(laboratoriosExistentes.map(l => [l.codigo, l]))
    
    // Validar y enriquecer datos
    const datosValidados = []
    
    for (const dato of datosReabastecimiento) {
      const insumo = mapaInsumos.get(dato.codigo_insumo)
      const laboratorio = mapaLaboratorios.get(dato.codigo_laboratorio)
      
      if (!insumo) {
        errores.push(`Fila ${dato.fila}: Insumo con código "${dato.codigo_insumo}" no encontrado`)
        continue
      }
      
      if (!laboratorio) {
        errores.push(`Fila ${dato.fila}: Laboratorio con código "${dato.codigo_laboratorio}" no encontrado`)
        continue
      }
      
      // Verificar permisos del usuario sobre el laboratorio
      if (req.user.rol === 'Jefe de Laboratorio') {
        if (!req.user.laboratorio_ids.includes(laboratorio.id)) {
          errores.push(`Fila ${dato.fila}: No tienes permisos para abastecer el laboratorio "${laboratorio.nombre}"`)
          continue
        }
      }
      
      datosValidados.push({
        fila: dato.fila,
        insumo_id: insumo.id,
        insumo_codigo: insumo.codigo,
        insumo_nombre: insumo.nombre,
        insumo_unidad: insumo.unidad_medida,
        cantidad: dato.cantidad,
        laboratorio_id: laboratorio.id,
        laboratorio_codigo: laboratorio.codigo,
        laboratorio_nombre: laboratorio.nombre
      })
    }
    
    console.log(`✅ Archivo procesado: ${datosValidados.length} registros válidos, ${errores.length} errores`)
    
    res.json({
      success: true,
      message: 'Archivo procesado exitosamente',
      data: {
        archivo: req.file.originalname,
        total_filas: jsonData.length - 1,
        registros_validos: datosValidados.length,
        registros_con_errores: errores.length,
        datos_validados: datosValidados,
        errores: errores
      }
    })
    
  } catch (error) {
    console.error('Error procesando archivo Excel:', error)
    res.status(500).json({
      success: false,
      message: 'Error al procesar el archivo Excel',
      error: error.message
    })
  }
}

// Ejecutar reabastecimiento masivo
export const ejecutarReabastecimientoMasivo = async (req, res) => {
  const connection = await pool.getConnection()
  
  try {
    await connection.beginTransaction()
    
    const { datos_reabastecimiento, motivo_general = 'Carga masiva desde Excel' } = req.body
    const userId = req.user.userId
    
    console.log('📦 Ejecutando reabastecimiento masivo:', { 
      total_registros: datos_reabastecimiento?.length,
      motivo: motivo_general,
      usuario: userId
    })
    
    if (!datos_reabastecimiento || !Array.isArray(datos_reabastecimiento) || datos_reabastecimiento.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron datos válidos para el reabastecimiento'
      })
    }
    
    let registrosProcesados = 0
    const resultados = []
    
    for (const dato of datos_reabastecimiento) {
      const { insumo_id, cantidad, laboratorio_id, insumo_nombre, laboratorio_nombre } = dato
      
      try {
        // Verificar si ya existe stock para este insumo en este laboratorio
        const [stockExistente] = await connection.execute(
          'SELECT cantidad FROM inventario_insumos WHERE insumo_id = ? AND laboratorio_id = ?',
          [insumo_id, laboratorio_id]
        )
        
        if (stockExistente.length > 0) {
          // Actualizar stock existente
          await connection.execute(`
            UPDATE inventario_insumos 
            SET cantidad = cantidad + ?
            WHERE insumo_id = ? AND laboratorio_id = ?
          `, [cantidad, insumo_id, laboratorio_id])
        } else {
          // Crear nuevo registro de stock
          await connection.execute(`
            INSERT INTO inventario_insumos (insumo_id, laboratorio_id, cantidad)
            VALUES (?, ?, ?)
          `, [insumo_id, laboratorio_id, cantidad])
        }
        
        // Crear fecha en zona horaria de Perú
        const fechaPeru = new Date().toLocaleString('en-CA', { 
          timeZone: 'America/Lima',
          year: 'numeric',
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).replace(', ', ' ')

        // Registrar movimiento
        await connection.execute(`
          INSERT INTO movimientos_insumos 
          (insumo_id, laboratorio_id, tipo_movimiento, cantidad, observaciones, usuario_id, fecha_movimiento)
          VALUES (?, ?, 'entrada', ?, ?, ?, ?)
        `, [insumo_id, laboratorio_id, cantidad, motivo_general, userId, fechaPeru])
        
        registrosProcesados++
        resultados.push({
          insumo: insumo_nombre,
          laboratorio: laboratorio_nombre,
          cantidad: cantidad,
          estado: 'exitoso'
        })
        
        console.log(`✅ Procesado: ${insumo_nombre} +${cantidad} en ${laboratorio_nombre}`)
        
      } catch (error) {
        console.error(`❌ Error procesando ${insumo_nombre}:`, error.message)
        resultados.push({
          insumo: insumo_nombre,
          laboratorio: laboratorio_nombre,
          cantidad: cantidad,
          estado: 'error',
          error: error.message
        })
      }
    }
    
    await connection.commit()
    
    console.log(`🎉 Reabastecimiento masivo completado: ${registrosProcesados}/${datos_reabastecimiento.length} registros`)
    
    res.json({
      success: true,
      message: `Reabastecimiento masivo completado exitosamente`,
      data: {
        total_registros: datos_reabastecimiento.length,
        registros_procesados: registrosProcesados,
        registros_fallidos: datos_reabastecimiento.length - registrosProcesados,
        motivo: motivo_general,
        resultados: resultados
      }
    })
    
  } catch (error) {
    await connection.rollback()
    console.error('❌ Error en reabastecimiento masivo:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno al ejecutar el reabastecimiento masivo',
      error: error.message
    })
  } finally {
    connection.release()
  }
}// Actualizar insumo
// Eliminar insumo
export const deleteInsumo = async (req, res) => {
  const connection = await pool.getConnection()
  
  try {
    await connection.beginTransaction()
    
    const { id } = req.params
    const insumoId = parseInt(id, 10)
    
    console.log('🗑️ Eliminando insumo:', insumoId)
    
    // Validar ID
    if (isNaN(insumoId) || insumoId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de insumo inválido'
      })
    }
    
    // Verificar que el insumo existe
    const [existingInsumo] = await connection.execute(
      'SELECT id, nombre FROM insumos WHERE id = ?',
      [insumoId]
    )
    
    if (existingInsumo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Insumo no encontrado'
      })
    }

    // Verificar si hay movimientos asociados
    const [movimientos] = await connection.execute(
      'SELECT COUNT(*) as total FROM movimientos_insumos WHERE insumo_id = ?',
      [insumoId]
    )

    if (movimientos[0].total > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el insumo porque tiene movimientos registrados'
      })
    }

    // Eliminar registros relacionados en orden
    await connection.execute('DELETE FROM inventario_insumos WHERE insumo_id = ?', [insumoId])
    await connection.execute('DELETE FROM insumos WHERE id = ?', [insumoId])
    
    await connection.commit()
    
    console.log('✅ Insumo eliminado exitosamente:', insumoId)
    
    res.json({
      success: true,
      message: 'Insumo eliminado exitosamente'
    })
    
  } catch (error) {
    await connection.rollback()
    console.error('❌ Error al eliminar insumo:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno al eliminar el insumo'
    })
  } finally {
    connection.release()
  }
}

// Generar plantilla Excel para importación masiva de insumos
export const generarPlantillaImportacion = async (req, res) => {
  try {
    console.log('📊 Generando plantilla Excel para importación masiva de insumos...')
    
    // Obtener laboratorios para referencia
    const [laboratorios] = await pool.execute(`
      SELECT id, codigo, nombre 
      FROM laboratorios 
      ORDER BY codigo
    `)
    
    // Crear workbook
    const wb = XLSX.utils.book_new()
    
    // Hoja 1: Plantilla de insumos
    const plantillaData = [
      [
        'NOMBRE',
        'DESCRIPCION', 
        'UNIDAD_MEDIDA',
        'CATEGORIA',
        'PRESENTACION',
        'CONDICION',
        'FECHA_VENCIMIENTO',
        'OBSERVACION',
        'STOCK_LAB_1',
        'STOCK_LAB_2',
        'STOCK_LAB_3'
      ],
      [
        'Alcohol etílico 70%',
        'Alcohol para desinfección y limpieza',
        'Litros',
        'Reactivos',
        'Frasco 1L',
        'Bueno',
        '2025-12-31',
        'Mantener en lugar fresco y seco',
        '10',
        '5',
        '0'
      ],
      [
        'Jeringas desechables 10ml',
        'Jeringas estériles para procedimientos',
        'Unidades',
        'Materiales',
        'Caja x 100 unidades',
        'Excelente',
        '',
        'Verificar fecha de vencimiento',
        '200',
        '150',
        '100'
      ],
      [
        'Cultivo bacteriano E.coli',
        'Cultivo para prácticas de microbiología',
        'Placas',
        'Material_Biologico',
        'Placa Petri',
        'Bueno',
        '2025-06-30',
        'Mantener refrigerado a 4°C',
        '5',
        '3',
        '2'
      ]
    ]
    
    const wsPlantilla = XLSX.utils.aoa_to_sheet(plantillaData)
    
    // Configurar ancho de columnas
    wsPlantilla['!cols'] = [
      { width: 25 }, // NOMBRE
      { width: 35 }, // DESCRIPCION
      { width: 15 }, // UNIDAD_MEDIDA
      { width: 18 }, // CATEGORIA
      { width: 20 }, // PRESENTACION
      { width: 12 }, // CONDICION
      { width: 18 }, // FECHA_VENCIMIENTO
      { width: 30 }, // OBSERVACION
      { width: 12 }, // STOCK_LAB_1
      { width: 12 }, // STOCK_LAB_2
      { width: 12 }  // STOCK_LAB_3
    ]
    
    XLSX.utils.book_append_sheet(wb, wsPlantilla, 'Plantilla Insumos')
    
    // Hoja 2: Instrucciones y validaciones
    const instruccionesData = [
      ['INSTRUCCIONES PARA IMPORTACIÓN MASIVA DE INSUMOS'],
      [''],
      ['COLUMNAS OBLIGATORIAS:'],
      ['• NOMBRE: Nombre del insumo (texto, máximo 255 caracteres)'],
      ['• UNIDAD_MEDIDA: Unidad de medida (ej: Litros, Unidades, Gramos, ml)'],
      [''],
      ['COLUMNAS OPCIONALES:'],
      ['• DESCRIPCION: Descripción detallada del insumo'],
      ['• CATEGORIA: Reactivos | Materiales | Material_Biologico (por defecto: Materiales)'],
      ['• PRESENTACION: Formato de presentación (ej: Frasco 500ml, Caja x 100)'],
      ['• CONDICION: Excelente | Bueno | Regular | Malo (por defecto: Bueno)'],
      ['• FECHA_VENCIMIENTO: Formato YYYY-MM-DD (ej: 2025-12-31)'],
      ['• OBSERVACION: Observaciones adicionales'],
      ['• STOCK_LAB_X: Stock inicial por laboratorio (números enteros)'],
      [''],
      ['LABORATORIOS DISPONIBLES:'],
      ['ID', 'CODIGO', 'NOMBRE'],
      ...laboratorios.map(lab => [lab.id, lab.codigo, lab.nombre]),
      [''],
      ['NOTAS IMPORTANTES:'],
      ['• Los códigos de insumos se generan automáticamente'],
      ['• Las fechas deben estar en formato YYYY-MM-DD'],
      ['• El stock por laboratorio es opcional (0 por defecto)'],
      ['• Las categorías deben ser exactamente: Reactivos, Materiales o Material_Biologico'],
      ['• Las condiciones deben ser: Excelente, Bueno, Regular o Malo'],
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
    res.setHeader('Content-Disposition', `attachment; filename=plantilla_insumos_${timestamp}.xlsx`)
    res.send(buffer)
    
    console.log('✅ Plantilla Excel generada y enviada')
    
  } catch (error) {
    console.error('❌ Error al generar plantilla Excel:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error al generar la plantilla Excel' 
    })
  }
}

// Previsualizar importación masiva de insumos
export const previsualizarImportacionMasiva = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ningún archivo'
      })
    }
    
    console.log('📊 Previsualizando importación masiva de insumos...')
    console.log('📁 Archivo recibido:', req.file.originalname, 'Tamaño:', req.file.size)
    
    // Leer archivo Excel
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)
    
    console.log('📋 Registros encontrados en Excel:', data.length)
    
    if (data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El archivo Excel está vacío o no tiene el formato correcto'
      })
    }
    
    // Obtener laboratorios existentes
    const [laboratorios] = await pool.execute('SELECT id, codigo, nombre FROM laboratorios ORDER BY id')
    
    const previewData = []
    const erroresGenerales = []
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 2 // +2 porque Excel empieza en 1 y tenemos header
      const erroresFila = []
      
      // Validar y limpiar datos
      const nombre = row.NOMBRE ? row.NOMBRE.toString().trim() : ''
      const descripcion = row.DESCRIPCION ? row.DESCRIPCION.toString().trim() : ''
      const unidad_medida = row.UNIDAD_MEDIDA ? row.UNIDAD_MEDIDA.toString().trim() : ''
      const categoria = row.CATEGORIA ? row.CATEGORIA.toString().trim() : 'Materiales'
      const presentacion = row.PRESENTACION ? row.PRESENTACION.toString().trim() : ''
      const condicion = row.CONDICION ? row.CONDICION.toString().trim() : 'Bueno'
      const observacion = row.OBSERVACION ? row.OBSERVACION.toString().trim() : ''
      
      // Validar campos obligatorios
      if (!nombre) {
        erroresFila.push('NOMBRE es obligatorio')
      }
      if (!unidad_medida) {
        erroresFila.push('UNIDAD_MEDIDA es obligatorio')
      }
      
      // Validar fecha de vencimiento
      let fecha_vencimiento = ''
      if (row.FECHA_VENCIMIENTO) {
        const fechaStr = row.FECHA_VENCIMIENTO.toString().trim()
        if (fechaStr) {
          const fecha = new Date(fechaStr)
          if (!isNaN(fecha.getTime())) {
            fecha_vencimiento = fecha.toISOString().split('T')[0]
          } else {
            erroresFila.push('Fecha de vencimiento inválida (use formato YYYY-MM-DD)')
          }
        }
      }
      
      // Validar categoría
      const categoriasValidas = ['Reactivos', 'Materiales', 'Material_Biologico']
      if (!categoriasValidas.includes(categoria)) {
        erroresFila.push(`Categoría inválida. Debe ser: ${categoriasValidas.join(', ')}`)
      }
      
      // Validar condición
      const condicionesValidas = ['Excelente', 'Bueno', 'Regular', 'Malo']
      if (!condicionesValidas.includes(condicion)) {
        erroresFila.push(`Condición inválida. Debe ser: ${condicionesValidas.join(', ')}`)
      }
      
      // Procesar stock por laboratorio
      const stock_labs = {}
      for (let labId = 1; labId <= laboratorios.length; labId++) {
        const stockColumn = `STOCK_LAB_${labId}`
        if (row[stockColumn] && !isNaN(parseInt(row[stockColumn]))) {
          const cantidad = parseInt(row[stockColumn])
          if (cantidad > 0) {
            const lab = laboratorios.find(l => l.id === labId)
            if (lab) {
              stock_labs[lab.nombre] = cantidad
            }
          }
        }
      }
      
      previewData.push({
        fila: rowNum,
        nombre,
        descripcion,
        unidad_medida,
        categoria,
        presentacion,
        condicion,
        fecha_vencimiento,
        observacion,
        stock_labs,
        errores: erroresFila
      })
    }
    
    console.log(`📊 Previsualización completada: ${previewData.length} filas procesadas`)
    
    res.json({
      success: true,
      data: previewData,
      total_filas: previewData.length,
      errores_generales: erroresGenerales
    })
    
  } catch (error) {
    console.error('❌ Error en previsualización de insumos:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error interno en la previsualización',
      error: error.message
    })
  }
}

// Importación masiva de insumos desde Excel
export const importacionMasiva = async (req, res) => {
  const connection = await pool.getConnection()
  
  try {
    await connection.beginTransaction()
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ningún archivo'
      })
    }
    
    console.log('📊 Procesando importación masiva de insumos...')
    console.log('📁 Archivo recibido:', req.file.originalname, 'Tamaño:', req.file.size)
    
    // Leer archivo Excel
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)
    
    console.log('📋 Registros encontrados en Excel:', data.length)
    
    if (data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El archivo Excel está vacío o no tiene el formato correcto'
      })
    }
    
    // Obtener laboratorios existentes
    const [laboratorios] = await connection.execute('SELECT id, codigo, nombre FROM laboratorios ORDER BY id')
    const labMap = new Map(laboratorios.map(lab => [lab.id, lab]))
    
    let procesados = 0
    let errores = []
    const resultados = []
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 2 // +2 porque Excel empieza en 1 y tenemos header
      
      try {
        // Validar campos obligatorios
        if (!row.NOMBRE || !row.UNIDAD_MEDIDA) {
          errores.push(`Fila ${rowNum}: NOMBRE y UNIDAD_MEDIDA son obligatorios`)
          continue
        }
        
        // Limpiar y validar datos
        const nombre = row.NOMBRE.toString().trim()
        const descripcion = row.DESCRIPCION ? row.DESCRIPCION.toString().trim() : ''
        const unidad_medida = row.UNIDAD_MEDIDA.toString().trim()
        const categoria = row.CATEGORIA ? row.CATEGORIA.toString().trim() : 'Materiales'
        const presentacion = row.PRESENTACION ? row.PRESENTACION.toString().trim() : ''
        const condicion = row.CONDICION ? row.CONDICION.toString().trim() : 'Bueno'
        const observacion = row.OBSERVACION ? row.OBSERVACION.toString().trim() : ''
        
        // Validar fecha de vencimiento
        let fecha_vencimiento = null
        if (row.FECHA_VENCIMIENTO) {
          const fechaStr = row.FECHA_VENCIMIENTO.toString().trim()
          if (fechaStr) {
            // Intentar parsear diferentes formatos de fecha
            const fecha = new Date(fechaStr)
            if (!isNaN(fecha.getTime())) {
              fecha_vencimiento = fecha.toISOString().split('T')[0]
            } else {
              errores.push(`Fila ${rowNum}: Fecha de vencimiento inválida (use formato YYYY-MM-DD)`)
              continue
            }
          }
        }
        
        // Validar categoría
        const categoriasValidas = ['Reactivos', 'Materiales', 'Material_Biologico']
        if (!categoriasValidas.includes(categoria)) {
          errores.push(`Fila ${rowNum}: Categoría inválida. Debe ser: ${categoriasValidas.join(', ')}`)
          continue
        }
        
        // Validar condición
        const condicionesValidas = ['Excelente', 'Bueno', 'Regular', 'Malo']
        if (!condicionesValidas.includes(condicion)) {
          errores.push(`Fila ${rowNum}: Condición inválida. Debe ser: ${condicionesValidas.join(', ')}`)
          continue
        }
        
        // Generar código único
        let codigo
        let intentos = 0
        const maxIntentos = 10
        
        do {
          const [maxId] = await connection.execute('SELECT MAX(id) as max_id FROM insumos')
          const nextId = (maxId[0].max_id || 0) + procesados + 1 + intentos
          codigo = `INS-${nextId.toString().padStart(4, '0')}`
          
          // Verificar si el código ya existe
          const [existing] = await connection.execute('SELECT id FROM insumos WHERE codigo = ?', [codigo])
          
          if (existing.length === 0) {
            break // Código único encontrado
          }
          
          intentos++
        } while (intentos < maxIntentos)
        
        if (intentos >= maxIntentos) {
          errores.push(`Fila ${rowNum}: No se pudo generar un código único para el insumo`)
          continue
        }
        
        // Crear el insumo
        const [insumoResult] = await connection.execute(`
          INSERT INTO insumos (codigo, nombre, descripcion, unidad_medida, categoria, presentacion, condicion, fecha_vencimiento, observacion) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [codigo, nombre, descripcion, unidad_medida, categoria, presentacion, condicion, fecha_vencimiento, observacion])
        
        const insumo_id = insumoResult.insertId
        
        // Procesar stock por laboratorio
        const stockInfo = []
        for (let labId = 1; labId <= laboratorios.length; labId++) {
          const stockColumn = `STOCK_LAB_${labId}`
          if (row[stockColumn] && !isNaN(parseInt(row[stockColumn]))) {
            const cantidad = parseInt(row[stockColumn])
            if (cantidad > 0 && labMap.has(labId)) {
              // Crear registro de inventario
              await connection.execute(`
                INSERT INTO inventario_insumos (insumo_id, laboratorio_id, cantidad)
                VALUES (?, ?, ?)
              `, [insumo_id, labId, cantidad])
              
              // Crear fecha en zona horaria de Perú
              const fechaPeru = new Date().toLocaleString('en-CA', { 
                timeZone: 'America/Lima',
                year: 'numeric',
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              }).replace(', ', ' ')
              
              // Registrar movimiento
              await connection.execute(`
                INSERT INTO movimientos_insumos 
                (insumo_id, laboratorio_id, usuario_id, tipo_movimiento, cantidad, observaciones, fecha_movimiento)
                VALUES (?, ?, ?, 'entrada', ?, ?, ?)
              `, [insumo_id, labId, req.user.userId, cantidad, 'Importación masiva', fechaPeru])
              
              stockInfo.push(`${labMap.get(labId).nombre}: ${cantidad}`)
            }
          }
        }
        
        resultados.push({
          fila: rowNum,
          codigo: codigo,
          nombre: nombre,
          categoria: categoria,
          stock: stockInfo.join(', ') || 'Sin stock inicial'
        })
        
        procesados++
        
      } catch (error) {
        console.error(`❌ Error procesando fila ${rowNum}:`, error)
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
    
    console.log(`✅ Importación completada: ${procesados} insumos creados, ${errores.length} errores`)
    
    res.json({
      success: true,
      message: `Importación completada: ${procesados} insumos creados`,
      procesados: procesados,
      errores: errores.length,
      detalles_errores: errores,
      resultados: resultados
    })
    
  } catch (error) {
    await connection.rollback()
    console.error('❌ Error en importación masiva:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error interno en la importación masiva',
      error: error.message
    })
  } finally {
    connection.release()
  }
}

export const updateInsumo = async (req, res) => {
  try {
    const { id } = req.params
    const insumoId = parseInt(id, 10) // Convertir a número entero
    const { nombre, descripcion, unidad_medida, categoria, presentacion, condicion, fecha_vencimiento, observacion } = req.body
    
    // Limpiar espacios en blanco
    const nombreLimpio = nombre?.trim()
    const descripcionLimpia = descripcion?.trim()
    const unidadLimpia = unidad_medida?.trim()
    const presentacionLimpia = presentacion?.trim()
    const observacionLimpia = observacion?.trim()
    
    console.log('🔄 Actualizando insumo:', { id, insumoId, nombre: nombreLimpio, descripcion: descripcionLimpia, unidad_medida: unidadLimpia })
    
    // Validar ID
    if (isNaN(insumoId) || insumoId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de insumo inválido'
      })
    }
    
    // Validar datos
    if (!nombreLimpio || !unidadLimpia) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y unidad de medida son requeridos'
      })
    }
    
    // Verificar que el insumo existe
    const [existingInsumo] = await pool.execute(
      'SELECT id FROM insumos WHERE id = ?',
      [insumoId]
    )
    
    if (existingInsumo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Insumo no encontrado'
      })
    }
    
    // Validación de duplicados deshabilitada para permitir edición libre
    console.log('ℹ️ Validación de duplicados omitida - permitiendo edición libre')
    
    // Actualizar insumo
    await pool.execute(`
      UPDATE insumos 
      SET nombre = ?, descripcion = ?, unidad_medida = ?, categoria = ?, presentacion = ?, condicion = ?, fecha_vencimiento = ?, observacion = ?
      WHERE id = ?
    `, [nombreLimpio, descripcionLimpia || '', unidadLimpia, categoria || 'Materiales', presentacionLimpia || '', condicion || 'Bueno', fecha_vencimiento || null, observacionLimpia || '', insumoId])
    
    console.log('✅ Insumo actualizado exitosamente:', insumoId)
    
    res.json({
      success: true,
      message: 'Insumo actualizado exitosamente',
      data: { id: insumoId, nombre: nombreLimpio, descripcion: descripcionLimpia, unidad_medida: unidadLimpia }
    })
    
  } catch (error) {
    console.error('❌ Error al actualizar insumo:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}
