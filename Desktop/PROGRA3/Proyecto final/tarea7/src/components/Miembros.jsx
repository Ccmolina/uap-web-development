import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

export default function Miembros({ tableroId, usuarioAutenticadoId }) {
  const queryClient = useQueryClient();
  const [mostrarTooltip, setMostrarTooltip] = useState(false);

  const { data: miembros = [], isLoading } = useQuery({
    queryKey: ['miembros', tableroId],
    queryFn: async () => {
      const res = await api.get(`/miembros/${tableroId}`);
      return res.data;
    }
  });

  const esPropietario = miembros.find(
    (m) => m.usuarioId === usuarioAutenticadoId && m.rol === 'propietario'
  );

  const cambiarRol = useMutation({
    mutationFn: async ({ usuarioId, nuevoRol }) => {
      const res = await api.patch(`/miembros/editar/${usuarioId}/${tableroId}`, {
        rol: nuevoRol
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['miembros', tableroId]);
      toast.success('Rol actualizado');
    }
  });

  const eliminarMiembro = useMutation({
    mutationFn: async (usuarioId) => {
      const res = await api.delete(`/miembros/eliminar/${usuarioId}/${tableroId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['miembros', tableroId]);
      toast.success('Miembro eliminado');
    }
  });

  if (isLoading) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setMostrarTooltip(!mostrarTooltip)}>
        {mostrarTooltip ? 'Ocultar miembros' : 'Ver miembros'}
      </button>

      {mostrarTooltip && (
        <div className="tooltip-miembros">
          <button className="close-button" onClick={() => setMostrarTooltip(false)}>❌</button>
          <h3><strong>Miembros del tablero</strong></h3>
          <ul>
            {miembros.map((miembro) => (
              <li key={miembro.usuarioId}>
                <span>
                  {miembro.usuario.nombre} ({miembro.usuario.email}) — {miembro.rol}
                </span>
                {esPropietario && miembro.usuarioId !== usuarioAutenticadoId && (
                  <div style={{ marginTop: '0.3rem' }}>
                    {miembro.rol !== 'propietario' && (
                      <>
                        <button
                          style={{ backgroundColor: '#4da6ff', marginRight: '0.3rem' }}
                          onClick={() =>
                            cambiarRol.mutate({
                              usuarioId: miembro.usuarioId,
                              nuevoRol: miembro.rol === 'editor' ? 'lector' : 'editor'
                            })
                          }
                        >
                          Cambiar a {miembro.rol === 'editor' ? 'lector' : 'editor'}
                        </button>

                        <button
                          style={{ backgroundColor: '#ff4d4d' }}
                          onClick={() => eliminarMiembro.mutate(miembro.usuarioId)}
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
