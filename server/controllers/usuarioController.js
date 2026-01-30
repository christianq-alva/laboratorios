import { AppError } from '../utils/errors.js'
import { User } from '../models/User.js'

export const getAll = async (req, res, next) => {
  try {
    const usuarios = await User.getAll()
    res.status(200).json({
      success: true,
      data: usuarios
    })
  } catch (error) {
    next(error)
  }
}

export const getById = async (req, res, next) => {
  try {
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
    next(error)
  }
}

export const createUsuario = async (req, res, next) => {
  try {
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
    next(error)
  }
}

export const updateUsuario = async (req, res, next) => {
  try {
    const { id: usuarioId } = req.params
    const { nombre_completo, usuario, contrasena, rol_id, laboratorio_ids } = req.body

    const data = {}
    if (nombre_completo !== undefined) data.nombre_completo = nombre_completo
    if (usuario !== undefined) data.usuario = usuario
    if (contrasena !== undefined) data.contrasena = contrasena
    if (rol_id !== undefined) data.rol_id = rol_id
    if (laboratorio_ids !== undefined) data.laboratorio_ids = laboratorio_ids

    await User.update(usuarioId, data)
    const usuarioActualizado = await User.getById(usuarioId)
    res.status(200).json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: usuarioActualizado
    })
  } catch (error) {
    next(error)
  }
}

export const deleteUsuario = async (req, res, next) => {
  try {
    const { id: usuarioId } = req.params
    await User.delete(usuarioId)
    res.status(200).json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    })
  } catch (error) {
    next(error)
  }
}

export const updateEstado = async (req, res, next) => {
  try {
    const { id: usuarioId } = req.params
    const { estado } = req.body

    if (req.user.userId === parseInt(usuarioId)) {
      throw new AppError('No puedes cambiar tu propio estado', 403)
    }

    const usuarioExistente = await User.getById(usuarioId)
    if (!usuarioExistente) {
      throw new AppError('Usuario no encontrado', 404)
    }

    const actualizado = await User.updateEstado(usuarioId, estado)
    if (!actualizado) {
      throw new AppError('No se pudo actualizar el estado del usuario', 404)
    }

    const estadoNormalizado = estado === 'activo' || estado === 'A' ? 'A' : 'I'
    res.status(200).json({
      success: true,
      message: `Usuario ${estadoNormalizado === 'A' ? 'activado' : 'desactivado'} exitosamente`
    })
  } catch (error) {
    next(error)
  }
}
