import express from 'express'
import { verificarToken } from '../middleware/authMiddleware.js'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// Obtener perfil del usuario autenticado
router.get('/', verificarToken, async (req, res) => {
  const usuarioId = req.usuario.id

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nombre: true,
        email: true
      }
    })

    res.json(usuario)
  } catch (error) {
    console.error('Error al obtener perfil:', error)
    res.status(500).json({ error: 'Error al obtener perfil' })
  }
})

export default router
