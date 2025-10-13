import { pool } from '../config/database.js'
import { Equipo } from '../models/Equipo.js'
import XLSX from 'xlsx'

export const getEquipos = async (req, res) => {
  try {
    const { laboratorio_id } = req.query
    
    console.log('🔍 getEquipos - Parámetros:', { 
      laboratorio_id, 
      user_role: req.user.rol, 
      user_laboratorio_ids: req.user.laboratorio_ids 
    })
    
    let equipos = []
    
    // Si se especifica un laboratorio específico
    if (laboratorio_id) {
      const labId = parseInt(laboratorio_id)
      
      // Verificar permisos
      if (req.user.rol === 'Administrador' || req.user.laboratorio_ids.includes(labId)) {
        console.log('✅ Usuario autorizado para ver equipos del laboratorio:', labId)
        equipos = await Equipo.getByLaboratorio(labId)
        console.log('🔧 Equipos encontrados:', equipos.length)
      } else {
        console.log('❌ Usuario no autorizado para ver equipos del laboratorio:', labId)
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permisos para ver los equipos de este laboratorio' 
        })
      }
    } else {
      // Sin laboratorio específico, devolver todos según rol
      if (req.user.rol === 'Jefe de Laboratorio') {
        // Solo equipos de sus laboratorios
        for (const labId of req.user.laboratorio_ids) {
          const equiposLab = await Equipo.getByLaboratorio(labId)
          equipos = [...equipos, ...equiposLab]
        }
      } else if (req.user.rol === 'Administrador') {
        // Todos los equipos con información de inventario
        const [rows] = await pool.execute(`
          SELECT e.*, 
                 GROUP_CONCAT(CONCAT(l.nombre, ':', COALESCE(ie.cantidad_disponible, 0), '/', COALESCE(ie.cantidad_total, 0)) SEPARATOR '; ') as inventario_por_laboratorio
          FROM equipos e
          LEFT JOIN inventario_equipos ie ON e.id = ie.equipo_id
          LEFT JOIN laboratorios l ON ie.laboratorio_id = l.id
          GROUP BY e.id, e.codigo, e.nombre, e.descripcion, e.marca, e.modelo, e.numero_serie, e.estado, e.fecha_ultimo_mantenimiento, e.fecha_proximo_mantenimiento, e.comentarios, e.condicion, e.fecha_adquisicion
          ORDER BY e.codigo, e.nombre
        `)
        equipos = rows
      }
    }
    
    res.json({ 
      success: true, 
      data: equipos,
      laboratorio_filtrado: laboratorio_id || null,
      total_equipos: equipos.length
    })
  } catch (error) {
    console.error('Error en getEquipos:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// Obtener equipos sin agrupar (vista simple para gestión individual)
export const getEquiposSimple = async (req, res) => {
  try {
    const { laboratorio_id } = req.query
    
    console.log('🔍 getEquiposSimple - Parámetros:', { 
      laboratorio_id,
      user_role: req.user.rol, 
      user_laboratorio_ids: req.user.laboratorio_ids 
    })
    
    let query = `
      SELECT 
        e.id,
        e.codigo,
        e.nombre,
        e.descripcion,
        e.marca,
        e.modelo,
        e.numero_serie,
        e.estado,
        e.fecha_ultimo_mantenimiento,
        e.fecha_proximo_mantenimiento,
        e.comentarios,
        e.condicion,
        e.fecha_adquisicion,
        (SELECT COUNT(*) FROM movimientos_equipos me WHERE me.equipo_id = e.id) as total_movimientos,
        (SELECT COUNT(*) FROM inventario_equipos ie WHERE ie.equipo_id = e.id) as laboratorios_asignados,
        (SELECT GROUP_CONCAT(l.nombre SEPARATOR ', ') 
         FROM inventario_equipos ie 
         JOIN laboratorios l ON ie.laboratorio_id = l.id 
         WHERE ie.equipo_id = e.id) as laboratorios_nombres
      FROM equipos e
    `
    
    const params = []
    
    if (req.user.rol === 'Jefe de Laboratorio') {
      // Solo equipos de sus laboratorios
      query += ` WHERE EXISTS (
        SELECT 1 FROM inventario_equipos ie 
        WHERE ie.equipo_id = e.id 
        AND ie.laboratorio_id IN (${req.user.laboratorio_ids.join(',')})
      )`
    }
    
    if (laboratorio_id) {
      const labId = parseInt(laboratorio_id)
      if (req.user.rol === 'Administrador' || req.user.laboratorio_ids.includes(labId)) {
        query += req.user.rol === 'Jefe de Laboratorio' ? ' AND' : ' WHERE'
        query += ` EXISTS (
          SELECT 1 FROM inventario_equipos ie 
          WHERE ie.equipo_id = e.id AND ie.laboratorio_id = ?
        )`
        params.push(labId)
      } else {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permisos para ver los equipos de este laboratorio' 
        })
      }
    }
    
    query += ' ORDER BY e.codigo, e.nombre'
    
    const [equipos] = await pool.execute(query, params)
    
    console.log('📊 Equipos simples encontrados:', equipos.length)
    
    res.json({ 
      success: true, 
      data: equipos,
      total: equipos.length,
      vista: 'simple',
      laboratorio_filtrado: laboratorio_id || null
    })
    
  } catch (error) {
    console.error('Error en getEquiposSimple:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

export const createEquipo = async (req, res) => {
  const connection = await pool.getConnection()
  
  try {
    await connection.beginTransaction()
    
    const { 
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
      inventario_inicial = []
    } = req.body
    
    console.log('🔍 Creando equipo:', req.body)
    
    // Generar código único para el equipo
    let codigo
    let intentos = 0
    const maxIntentos = 10
    
    do {
      const [maxId] = await connection.execute('SELECT MAX(id) as max_id FROM equipos')
      const nextId = (maxId[0].max_id || 0) + 1 + intentos
      codigo = `EQP-${nextId.toString().padStart(4, '0')}`
      
      // Verificar si el código ya existe
      const [existing] = await connection.execute('SELECT id FROM equipos WHERE codigo = ?', [codigo])
      
      if (existing.length === 0) {
        break // Código único encontrado
      }
      
      intentos++
      console.log(`⚠️ Código ${codigo} ya existe, intentando con siguiente...`)
    } while (intentos < maxIntentos)
    
    if (intentos >= maxIntentos) {
      throw new Error('No se pudo generar un código único para el equipo')
    }
    
    console.log(`✅ Código único generado: ${codigo}`)
    
    // Crear el equipo
    const [equipoResult] = await connection.execute(`
      INSERT INTO equipos (codigo, nombre, descripcion, marca, modelo, numero_serie, estado, fecha_ultimo_mantenimiento, fecha_proximo_mantenimiento, comentarios, condicion, fecha_adquisicion) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [codigo, nombre, descripcion, marca, modelo, numero_serie, estado, fecha_ultimo_mantenimiento, fecha_proximo_mantenimiento, comentarios, condicion, fecha_adquisicion || null])
    
    const equipo_id = equipoResult.insertId
    console.log('✅ Equipo creado con ID:', equipo_id)
    
    // Agregar inventario inicial (si se proporciona)
    if (inventario_inicial && inventario_inicial.length > 0) {
      for (const inventario of inventario_inicial) {
        const { laboratorio_id, cantidad_total, observaciones = 'Inventario inicial' } = inventario
        
        // Verificar permisos del laboratorio
        if (req.user.rol === 'Jefe de Laboratorio') {
          if (!req.user.laboratorio_ids.includes(parseInt(laboratorio_id))) {
            await connection.rollback()
            return res.status(403).json({ 
              success: false, 
              message: `No puedes agregar equipos al laboratorio ${laboratorio_id}` 
            })
          }
        }
        
        console.log(`🔄 Agregando inventario: Lab ${laboratorio_id}, Cantidad ${cantidad_total}`)
        
        // Crear entrada en inventario
        await connection.execute(`
          INSERT INTO inventario_equipos (equipo_id, laboratorio_id, cantidad_total, cantidad_disponible, cantidad_en_uso)
          VALUES (?, ?, ?, ?, 0)
        `, [equipo_id, laboratorio_id, cantidad_total, cantidad_total])
        
        // Registrar movimiento de entrada
        await connection.execute(`
          INSERT INTO movimientos_equipos 
          (equipo_id, laboratorio_id, usuario_id, tipo_movimiento, cantidad, observaciones)
          VALUES (?, ?, ?, 'entrada', ?, ?)
        `, [equipo_id, laboratorio_id, req.user.userId, cantidad_total, observaciones])
      }
    }
    
    await connection.commit()
    
    // Registrar actividad de creación
    await registrarActividadEquipo({
      accion: 'crear',
      equipo_id: equipo_id,
      descripcion: `Equipo creado: ${nombre} (${codigo}) - Marca: ${marca || 'N/A'}, Modelo: ${modelo || 'N/A'}, Estado: ${estado}, Condición: ${condicion}. Inventario inicial en ${inventario_inicial.length} laboratorio(s).`,
      usuario_id: req.user.userId,
      ip_address: req.ip || req.connection.remoteAddress
    })
    
    res.json({ 
      success: true, 
      message: 'Equipo creado con inventario inicial',
      equipo_id: equipo_id,
      laboratorios_con_inventario: inventario_inicial.length
    })
    
  } catch (error) {
    await connection.rollback()
    console.error('Error en createEquipo:', error)
    res.status(500).json({ success: false, message: error.message })
  } finally {
    connection.release()
  }
}

export const updateEquipo = async (req, res) => {
  try {
    const { id } = req.params
    const equipoId = parseInt(id, 10)
    const { nombre, descripcion, marca, modelo, numero_serie, estado, fecha_ultimo_mantenimiento, fecha_proximo_mantenimiento, comentarios, condicion, fecha_adquisicion } = req.body
    
    console.log('🔄 Actualizando equipo:', { id, equipoId, nombre, marca, modelo })
    
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
    
    // Verificar que el equipo existe
    const [existingEquipo] = await pool.execute(
      'SELECT id FROM equipos WHERE id = ?',
      [equipoId]
    )
    
    if (existingEquipo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado'
      })
    }
    
    // Actualizar equipo
    await pool.execute(`
      UPDATE equipos 
      SET nombre = ?, descripcion = ?, marca = ?, modelo = ?, numero_serie = ?, estado = ?, fecha_ultimo_mantenimiento = ?, fecha_proximo_mantenimiento = ?, comentarios = ?, condicion = ?, fecha_adquisicion = ?
      WHERE id = ?
    `, [nombre.trim(), descripcion?.trim() || '', marca?.trim() || '', modelo?.trim() || '', numero_serie?.trim() || '', estado || 'Operativo', fecha_ultimo_mantenimiento, fecha_proximo_mantenimiento, comentarios?.trim() || '', condicion || 'Bueno', fecha_adquisicion || null, equipoId])
    
    console.log('✅ Equipo actualizado exitosamente:', equipoId)
    
    // Registrar actividad de actualización
    await registrarActividadEquipo({
      accion: 'actualizar',
      equipo_id: equipoId,
      descripcion: `Equipo actualizado: ${nombre.trim()} - Marca: ${marca?.trim() || 'N/A'}, Modelo: ${modelo?.trim() || 'N/A'}, Estado: ${estado || 'Operativo'}, Condición: ${condicion || 'Bueno'}. Último mant.: ${fecha_ultimo_mantenimiento || 'N/A'}, Próximo mant.: ${fecha_proximo_mantenimiento || 'N/A'}.`,
      usuario_id: req.user.userId,
      ip_address: req.ip || req.connection.remoteAddress
    })
    
    res.json({
      success: true,
      message: 'Equipo actualizado exitosamente',
      data: { id: equipoId, nombre: nombre.trim(), descripcion, marca, modelo, numero_serie, estado }
    })
    
  } catch (error) {
    console.error('❌ Error al actualizar equipo:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

export const deleteEquipo = async (req, res) => {
  const connection = await pool.getConnection()
  
  try {
    await connection.beginTransaction()
    
    const { id } = req.params
    const equipoId = parseInt(id, 10)
    
    console.log('🗑️ Eliminando equipo:', equipoId)
    
    // Validar ID
    if (isNaN(equipoId) || equipoId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de equipo inválido'
      })
    }
    
    // Verificar que el equipo existe y capturar información completa
    const [existingEquipo] = await connection.execute(
      'SELECT id, codigo, nombre, marca, modelo, estado, condicion FROM equipos WHERE id = ?',
      [equipoId]
    )
    
    if (existingEquipo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado'
      })
    }

    // Verificar si hay movimientos asociados y obtener información
    const [movimientos] = await connection.execute(
      'SELECT COUNT(*) as total FROM movimientos_equipos WHERE equipo_id = ?',
      [equipoId]
    )

    const [reservasActivas] = await connection.execute(
      'SELECT COUNT(*) as total FROM detalle_reserva_equipos dre JOIN reservas r ON dre.reserva_id = r.id WHERE dre.equipo_id = ? AND r.fecha_fin > NOW()',
      [equipoId]
    )

    // Verificar si el equipo está siendo usado en reservas activas
    if (reservasActivas[0].total > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el equipo porque está siendo usado en horarios/reservas activas. Espera a que terminen las reservas.'
      })
    }

    // Capturar información del equipo antes de eliminar
    const equipoInfo = existingEquipo[0]
    const totalMovimientos = movimientos[0].total
    
    // Eliminar registros relacionados en orden (incluyendo movimientos)
    console.log(`🗑️ Eliminando ${totalMovimientos} movimientos del equipo ${equipoInfo.codigo}`)
    await connection.execute('DELETE FROM detalle_reserva_equipos WHERE equipo_id = ?', [equipoId])
    await connection.execute('DELETE FROM movimientos_equipos WHERE equipo_id = ?', [equipoId])
    await connection.execute('DELETE FROM inventario_equipos WHERE equipo_id = ?', [equipoId])
    await connection.execute('DELETE FROM equipos WHERE id = ?', [equipoId])
    
    await connection.commit()
    
    // Registrar actividad de eliminación
    await registrarActividadEquipo({
      accion: 'eliminar',
      equipo_id: null, // No hay equipo_id porque ya fue eliminado
      descripcion: `Equipo eliminado: ${equipoInfo.nombre} (${equipoInfo.codigo || 'N/A'}) - Marca: ${equipoInfo.marca || 'N/A'}, Modelo: ${equipoInfo.modelo || 'N/A'}, Estado: ${equipoInfo.estado || 'N/A'}, Condición: ${equipoInfo.condicion || 'N/A'}. Se eliminaron ${totalMovimientos} movimientos asociados.`,
      usuario_id: req.user.userId,
      ip_address: req.ip || req.connection.remoteAddress
    })
    
    console.log('✅ Equipo eliminado exitosamente:', equipoId)
    
    res.json({
      success: true,
      message: `Equipo eliminado exitosamente${totalMovimientos > 0 ? ` (se eliminaron ${totalMovimientos} movimientos asociados)` : ''}`
    })
    
  } catch (error) {
    await connection.rollback()
    console.error('❌ Error al eliminar equipo:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno al eliminar el equipo'
    })
  } finally {
    connection.release()
  }
}

// 📋 FUNCIÓN AUXILIAR PARA REGISTRAR ACTIVIDAD
const registrarActividadEquipo = async ({ accion, equipo_id, descripcion, usuario_id, ip_address }) => {
  try {
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
    
    const query = `
      INSERT INTO actividad_equipos (
        accion, equipo_id, descripcion, usuario_id, ip_address, fecha_actividad
      ) VALUES (?, ?, ?, ?, ?, ?)
    `
    
    await pool.execute(query, [accion, equipo_id, descripcion, usuario_id, ip_address, fechaPeru])
    console.log(`📋 Actividad de equipo registrada: ${accion} - ${descripcion} (${fechaPeru})`)
  } catch (error) {
    console.error('❌ Error al registrar actividad de equipo:', error)
    // No lanzamos el error para no interrumpir la operación principal
  }
}

// Obtener actividad de equipos (CRUD + movimientos)
export const getActividadEquipos = async (req, res) => {
  try {
    const { laboratorio_id, fecha_inicio, fecha_fin, tipo_actividad } = req.query
    
    console.log('🔍 getActividadEquipos - Parámetros:', { 
      laboratorio_id, 
      fecha_inicio, 
      fecha_fin, 
      tipo_actividad,
      user_role: req.user.rol, 
      user_laboratorio_ids: req.user.laboratorio_ids 
    })
    
    // Consulta para actividad de CRUD (crear, actualizar, eliminar)
    let queryCRUD = `
      SELECT 
        'crud' as tipo_registro,
        a.id,
        a.accion as tipo_movimiento,
        a.fecha_actividad as fecha_movimiento,
        a.descripcion as observaciones,
        a.equipo_codigo,
        a.equipo_nombre,
        a.equipo_marca,
        a.equipo_modelo,
        a.usuario_nombre,
        a.usuario_rol,
        NULL as laboratorio_nombre,
        NULL as cantidad,
        NULL as reserva_descripcion
      FROM vista_actividad_equipos a
      WHERE 1=1
    `
    
    // Consulta para movimientos de equipos (reservas, devoluciones)
    let queryMovimientos = `
      SELECT 
        'movimiento' as tipo_registro,
        m.id,
        m.tipo_movimiento,
        m.fecha_movimiento,
        m.observaciones,
        e.codigo as equipo_codigo,
        e.nombre as equipo_nombre,
        e.marca as equipo_marca,
        e.modelo as equipo_modelo,
        u.nombre_completo as usuario_nombre,
        r.nombre as usuario_rol,
        l.nombre as laboratorio_nombre,
        m.cantidad,
        res.descripcion as reserva_descripcion
      FROM movimientos_equipos m
      INNER JOIN equipos e ON m.equipo_id = e.id
      INNER JOIN laboratorios l ON m.laboratorio_id = l.id
      INNER JOIN usuarios u ON m.usuario_id = u.id
      INNER JOIN roles r ON u.rol_id = r.id
      LEFT JOIN reservas res ON m.reserva_id = res.id
      WHERE 1=1
    `
    
    const params = []
    
    // Filtros según permisos del usuario
    if (req.user.rol === 'Jefe de Laboratorio') {
      // Para movimientos, filtrar por laboratorios del usuario
      queryMovimientos += ` AND m.laboratorio_id IN (${req.user.laboratorio_ids.join(',')})`
    }
    
    // Filtros opcionales para ambas consultas
    if (laboratorio_id) {
      queryMovimientos += ` AND m.laboratorio_id = ?`
      params.push(laboratorio_id)
    }
    
    if (fecha_inicio) {
      queryCRUD += ` AND DATE(a.fecha_actividad) >= ?`
      queryMovimientos += ` AND DATE(m.fecha_movimiento) >= ?`
      params.push(fecha_inicio)
    }
    
    if (fecha_fin) {
      queryCRUD += ` AND DATE(a.fecha_actividad) <= ?`
      queryMovimientos += ` AND DATE(m.fecha_movimiento) <= ?`
      params.push(fecha_fin)
    }
    
    if (tipo_actividad) {
      if (tipo_actividad === 'crud') {
        // Solo actividad CRUD
        queryCRUD += ` ORDER BY a.fecha_actividad DESC LIMIT 100`
        queryMovimientos = 'SELECT NULL LIMIT 0' // Query vacía
      } else if (tipo_actividad === 'movimientos') {
        // Solo movimientos
        queryMovimientos += ` ORDER BY m.fecha_movimiento DESC LIMIT 100`
        queryCRUD = 'SELECT NULL LIMIT 0' // Query vacía
      } else {
        queryCRUD += ` ORDER BY a.fecha_actividad DESC`
        queryMovimientos += ` ORDER BY m.fecha_movimiento DESC`
      }
    } else {
      queryCRUD += ` ORDER BY a.fecha_actividad DESC`
      queryMovimientos += ` ORDER BY m.fecha_movimiento DESC`
    }
    
    // Ejecutar ambas consultas
    const [rowsCRUD] = await pool.execute(queryCRUD, params)
    const [rowsMovimientos] = await pool.execute(queryMovimientos, params)
    
    // Combinar y ordenar resultados por fecha
    let combinedResults = [...rowsCRUD, ...rowsMovimientos]
      .filter(row => row.id !== null) // Filtrar resultados nulos de queries vacías
      .sort((a, b) => new Date(b.fecha_movimiento) - new Date(a.fecha_movimiento))
      .slice(0, 100) // Limitar a 100 registros totales
    
    // Convertir fechas al formato ISO para el frontend
    const actividadConFechasISO = combinedResults.map(row => ({
      ...row,
      fecha_movimiento: row.fecha_movimiento ? new Date(row.fecha_movimiento).toISOString() : null
    }))
    
    console.log('📊 Actividad de equipos encontrada:', {
      crud: rowsCRUD.length,
      movimientos: rowsMovimientos.length,
      total: combinedResults.length
    })
    
    res.json({ 
      success: true, 
      data: actividadConFechasISO,
      total_registros: combinedResults.length,
      desglose: {
        actividad_crud: rowsCRUD.length,
        movimientos: rowsMovimientos.length
      },
      filtros_aplicados: {
        laboratorio_id: laboratorio_id || null,
        fecha_inicio: fecha_inicio || null,
        fecha_fin: fecha_fin || null,
        tipo_actividad: tipo_actividad || null
      }
    })
  } catch (error) {
    console.error('Error en getActividadEquipos:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// Generar plantilla Excel para importación masiva de equipos
export const generarPlantillaImportacionEquipos = async (req, res) => {
  try {
    console.log('📊 Generando plantilla Excel para importación masiva de equipos...')
    
    // Obtener laboratorios para referencia
    const [laboratorios] = await pool.execute(`
      SELECT id, codigo, nombre 
      FROM laboratorios 
      ORDER BY codigo
    `)
    
    // Crear workbook
    const wb = XLSX.utils.book_new()
    
    // Hoja 1: Plantilla de equipos
    const plantillaData = [
      [
        'NOMBRE',
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
        'INVENTARIO_LAB_1',
        'INVENTARIO_LAB_2',
        'INVENTARIO_LAB_3'
      ],
      [
        'Simulador de Paciente Adulto',
        'Simulador de alta fidelidad para prácticas clínicas',
        'Laerdal',
        'SimMan 3G',
        'SM3G-2023-001',
        'Operativo',
        '2024-01-15',
        '2024-07-15',
        'Requiere calibración semestral',
        'Excelente',
        '2023',
        '1',
        '0',
        '0'
      ],
      [
        'Microscopio Óptico Binocular',
        'Microscopio para observación de muestras biológicas',
        'Olympus',
        'CX23',
        'CX23-2024-005',
        'Operativo',
        '2024-03-20',
        '2024-09-20',
        'Limpiar lentes semanalmente',
        'Bueno',
        '2024',
        '5',
        '3',
        '2'
      ],
      [
        'Centrifuga de Mesa',
        'Centrifuga para separación de muestras',
        'Hettich',
        'EBA 200',
        'EBA200-2022-012',
        'En Mantenimiento',
        '2024-02-10',
        '2024-08-10',
        'En reparación - motor defectuoso',
        'Regular',
        '2022',
        '2',
        '1',
        '0'
      ]
    ]
    
    const wsPlantilla = XLSX.utils.aoa_to_sheet(plantillaData)
    
    // Configurar ancho de columnas
    wsPlantilla['!cols'] = [
      { width: 30 }, // NOMBRE
      { width: 40 }, // DESCRIPCION
      { width: 15 }, // MARCA
      { width: 15 }, // MODELO
      { width: 20 }, // NUMERO_SERIE
      { width: 15 }, // ESTADO
      { width: 25 }, // FECHA_ULTIMO_MANTENIMIENTO
      { width: 25 }, // FECHA_PROXIMO_MANTENIMIENTO
      { width: 35 }, // COMENTARIOS
      { width: 12 }, // CONDICION
      { width: 15 }, // ANIO_ADQUISICION
      { width: 15 }, // INVENTARIO_LAB_1
      { width: 15 }, // INVENTARIO_LAB_2
      { width: 15 }  // INVENTARIO_LAB_3
    ]
    
    XLSX.utils.book_append_sheet(wb, wsPlantilla, 'Plantilla Equipos')
    
    // Hoja 2: Instrucciones y validaciones
    const instruccionesData = [
      ['INSTRUCCIONES PARA IMPORTACIÓN MASIVA DE EQUIPOS'],
      [''],
      ['COLUMNAS OBLIGATORIAS:'],
      ['• NOMBRE: Nombre del equipo (texto, máximo 255 caracteres)'],
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
      ['• FECHA_ADQUISICION: Fecha de compra (formato YYYY-MM-DD)'],
      ['• INVENTARIO_LAB_X: Cantidad total por laboratorio (números enteros)'],
      [''],
      ['LABORATORIOS DISPONIBLES:'],
      ['ID', 'CODIGO', 'NOMBRE'],
      ...laboratorios.map(lab => [lab.id, lab.codigo, lab.nombre]),
      [''],
      ['NOTAS IMPORTANTES:'],
      ['• Los códigos de equipos se generan automáticamente (EQP-XXXX)'],
      ['• Las fechas deben estar en formato YYYY-MM-DD'],
      ['• El inventario por laboratorio es opcional (0 por defecto)'],
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
    
    console.log('✅ Plantilla Excel de equipos generada y enviada')
    
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
    
    console.log('📊 Previsualizando importación masiva de equipos...')
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
      const marca = row.MARCA ? row.MARCA.toString().trim() : ''
      const modelo = row.MODELO ? row.MODELO.toString().trim() : ''
      const numero_serie = row.NUMERO_SERIE ? row.NUMERO_SERIE.toString().trim() : ''
      const estado = row.ESTADO ? row.ESTADO.toString().trim() : 'Operativo'
      const comentarios = row.COMENTARIOS ? row.COMENTARIOS.toString().trim() : ''
      const condicion = row.CONDICION ? row.CONDICION.toString().trim() : 'Bueno'
      
      // Validar campos obligatorios
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
      const estadosValidos = ['Operativo', 'En Mantenimiento', 'Fuera de Servicio']
      if (!estadosValidos.includes(estado)) {
        erroresFila.push(`Estado inválido. Debe ser: ${estadosValidos.join(', ')}`)
      }
      
      // Validar condición
      const condicionesValidas = ['Excelente', 'Bueno', 'Regular', 'Malo']
      if (!condicionesValidas.includes(condicion)) {
        erroresFila.push(`Condición inválida. Debe ser: ${condicionesValidas.join(', ')}`)
      }
      
      // Procesar inventario por laboratorio
      const inventario_labs = {}
      for (let labId = 1; labId <= laboratorios.length; labId++) {
        const inventarioColumn = `INVENTARIO_LAB_${labId}`
        if (row[inventarioColumn] && !isNaN(parseInt(row[inventarioColumn]))) {
          const cantidad = parseInt(row[inventarioColumn])
          if (cantidad > 0) {
            const lab = laboratorios.find(l => l.id === labId)
            if (lab) {
              inventario_labs[lab.nombre] = cantidad
            }
          }
        }
      }
      
      previewData.push({
        fila: rowNum,
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
        inventario_labs,
        errores: erroresFila
      })
    }
    
    console.log(`📊 Previsualización de equipos completada: ${previewData.length} filas procesadas`)
    
    res.json({
      success: true,
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
    
    console.log('📊 Procesando importación masiva de equipos...')
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
        if (!row.NOMBRE) {
          errores.push(`Fila ${rowNum}: NOMBRE es obligatorio`)
          continue
        }
        
        // Limpiar y validar datos
        const nombre = row.NOMBRE.toString().trim()
        const descripcion = row.DESCRIPCION ? row.DESCRIPCION.toString().trim() : ''
        const marca = row.MARCA ? row.MARCA.toString().trim() : ''
        const modelo = row.MODELO ? row.MODELO.toString().trim() : ''
        const numero_serie = row.NUMERO_SERIE ? row.NUMERO_SERIE.toString().trim() : ''
        const estado = row.ESTADO ? row.ESTADO.toString().trim() : 'Operativo'
        const comentarios = row.COMENTARIOS ? row.COMENTARIOS.toString().trim() : ''
        const condicion = row.CONDICION ? row.CONDICION.toString().trim() : 'Bueno'
        
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
        
        // Validar estado
        const estadosValidos = ['Operativo', 'En Mantenimiento', 'Fuera de Servicio']
        if (!estadosValidos.includes(estado)) {
          errores.push(`Fila ${rowNum}: Estado inválido. Debe ser: ${estadosValidos.join(', ')}`)
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
          const [maxId] = await connection.execute('SELECT MAX(id) as max_id FROM equipos')
          const nextId = (maxId[0].max_id || 0) + procesados + 1 + intentos
          codigo = `EQP-${nextId.toString().padStart(4, '0')}`
          
          // Verificar si el código ya existe
          const [existing] = await connection.execute('SELECT id FROM equipos WHERE codigo = ?', [codigo])
          
          if (existing.length === 0) {
            break // Código único encontrado
          }
          
          intentos++
        } while (intentos < maxIntentos)
        
        if (intentos >= maxIntentos) {
          errores.push(`Fila ${rowNum}: No se pudo generar un código único para el equipo`)
          continue
        }
        
        // Crear el equipo
        const [equipoResult] = await connection.execute(`
          INSERT INTO equipos (codigo, nombre, descripcion, marca, modelo, numero_serie, estado, fecha_ultimo_mantenimiento, fecha_proximo_mantenimiento, comentarios, condicion, fecha_adquisicion) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [codigo, nombre, descripcion, marca, modelo, numero_serie, estado, fecha_ultimo_mantenimiento, fecha_proximo_mantenimiento, comentarios, condicion, fecha_adquisicion])
        
        const equipo_id = equipoResult.insertId
        
        // Procesar inventario por laboratorio
        const inventarioInfo = []
        for (let labId = 1; labId <= laboratorios.length; labId++) {
          const inventarioColumn = `INVENTARIO_LAB_${labId}`
          if (row[inventarioColumn] && !isNaN(parseInt(row[inventarioColumn]))) {
            const cantidad_total = parseInt(row[inventarioColumn])
            if (cantidad_total > 0 && labMap.has(labId)) {
              // Crear registro de inventario
              await connection.execute(`
                INSERT INTO inventario_equipos (equipo_id, laboratorio_id, cantidad_total, cantidad_disponible, cantidad_en_uso)
                VALUES (?, ?, ?, ?, ?)
              `, [equipo_id, labId, cantidad_total, cantidad_total, 0])
              
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
                INSERT INTO movimientos_equipos 
                (equipo_id, laboratorio_id, usuario_id, tipo_movimiento, cantidad, observaciones, fecha_movimiento)
                VALUES (?, ?, ?, 'entrada', ?, ?, ?)
              `, [equipo_id, labId, req.user.userId, cantidad_total, 'Importación masiva', fechaPeru])
              
              inventarioInfo.push(`${labMap.get(labId).nombre}: ${cantidad_total}`)
            }
          }
        }
        
        // Registrar actividad de creación
        await registrarActividadEquipo({
          accion: 'crear',
          equipo_id: equipo_id,
          descripcion: `Equipo creado por importación masiva: ${nombre} (${codigo}) - Marca: ${marca || 'N/A'}, Modelo: ${modelo || 'N/A'}, Estado: ${estado}, Condición: ${condicion}. Inventario en ${inventarioInfo.length} laboratorio(s).`,
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
          inventario: inventarioInfo.join(', ') || 'Sin inventario inicial'
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
    
    console.log(`✅ Importación de equipos completada: ${procesados} equipos creados, ${errores.length} errores`)
    
    res.json({
      success: true,
      message: `Importación completada: ${procesados} equipos creados`,
      procesados: procesados,
      errores: errores.length,
      detalles_errores: errores,
      resultados: resultados
    })
    
  } catch (error) {
    await connection.rollback()
    console.error('❌ Error en importación masiva de equipos:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error interno en la importación masiva de equipos',
      error: error.message
    })
  } finally {
    connection.release()
  }
}
