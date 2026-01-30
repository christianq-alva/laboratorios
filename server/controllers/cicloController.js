import { Ciclo } from '../models/Ciclo.js'

export const getCiclos = async (req, res, next) => {
  try {
    const ciclos = await Ciclo.getCiclos()
    res.status(200).json({
      success: true,
      data: ciclos
    })
  } catch (error) {
    next(error)
  }
}
