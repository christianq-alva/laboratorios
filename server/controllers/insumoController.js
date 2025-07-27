import { pool } from '../config/database.js'
import { Insumo } from '../models/Insumo.js'

export const getInsumos = async (req, res) => {
  try {
    let insumos = []
    
    if (req.user.rol === 'Jefe de Laboratorio') {
      // Solo insumos de sus laboratorios
      for (const labId of req.user.laboratorio_ids) {
        const insumosLab = await Insumo.getByLaboratorio(labId)
        insumos = [...insumos, ...insumosLab]
      }
    } else if (req.user.rol === 'Administrador') {
      // Todos los insumos (necesitaría consulta diferente)
      const [rows] = await pool.execute('SELECT * FROM insumos ORDER BY nombre')
      insumos = rows
    }
    
    res.json({ 
      success: true, 
      data: insumos,
      laboratorios_asignados: req.user.laboratorio_ids 
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