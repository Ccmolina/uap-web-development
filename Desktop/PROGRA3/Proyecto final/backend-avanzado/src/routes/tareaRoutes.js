import express from 'express'
import { PrismaClient } from '@prisma/client'
import { verificarToken } from '../middleware/authMiddleware.js'
import { autorizarRol } from '../middleware/autorizarRol.js'

const router = express.Router()
const prisma = new PrismaClient()

// Crear nueva tarea (requiere rol editor o propietario)
router.post('/', verificarToken, autorizarRol(['editor', 'propietario']), async (req, res) => {
  const { titulo, tableroId } = req.body

  try {
    const tarea = await prisma.tarea.create({
      data: { titulo, tableroId }
    })
    res.status(201).json(tarea)
  } catch (error) {
    console.error('Error al crear tarea:', error)
    res.status(500).json({ error: 'Error al crear tarea' })
  }
})

// Obtener todas las tareas de un tablero (cualquier miembro)
router.get('/:tableroId', verificarToken, autorizarRol(['lector', 'editor', 'propietario']), async (req, res) => {
  const { tableroId } = req.params

  try {
    const tareas = await prisma.tarea.findMany({
      where: { tableroId: parseInt(tableroId) },
      orderBy: { creadaEn: 'desc' }
    })
    res.json(tareas)
  } catch (error) {
    console.error('Error al obtener tareas:', error)
    res.status(500).json({ error: 'Error al obtener tareas' })
  }
})

// Marcar tarea como completada (requiere rol editor o propietario)
router.patch('/:id', verificarToken, async (req, res, next) => {
  try {
    const tarea = await prisma.tarea.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!tarea) return res.status(404).json({ error: 'Tarea no encontrada' })
    req.params.tableroId = String(tarea.tableroId) // <-- aseguramos que sea string
    next()
  } catch (error) {
    return res.status(500).json({ error: 'Error interno al verificar tarea' })
  }
}, autorizarRol(['editor', 'propietario']), async (req, res) => {
  const { id } = req.params
  const { completada } = req.body

  try {
    const tarea = await prisma.tarea.update({
      where: { id: parseInt(id) },
      data: { completada }
    })
    res.json(tarea)
  } catch (error) {
    console.error('Error al actualizar tarea:', error)
    res.status(500).json({ error: 'Error al actualizar tarea' })
  }
})

// Eliminar tarea individual
router.delete('/:id', verificarToken, async (req, res, next) => {
  try {
    const tarea = await prisma.tarea.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!tarea) return res.status(404).json({ error: 'Tarea no encontrada' })
    req.params.tableroId = String(tarea.tableroId)
    next()
  } catch (error) {
    return res.status(500).json({ error: 'Error interno al verificar tarea' })
  }
}, autorizarRol(['editor', 'propietario']), async (req, res) => {
  const { id } = req.params

  try {
    await prisma.tarea.delete({ where: { id: parseInt(id) } })
    res.json({ mensaje: 'Tarea eliminada' })
  } catch (error) {
    console.error('Error al eliminar tarea:', error)
    res.status(500).json({ error: 'Error al eliminar tarea' })
  }
})

// Eliminar todas las tareas completadas de un tablero
router.delete('/completadas/:tableroId', verificarToken, autorizarRol(['editor', 'propietario']), async (req, res) => {
  try {
    const tableroId = parseInt(req.params.tableroId)

    const tareasCompletadas = await prisma.tarea.findMany({
      where: {
        tableroId,
        completada: true
      }
    })

    if (tareasCompletadas.length === 0) {
      return res.status(404).json({ mensaje: 'No hay tareas completadas para eliminar.' })
    }

    await prisma.tarea.deleteMany({
      where: {
        tableroId,
        completada: true
      }
    })

    res.json({ mensaje: 'Tareas completadas eliminadas exitosamente.' })
  } catch (error) {
    console.error('Error al eliminar tareas completadas:', error)
    res.status(500).json({ error: 'Error al eliminar tareas completadas' })
  }
})

export default router
