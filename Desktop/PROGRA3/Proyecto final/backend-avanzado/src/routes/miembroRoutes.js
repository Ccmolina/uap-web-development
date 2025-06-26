import express from 'express'
import { PrismaClient } from '@prisma/client'
import { verificarToken } from '../middleware/authMiddleware.js'
import { autorizarRol } from '../middleware/autorizarRol.js'

const router = express.Router()
const prisma = new PrismaClient()

// 🔹 Agregar miembro (solo propietario)
router.post('/agregar', verificarToken, autorizarRol(['propietario']), async (req, res) => {
  const { tableroId, usuarioId, rol } = req.body

  try {
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } })
    if (!usuario) return res.status(404).json({ error: 'El usuario no existe' })

    const existente = await prisma.miembro.findUnique({
      where: {
        usuarioId_tableroId: {
          usuarioId,
          tableroId
        }
      }
    })
    if (existente) return res.status(400).json({ error: 'El usuario ya es miembro del tablero' })

    const nuevoMiembro = await prisma.miembro.create({
      data: { usuarioId, tableroId, rol }
    })

    res.status(201).json(nuevoMiembro)
  } catch (error) {
    console.error('Error al agregar miembro:', error)
    res.status(500).json({ error: 'Error al agregar miembro' })
  }
})

// 🔹 Obtener miembros de un tablero (cualquier miembro)
router.get('/:tableroId', verificarToken, autorizarRol(['lector', 'editor', 'propietario']), async (req, res) => {
  const tableroId = parseInt(req.params.tableroId)

  try {
    const miembros = await prisma.miembro.findMany({
      where: { tableroId },
      include: { usuario: true }
    })
    res.json(miembros)
  } catch (error) {
    console.error('Error al obtener miembros:', error)
    res.status(500).json({ error: 'Error al obtener miembros' })
  }
})

// 🔹 Editar rol de un miembro (solo propietario)
router.patch('/editar/:usuarioId/:tableroId', verificarToken, autorizarRol(['propietario']), async (req, res) => {
  const { usuarioId, tableroId } = req.params
  const { rol } = req.body

  try {
    const miembro = await prisma.miembro.update({
      where: {
        usuarioId_tableroId: {
          usuarioId: parseInt(usuarioId),
          tableroId: parseInt(tableroId)
        }
      },
      data: { rol }
    })

    res.json(miembro)
  } catch (error) {
    console.error('Error al cambiar rol:', error)
    res.status(500).json({ error: 'Error al cambiar rol del miembro' })
  }
})

// 🔹 Eliminar miembro (solo propietario)
router.delete('/eliminar/:usuarioId/:tableroId', verificarToken, autorizarRol(['propietario']), async (req, res) => {
  const { usuarioId, tableroId } = req.params

  try {
    await prisma.miembro.delete({
      where: {
        usuarioId_tableroId: {
          usuarioId: parseInt(usuarioId),
          tableroId: parseInt(tableroId)
        }
      }
    })

    res.json({ mensaje: 'Miembro eliminado' })
  } catch (error) {
    console.error('Error al eliminar miembro:', error)
    res.status(500).json({ error: 'Error al eliminar miembro' })
  }
})

export default router
