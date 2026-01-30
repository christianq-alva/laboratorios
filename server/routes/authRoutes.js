import express from 'express'
import { login, getProfile } from '../controllers/authController.js'
import { authenticateToken } from '../middleware/auth.js'
import { loginLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

// Login con rate limiting estricto para prevenir fuerza bruta
router.post('/login', 
    loginLimiter,
    login)

// Obtener perfil del usuario
router.get('/profile', 
    authenticateToken, 
    getProfile)

export default router