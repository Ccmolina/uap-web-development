import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api';
import Miembros from '../components/Miembros';

export default function Boards() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newBoard, setNewBoard] = useState('');
  const [usuarioAutenticadoId, setUsuarioAutenticadoId] = useState(null);
  const [tableroVisible, setTableroVisible] = useState(null); // para ver miembros

  useEffect(() => {
    const redirected = sessionStorage.getItem('alreadyRedirected');
    const lastBoardId = localStorage.getItem('lastBoardId');
    const userId = localStorage.getItem('usuarioAutenticadoId');

    if (userId) setUsuarioAutenticadoId(parseInt(userId));

    if (!redirected && lastBoardId) {
      sessionStorage.setItem('alreadyRedirected', 'true');
      navigate(`/board/${lastBoardId}`);
    }
  }, [navigate]);

  const { data: boards = [], isLoading } = useQuery({
    queryKey: ['boards'],
    queryFn: async () => {
      const res = await api.get('/tableros');
      return res.data;
    }
  });

  const createBoard = useMutation({
    mutationFn: async (titulo) => {
      const res = await api.post('/tableros', { titulo });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['boards']);
      toast.success('Tablero creado');
      setNewBoard('');
    }
  });

  const deleteBoard = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/tableros/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['boards']);
      toast.success('Tablero eliminado');
    }
  });

  const handleCreate = () => {
    if (!newBoard.trim()) return;
    createBoard.mutate(newBoard.trim());
  };

  return (
    <div className="background">
      <main>
        {/* Botón de configuración arriba a la derecha */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <Link to="/config" className="config-button">⚙️ Configuración</Link>
        </div>

        <h1 className="main-title">Mis Tableros</h1>

        <img
          src="https://images.pexels.com/photos/7845451/pexels-photo-7845451.jpeg"
          alt="Decoración"
          className="decorative-img"
        />

        <div className="form-container">
          <input
            type="text"
            placeholder="Nombre del tablero"
            value={newBoard}
            onChange={(e) => setNewBoard(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
            }}
          />
          <button onClick={handleCreate}>Crear Tablero</button>
        </div>

        {isLoading ? (
          <p>Cargando tableros...</p>
        ) : (
          <ul className="boards-list">
            {boards.map((board) => (
              <li key={board.id} className="board-item">
                <span className="board-title">{board.titulo}</span>

                <div className="board-buttons">
                  <button
                    onClick={() => navigate(`/board/${board.id}`)}
                    className="btn"
                  >
                    Entrar
                  </button>
                  <button
                    onClick={() => deleteBoard.mutate(board.id)}
                    className="btn"
                  >
                    Eliminar
                  </button>
                  <button
                    onClick={() =>
                      setTableroVisible(tableroVisible === board.id ? null : board.id)
                    }
                    className="btn-secondary"
                  >
                    {tableroVisible === board.id ? 'Ocultar miembros' : 'Ver miembros'}
                  </button>
                </div>

                {tableroVisible === board.id && (
                  <div className="tooltip-miembros">
                    <Miembros
                      tableroId={board.id}
                      usuarioAutenticadoId={usuarioAutenticadoId}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
