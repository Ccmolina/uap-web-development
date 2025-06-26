import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const autorizarRol = (rolesPermitidos = []) => {
  return async (req, res, next) => {
    const usuarioId = req.usuario.id;

    // ✅ Detectamos el ID del tablero desde varias fuentes (orden correcto)
    const tableroId =
      req.params?.tableroId ? parseInt(req.params.tableroId) :
      req.body?.tableroId ? parseInt(req.body.tableroId) :
      req.query?.tableroId ? parseInt(req.query.tableroId) :
      req.params?.id ? parseInt(req.params.id) : // ← al final
      null;

    if (!tableroId || isNaN(tableroId)) {
      return res.status(400).json({ error: 'Se requiere un ID de tablero válido' });
    }

    try {
      const miembro = await prisma.miembro.findUnique({
        where: {
          usuarioId_tableroId: {
            usuarioId,
            tableroId
          }
        }
      });

      if (!miembro || !rolesPermitidos.includes(miembro.rol)) {
        return res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
      }

      next();
    } catch (error) {
      console.error('Error en autorización:', error);
      res.status(500).json({ error: 'Error al verificar permisos' });
    }
  };
};
