import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useParams, Link } from 'react-router-dom';
import { useTasks } from './hooks/useTasks';
import { useUIStore } from './stores/uiStore';

function App({ usuarioAutenticadoId }) {
  const { boardId } = useParams();
  const boardIdNum = parseInt(boardId, 10);
  const [newTask, setNewTask] = useState('');
  const [editValue, setEditValue] = useState('');
  const [page, setPage] = useState(1);
  const limit = 5;

  const config = useUIStore((state) => state.config);
  const isEditing = useUIStore((state) => state.isEditing);
  const setEditing = useUIStore((state) => state.setEditing);
  const clearEditing = useUIStore((state) => state.clearEditing);

  useEffect(() => {
    localStorage.setItem('lastBoardId', boardIdNum);
  }, [boardIdNum]);

  const {
    tasks,
    totalCount,
    isLoading,
    isError,
    addTask,
    toggleTask,
    deleteTask,
    editTask,
  } = useTasks(page, limit, boardIdNum);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  const handleAdd = () => {
    if (!newTask.trim()) return;
    addTask.mutate(
      { titulo: newTask.trim(), tableroId: boardIdNum },
      {
        onSuccess: () => {
          toast.success('Tarea agregada');
          setNewTask('');
        },
        onError: () => toast.error('Error al agregar tarea'),
      }
    );
  };

  const handleSave = (id) => {
    if (!editValue.trim()) return;
    editTask.mutate(
      { id, titulo: editValue.trim() },
      {
        onSuccess: () => {
          toast.success('Tarea editada');
          clearEditing();
        },
        onError: () => toast.error('Error al editar tarea'),
      }
    );
  };

  return (
    <div className="background">
      <main>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <Link to="/">← Volver a Tableros</Link>
          <Link to="/config" className="config-button">
            ⚙️ Configuración
          </Link>
        </div>

        <h1
          style={{
            textAlign: 'center',
            fontFamily: 'Times New Roman',
            color: '#d6336c',
          }}
        >
          Tablero: <span style={{ textTransform: 'capitalize' }}>{boardIdNum}</span>
        </h1>

        <img
          src="https://images.pexels.com/photos/7845451/pexels-photo-7845451.jpeg"
          alt="Decoración"
          className="decorative-img"
        />

        <div className="form-container">
          <input
            type="text"
            placeholder="Nueva tarea"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
            }}
          />
          <button onClick={handleAdd}>Agregar</button>
        </div>

        {isLoading && <p>Cargando tareas...</p>}
        {isError && <p>Error al cargar tareas</p>}

        <ul>
          {tasks?.map((task) => (
            <li key={task.id}>
              {isEditing === task.id ? (
                <>
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                  />
                  <div>
                    <button onClick={() => handleSave(task.id)}>Guardar</button>
                    <button onClick={clearEditing}>Cancelar</button>
                  </div>
                </>
              ) : (
                <>
                  <span>
                    {config.uppercase ? task.titulo.toUpperCase() : task.titulo}
                    {task.completada ? ' ✅' : ''}
                  </span>
                  <div>
                    <button onClick={() => toggleTask.mutate(task)}>
                      {task.completada ? 'Desmarcar' : 'Completar'}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(task.id);
                        setEditValue(task.titulo);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() =>
                        deleteTask.mutate(task.id, {
                          onSuccess: () => toast.success('Tarea eliminada'),
                          onError: () => toast.error('Error al eliminar tarea'),
                        })
                      }
                    >
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1}>
            Anterior
          </button>
          <span style={{ margin: '0 1rem' }}>
            Página {page} de {totalPages}
          </span>
          <button onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages}>
            Siguiente
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
