import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verificarToken } from '../middleware/authMiddleware.js';
import { registrar } from '../controllers/authController.js'; // ✅ AGREGADO

const router = express.Router();
const prisma = new PrismaClient();

// ✅ Registro de usuario (POST /api/usuarios)
router.post('/', registrar);

// Obtener perfil del usuario autenticado
router.get('/perfil', verificarToken, async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.id },
      select: {
        id: true,
        email: true,
        nombre: true
      }
    });

    res.json(usuario);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// Actualizar perfil (nombre o clave)
router.patch('/perfil', verificarToken, async (req, res) => {
  const { nombre, clave } = req.body;

  try {
    const data = {};
    if (nombre) data.nombre = nombre;
    if (clave) data.clave = clave; // opcional: agregar hashing si corresponde

    const usuario = await prisma.usuario.update({
      where: { id: req.usuario.id },
      data,
      select: {
        id: true,
        email: true,
        nombre: true
      }
    });

    res.json(usuario);
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

export default router;
