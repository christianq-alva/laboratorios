import { User } from '../models/User.js'
export const getAll = async (req, res) => {
  try {
    const usuarios = await User.getAll()
    res.status(200).json({
      data: usuarios
    })
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    res.status(500).json({
      message: 'Error al obtener usuarios'
    })
  }
}
// Obtener un usuario por ID
export const getById = async (req, res) => {
  try {
    const { id } = req.params
    const usuarioId = parseInt(id, 10)
    // Validar ID
    if (isNaN(usuarioId) || usuarioId <= 0) {
      return res.status(400).json({
        message: 'ID de usuario inválido'
      })
    }
    const usuario = await User.getById(usuarioId)
    if (!usuario) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      })
    }
    res.status(200).json({
      data: usuario
    })
  } catch (error) {
    console.error('Error al obtener usuario:', error)
    res.status(500).json({
      message: 'Error al obtener usuario'
    })
  }
}
// Crear un nuevo usuario
export const createUsuario = async (req, res) => {
  try {
    const { nombre_completo, usuario, contrasena, rol_id, laboratorios } = req.body
    // Validaciones
    if (!nombre_completo || nombre_completo.trim() === '') {
      return res.status(400).json({
        message: 'El nombre completo es obligatorio'
      })
    }
    if (!usuario || usuario.trim() === '') {
      return res.status(400).json({
        message: 'El nombre de usuario es obligatorio'
      })
    }
    if (!contrasena || contrasena.trim() === '') {
      return res.status(400).json({
        message: 'La contraseña es obligatoria'
      })
    }
    if (contrasena.length < 6) {
      return res.status(400).json({
        message: 'La contraseña debe tener al menos 6 caracteres'
      })
    }
    if (!rol_id || rol_id <= 0) {
      return res.status(400).json({
        message: 'El rol es obligatorio'
      })
    }
    // Validar que si es Jefe de Laboratorio, tenga al menos un laboratorio
    if (rol_id === 2 && (!laboratorios || laboratorios.length === 0)) {
      return res.status(400).json({
        message: 'Los jefes de laboratorio deben tener al menos un laboratorio asignado'
      })
    }
    const usuarioId = await User.create({
      nombre_completo: nombre_completo.trim(),
      usuario: usuario.trim(),
      contrasena: contrasena,
      rol_id: rol_id,
      laboratorios: laboratorios || []
    })
    const nuevoUsuario = await User.getById(usuarioId)
    res.status(201).json({
      message: 'Usuario creado exitosamente',
      data: nuevoUsuario
    })
  } catch (error) {
    if (error.message.includes('Ya existe')) {
      return res.status(409).json({
        message: error.message
      })
    }
    console.error('Error al crear usuario:', error)
    res.status(500).json({
      message: 'Error al crear usuario'
    })
  }
}
// Actualizar un usuario
export const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params
    const usuarioId = parseInt(id, 10)
    const { nombre_completo, usuario, contrasena, rol_id, laboratorios } = req.body
    // Validar ID
    if (isNaN(usuarioId) || usuarioId <= 0) {
      return res.status(400).json({
        message: 'ID de usuario inválido'
      })
    }
    // Verificar que el usuario existe
    const usuarioExistente = await User.getById(usuarioId)
    if (!usuarioExistente) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      })
    }
    // Validaciones
    if (nombre_completo !== undefined && nombre_completo.trim() === '') {
      return res.status(400).json({
        message: 'El nombre completo no puede estar vacío'
      })
    }
    if (usuario !== undefined && usuario.trim() === '') {
      return res.status(400).json({
        message: 'El nombre de usuario no puede estar vacío'
      })
    }
    if (contrasena !== undefined && contrasena.length < 6) {
      return res.status(400).json({
        message: 'La contraseña debe tener al menos 6 caracteres'
      })
    }
    // Validar que si es Jefe de Laboratorio, tenga al menos un laboratorio
    if (rol_id === 2 && laboratorios !== undefined && laboratorios.length === 0) {
      return res.status(400).json({
        message: 'Los jefes de laboratorio deben tener al menos un laboratorio asignado'
      })
    }
    const data = {}
    if (nombre_completo !== undefined) data.nombre_completo = nombre_completo.trim()
    if (usuario !== undefined) data.usuario = usuario.trim()
    if (contrasena !== undefined) data.contrasena = contrasena
    if (rol_id !== undefined) data.rol_id = rol_id
    if (laboratorios !== undefined) data.laboratorios = laboratorios
    const actualizado = await User.update(usuarioId, data)
    if (!actualizado) {
      return res.status(404).json({
        message: 'No se pudo actualizar el usuario'
      })
    }
    const usuarioActualizado = await User.getById(usuarioId)
    res.status(200).json({
      message: 'Usuario actualizado exitosamente',
      data: usuarioActualizado
    })
  } catch (error) {
    if (error.message.includes('Ya existe')) {
      return res.status(409).json({
        message: error.message
      })
    }
    console.error('Error al actualizar usuario:', error)
    res.status(500).json({
      message: 'Error al actualizar usuario'
    })
  }
}
// Eliminar un usuario
export const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params
    const usuarioId = parseInt(id, 10)
    // Validar ID
    if (isNaN(usuarioId) || usuarioId <= 0) {
      return res.status(400).json({
        message: 'ID de usuario inválido'
      })
    }
    // Verificar que el usuario existe
    const usuarioExistente = await User.getById(usuarioId)
    if (!usuarioExistente) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      })
    }
    const eliminado = await User.delete(usuarioId)
    if (!eliminado) {
      return res.status(404).json({
        message: 'No se pudo eliminar el usuario'
      })
    }
    res.status(200).json({
      message: 'Usuario eliminado exitosamente'
    })
  } catch (error) {
    console.error('Error al eliminar usuario:', error)
    res.status(500).json({
      message: 'Error al eliminar usuario'
    })
  }
}
// Cambiar el estado de un usuario
export const updateEstado = async (req, res) => {
  try {
    const { id } = req.params
    const usuarioId = parseInt(id, 10)
    const { estado } = req.body
    // Validar ID
    if (isNaN(usuarioId) || usuarioId <= 0) {
      return res.status(400).json({
        message: 'ID de usuario inválido'
      })
    }
    // Validar estado (aceptar 'activo'/'inactivo' o 'A'/'I')
    const estadoValido = estado === 'activo' || estado === 'A' || estado === 'inactivo' || estado === 'I'
    if (!estado || !estadoValido) {
      return res.status(400).json({
        message: 'El estado debe ser "activo"/"A" o "inactivo"/"I"'
      })
    }
    // Verificar que el usuario existe
    const usuarioExistente = await User.getById(usuarioId)
    if (!usuarioExistente) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      })
    }
    const actualizado = await User.updateEstado(usuarioId, estado)
    if (!actualizado) {
      return res.status(404).json({
        message: 'No se pudo actualizar el estado del usuario'
      })
    }
    const estadoNormalizado = estado === 'activo' || estado === 'A' ? 'A' : 'I'
    res.status(200).json({
      message: `Usuario ${estadoNormalizado === 'A' ? 'activado' : 'desactivado'} exitosamente`
    })
  } catch (error) {
    console.error('Error al actualizar estado del usuario:', error)
    res.status(500).json({
      message: 'Error al actualizar estado del usuario'
    })
  }
}
