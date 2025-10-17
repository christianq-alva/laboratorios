import { TipoEquipo } from '../models/TipoEquipo.js'
import moment from 'moment-timezone'

const TIMEZONE = 'America/Lima'

export const tipoEquipoController = {
  // Obtener todos los tipos de equipo
  async getAll(req, res) {
    try {
      console.log('📥 GET /api/tipos-equipo - Obteniendo todos los tipos')
      console.log('👤 Usuario:', req.user)
      
      const tipos = await TipoEquipo.getAll()
      
      console.log('✅ Tipos encontrados:', tipos.length)
      console.log('📦 Datos:', tipos)
      
      res.json({
        success: true,
        data: tipos
      })
    } catch (error) {
      console.error('❌ Error al obtener tipos de equipo:', error)
      res.status(500).json({
        success: false,
        message: 'Error al obtener tipos de equipo',
        error: error.message
      })
    }
  },

  // Obtener solo tipos activos
  async getActivos(req, res) {
    try {
      const tipos = await TipoEquipo.getActivos()
      
      res.json({
        success: true,
        data: tipos
      })
    } catch (error) {
      console.error('❌ Error al obtener tipos activos:', error)
      res.status(500).json({
        success: false,
        message: 'Error al obtener tipos activos',
        error: error.message
      })
    }
  },

  // Obtener un tipo por ID
  async getById(req, res) {
    try {
      const { id } = req.params
      const tipo = await TipoEquipo.getById(id)
      
      if (!tipo) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de equipo no encontrado'
        })
      }
      
      res.json({
        success: true,
        data: tipo
      })
    } catch (error) {
      console.error('❌ Error al obtener tipo por ID:', error)
      res.status(500).json({
        success: false,
        message: 'Error al obtener tipo de equipo',
        error: error.message
      })
    }
  },

  // Crear un nuevo tipo de equipo
  async create(req, res) {
    try {
      const { nombre, descripcion } = req.body

      // Validaciones
      if (!nombre || nombre.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'El nombre es obligatorio'
        })
      }

      if (nombre.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'El nombre no puede exceder 100 caracteres'
        })
      }

      if (descripcion && descripcion.length > 255) {
        return res.status(400).json({
          success: false,
          message: 'La descripción no puede exceder 255 caracteres'
        })
      }

      const tipoId = await TipoEquipo.create({
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null
      })

      const nuevoTipo = await TipoEquipo.getById(tipoId)

      res.status(201).json({
        success: true,
        message: 'Tipo de equipo creado exitosamente',
        data: nuevoTipo
      })
    } catch (error) {
      console.error('❌ Error al crear tipo de equipo:', error)
      
      if (error.message.includes('Ya existe')) {
        return res.status(409).json({
          success: false,
          message: error.message
        })
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al crear tipo de equipo',
        error: error.message
      })
    }
  },

  // Actualizar un tipo de equipo
  async update(req, res) {
    try {
      const { id } = req.params
      const { nombre, descripcion } = req.body

      // Verificar que el tipo existe
      const tipoExistente = await TipoEquipo.getById(id)
      if (!tipoExistente) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de equipo no encontrado'
        })
      }

      // Validaciones
      if (!nombre || nombre.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'El nombre es obligatorio'
        })
      }

      if (nombre.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'El nombre no puede exceder 100 caracteres'
        })
      }

      if (descripcion && descripcion.length > 255) {
        return res.status(400).json({
          success: false,
          message: 'La descripción no puede exceder 255 caracteres'
        })
      }

      const actualizado = await TipoEquipo.update(id, {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null
      })

      if (!actualizado) {
        return res.status(404).json({
          success: false,
          message: 'No se pudo actualizar el tipo de equipo'
        })
      }

      const tipoActualizado = await TipoEquipo.getById(id)

      res.json({
        success: true,
        message: 'Tipo de equipo actualizado exitosamente',
        data: tipoActualizado
      })
    } catch (error) {
      console.error('❌ Error al actualizar tipo de equipo:', error)
      
      if (error.message.includes('Ya existe')) {
        return res.status(409).json({
          success: false,
          message: error.message
        })
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al actualizar tipo de equipo',
        error: error.message
      })
    }
  },

  // Eliminar un tipo de equipo
  async delete(req, res) {
    try {
      const { id } = req.params

      // Verificar que el tipo existe
      const tipoExistente = await TipoEquipo.getById(id)
      if (!tipoExistente) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de equipo no encontrado'
        })
      }

      const eliminado = await TipoEquipo.delete(id)

      if (!eliminado) {
        return res.status(404).json({
          success: false,
          message: 'No se pudo eliminar el tipo de equipo'
        })
      }

      res.json({
        success: true,
        message: 'Tipo de equipo eliminado exitosamente'
      })
    } catch (error) {
      console.error('❌ Error al eliminar tipo de equipo:', error)
      
      if (error.message.includes('tiene') && error.message.includes('asociado')) {
        return res.status(409).json({
          success: false,
          message: error.message
        })
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al eliminar tipo de equipo',
        error: error.message
      })
    }
  },

  // Contar equipos por tipo
  async countEquipos(req, res) {
    try {
      const { id } = req.params
      const count = await TipoEquipo.countEquiposByTipo(id)
      
      res.json({
        success: true,
        data: { count }
      })
    } catch (error) {
      console.error('❌ Error al contar equipos:', error)
      res.status(500).json({
        success: false,
        message: 'Error al contar equipos',
        error: error.message
      })
    }
  }
}

