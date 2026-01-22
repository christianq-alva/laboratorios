import { User } from '../models/User.js'
export const getAll = async (req, res) => {
  try {
    const usuarios = await User.getAll()
    res.status(200).json({
      success: true,
      data: usuarios
    })
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios'
    })
  }
}
// Obtener un usuario por ID
export const getById = async (req, res) => {
  try {
    // El ID ya está validado y transformado por el middleware de validación
    const { id: usuarioId } = req.params
    const usuario = await User.getById(usuarioId)
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      })
    }
    res.status(200).json({
      success: true,
      data: usuario
    })
  } catch (error) {
    console.error('Error al obtener usuario:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario'
    })
  }
}
// Crear un nuevo usuario
export const createUsuario = async (req, res) => {
  try {
    // Los datos ya están validados y transformados por el middleware de validación
    const { nombre_completo, usuario, contrasena, rol_id, laboratorio_ids } = req.body

    const usuarioId = await User.create({
      nombre_completo,
      usuario,
      contrasena,
      rol_id,
      laboratorio_ids: laboratorio_ids || []
    })
    const nuevoUsuario = await User.getById(usuarioId)
    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: nuevoUsuario
    })
  } catch (error) {
    if (error.message.includes('Ya existe')) {
      return res.status(409).json({
        success: false,
        message: error.message
      })
    }
    console.error('Error al crear usuario:', error)
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario'
    })
  }
}
// Actualizar un usuario
export const updateUsuario = async (req, res) => {
  try {
    // El ID ya está validado y transformado por el middleware de validación
    const { id: usuarioId } = req.params
    const { nombre_completo, usuario, contrasena, rol_id, laboratorio_ids } = req.body

    // Verificar que el usuario existe
    const usuarioExistente = await User.getById(usuarioId)
    if (!usuarioExistente) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      })
    }

    const data = {}
    if (nombre_completo !== undefined) data.nombre_completo = nombre_completo
    if (usuario !== undefined) data.usuario = usuario
    if (contrasena !== undefined) data.contrasena = contrasena
    if (rol_id !== undefined) data.rol_id = rol_id
    if (laboratorio_ids !== undefined) data.laboratorio_ids = laboratorio_ids

    const actualizado = await User.update(usuarioId, data)
    if (!actualizado) {
      return res.status(404).json({
        success: false,
        message: 'No se pudo actualizar el usuario'
      })
    }
    const usuarioActualizado = await User.getById(usuarioId)
    res.status(200).json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: usuarioActualizado
    })
  } catch (error) {
    if (error.message.includes('Ya existe')) {
      return res.status(409).json({
        success: false,
        message: error.message
      })
    }
    console.error('Error al actualizar usuario:', error)
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario'
    })
  }
}
// Eliminar un usuario
export const deleteUsuario = async (req, res) => {
  try {
    // El ID ya está validado y transformado por el middleware de validación
    const { id: usuarioId } = req.params

    // Verificar que el usuario existe
    const usuarioExistente = await User.getById(usuarioId)
    if (!usuarioExistente) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      })
    }

    const eliminado = await User.delete(usuarioId)
    if (!eliminado) {
      return res.status(404).json({
        success: false,
        message: 'No se pudo eliminar el usuario'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    })
  } catch (error) {
    console.error('Error al eliminar usuario:', error)
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario'
    })
  }
}
// Cambiar el estado de un usuario
export const updateEstado = async (req, res) => {
  try {
    // El ID y estado ya están validados por el middleware de validación
    const { id: usuarioId } = req.params
    const { estado } = req.body

    // Prevenir que un usuario cambie su propio estado
    if (req.user.userId === parseInt(usuarioId)) {
      return res.status(403).json({
        success: false,
        message: 'No puedes cambiar tu propio estado'
      })
    }

    // Verificar que el usuario existe
    const usuarioExistente = await User.getById(usuarioId)
    if (!usuarioExistente) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      })
    }

    const actualizado = await User.updateEstado(usuarioId, estado)
    if (!actualizado) {
      return res.status(404).json({
        success: false,
        message: 'No se pudo actualizar el estado del usuario'
      })
    }

    const estadoNormalizado = estado === 'activo' || estado === 'A' ? 'A' : 'I'
    res.status(200).json({
      success: true,
      message: `Usuario ${estadoNormalizado === 'A' ? 'activado' : 'desactivado'} exitosamente`
    })
  } catch (error) {
    console.error('Error al actualizar estado del usuario:', error)
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado del usuario'
    })
  }
}
