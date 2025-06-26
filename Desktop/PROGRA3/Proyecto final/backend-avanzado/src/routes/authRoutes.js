import express from 'express'
import { registrar, login, logout, actualizarPerfil } from '../controllers/authController.js'
import { verificarToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// Ruta para registro
router.post('/registro', registrar)

// Ruta para login
router.post('/login', login)

// 🔓 Ruta para logout (requiere token válido)
router.post('/logout', verificarToken, logout)

// 🔧 Ruta para actualizar perfil
router.patch('/perfil', verificarToken, actualizarPerfil)

export default router
