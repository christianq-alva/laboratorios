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
                 GROUP_CONCAT(CONCAT(l.nombre, ':', COALESCE(inv.stock_actual, 0)) SEPARATOR '; ') as stock_por_laboratorio
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

// Otros métodos (update, delete) similar al patrón de horarios...