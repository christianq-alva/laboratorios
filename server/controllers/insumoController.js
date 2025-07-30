import { pool } from '../config/database.js'
import { Insumo } from '../models/Insumo.js'

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
          GROUP BY i.id
          ORDER BY i.nombre
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
        stock_inicial = [] // ← NUEVO: Array de stock por laboratorio
      } = req.body
      
      console.log('🔍 Creando insumo con stock:', req.body)
      
      // 1️⃣ CREAR EL INSUMO (catálogo)
      const [insumoResult] = await connection.execute(`
        INSERT INTO insumos (nombre, descripcion, unidad_medida) 
        VALUES (?, ?, ?)
      `, [nombre, descripcion, unidad_medida])
      
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
          
          // Registrar movimiento de entrada
          await connection.execute(`
            INSERT INTO movimientos_insumos 
            (insumo_id, laboratorio_id, usuario_id, tipo_movimiento, cantidad, observaciones)
            VALUES (?, ?, ?, 'entrada', ?, ?)
          `, [insumo_id, laboratorio_id, req.user.userId, cantidad, observaciones])
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
    
    console.log('📊 Actividad encontrada:', rows.length)
    
    res.json({ 
      success: true, 
      data: rows,
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