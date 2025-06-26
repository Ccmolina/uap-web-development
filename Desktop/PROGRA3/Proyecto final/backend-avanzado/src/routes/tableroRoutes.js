import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verificarToken } from '../middleware/authMiddleware.js';
import { autorizarRol } from '../middleware/autorizarRol.js';

const router = express.Router();
const prisma = new PrismaClient();

// 🔹 Crear un nuevo tablero y registrar al propietario como miembro
router.post('/', verificarToken, async (req, res) => {
  const { titulo } = req.body;
  const usuarioId = req.usuario.id;

  if (!titulo || titulo.trim() === '') {
    return res.status(400).json({ error: 'El título es obligatorio.' });
  }

  try {
    const tablero = await prisma.tablero.create({
      data: {
        titulo: titulo.trim(),
        propietarioId: usuarioId,
        miembros: {
          create: {
            usuarioId,
            rol: 'propietario'
          }
        }
      },
      include: {
        miembros: {
          include: {
            usuario: true
          }
        }
      }
    });
    res.status(201).json(tablero);
  } catch (error) {
    console.error('Error al crear el tablero:', error);
    res.status(500).json({ error: 'Error al crear el tablero' });
  }
});

// 🔹 Obtener tableros del usuario autenticado
router.get('/', verificarToken, async (req, res) => {
  const usuarioId = req.usuario.id;

  try {
    const tableros = await prisma.tablero.findMany({
      where: {
        miembros: {
          some: {
            usuarioId
          }
        }
      },
      include: {
        miembros: {
          include: {
            usuario: true
          }
        }
      }
    });
    res.json(tableros);
  } catch (error) {
    console.error('Error al obtener tableros:', error);
    res.status(500).json({ error: 'Error al obtener tableros' });
  }
});

// 🔹 Obtener un tablero específico con miembros y usuario autenticado
router.get('/:id', verificarToken, async (req, res) => {
  const usuarioId = req.usuario.id;
  const { id } = req.params;

  try {
    const tablero = await prisma.tablero.findUnique({
      where: { id: parseInt(id) },
      include: {
        miembros: {
          include: {
            usuario: true
          }
        }
      }
    });

    if (!tablero) return res.status(404).json({ error: 'Tablero no encontrado' });

    const esMiembro = tablero.miembros.some(m => m.usuarioId === usuarioId);
    if (!esMiembro) return res.status(403).json({ error: 'No tienes acceso a este tablero' });

    res.json({ tablero, usuarioAutenticadoId: usuarioId });
  } catch (error) {
    console.error('Error al obtener tablero:', error);
    res.status(500).json({ error: 'Error al obtener tablero' });
  }
});

// 🔹 Actualizar título del tablero (solo propietario)
router.patch(
  '/:id',
  verificarToken,
  async (req, res, next) => {
    const { id } = req.params;

    try {
      const tablero = await prisma.tablero.findUnique({
        where: { id: parseInt(id) }
      });

      if (!tablero) {
        return res.status(404).json({ error: 'Tablero no encontrado' });
      }

      req.params.tableroId = tablero.id; // para autorizarRol
      next();
    } catch (error) {
      console.error('Error al verificar tablero:', error);
      return res.status(500).json({ error: 'Error al verificar tablero' });
    }
  },
  autorizarRol(['propietario']),
  async (req, res) => {
    const { id } = req.params;
    const { titulo } = req.body;

    try {
      const tableroActualizado = await prisma.tablero.update({
        where: { id: parseInt(id) },
        data: { titulo }
      });
      res.json(tableroActualizado);
    } catch (error) {
      console.error('Error al actualizar tablero:', error);
      res.status(500).json({ error: 'Error al actualizar tablero' });
    }
  }
);

// 🔹 Eliminar un tablero (solo propietario) - incluye eliminación de tareas y miembros
router.delete(
  '/:id',
  verificarToken,
  autorizarRol(['propietario']),
  async (req, res) => {
    const { id } = req.params;

    try {
      const tableroId = parseInt(id);

      const tablero = await prisma.tablero.findUnique({
        where: { id: tableroId }
      });

      if (!tablero) {
        return res.status(404).json({ error: 'Tablero no encontrado' });
      }

      // 🔥 Eliminar tareas del tablero
      await prisma.tarea.deleteMany({
        where: { tableroId }
      });

      // 🔥 Eliminar miembros del tablero
      await prisma.miembro.deleteMany({
        where: { tableroId }
      });

      // ✅ Eliminar el tablero
      await prisma.tablero.delete({
        where: { id: tableroId }
      });

      res.json({ mensaje: 'Tablero eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar tablero:', error);
      res.status(500).json({ error: 'Error al eliminar tablero' });
    }
  }
);

export default router;
