import express from 'express'
import { login, getProfile } from '../controllers/authController.js'
import { authenticateToken } from '../middleware/auth.js'
import { loginLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()
// Aplicar rate limiting estricto al login para prevenir fuerza bruta
router.post('/login', 
    loginLimiter,
    login)
router.get('/profile', 
    authenticateToken, 
    getProfile)

export default router