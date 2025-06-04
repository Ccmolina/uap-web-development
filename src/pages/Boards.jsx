import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:3001/boards';

export default function Boards() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newBoard, setNewBoard] = useState('');

  // Redirigir solo la primera vez que se entra a "/"
  useEffect(() => {
    const redirected = sessionStorage.getItem('alreadyRedirected');
    const lastBoardId = localStorage.getItem('lastBoardId');

    if (!redirected && lastBoardId) {
      sessionStorage.setItem('alreadyRedirected', 'true');
      navigate(`/board/${lastBoardId}`);
    }
  }, []);

  const { data: boards, isLoading } = useQuery({
    queryKey: ['boards'],
    queryFn: async () => {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al cargar tableros');
      return res.json();
    }
  });

  const createBoard = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: id })
      });
      if (!res.ok) throw new Error('Error al crear tablero');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['boards']);
      toast.success('Tablero creado');
      setNewBoard('');
    }
  });

  const deleteBoard = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Error al eliminar tablero');
      return res.json();
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
    <main>
      {/* Botón de configuración arriba a la derecha */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <Link to="/config" className="config-button">⚙️ Configuración</Link>
      </div>

      {/* Título centrado */}
      <h1 className="main-title">Mis Tableros</h1>

      <img
        src="https://images.pexels.com/photos/7845451/pexels-photo-7845451.jpeg"
        alt="Decoración"
        className="decorative-img"
      />

      {/* Formulario para crear tablero */}
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
        <ul>
          {boards.map((board) => (
            <li key={board.id}>
              <span>{board.name}</span>
              <div>
                <button onClick={() => navigate(`/board/${board.id}`)}>
                  Entrar
                </button>
                {board.id !== 'default' && (
                  <button onClick={() => deleteBoard.mutate(board.id)}>
                    Eliminar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
