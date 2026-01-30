import { Rol } from '../models/Rol.js'

export const getAll = async (req, res, next) => {
  try {
    const roles = await Rol.getAll()
    res.status(200).json({
      success: true,
      data: roles
    })
  } catch (error) {
    next(error)
  }
}
