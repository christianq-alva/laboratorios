import * as authService from '../services/authService.js'

export const login = async (req, res, next) => {
  try {
    const { usuario, contrasena } = req.body
    const result = await authService.login(usuario, contrasena)
    res.status(200).json({
      success: true,
      ...result
    })
  } catch (error) {
    next(error)
  }
}

export const getProfile = async (req, res, next) => {
  try {
    const payload = authService.getProfile(req.user)
    res.status(200).json({
      success: true,
      ...payload
    })
  } catch (error) {
    next(error)
  }
}
