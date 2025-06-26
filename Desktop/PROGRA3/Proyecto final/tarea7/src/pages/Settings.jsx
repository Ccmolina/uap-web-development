import { useUIStore } from '../stores/uiStore';
import { Link, useNavigate } from 'react-router-dom';

export default function Settings() {
  const config = useUIStore((state) => state.config);
  const updateConfig = useUIStore((state) => state.updateConfig);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token'); // Borra el token JWT
    navigate('/login'); // Redirige al login
  };

  return (
    <main>
      {/* Volver a tableros */}
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/">← Volver a Tableros</Link>
      </div>

      <h1>Configuración</h1>

      {/* Intervalo de actualización */}
      <label>
        Intervalo de actualización (ms):
        <input
          type="number"
          value={config.refetchInterval}
          onChange={(e) =>
            updateConfig({ refetchInterval: Number(e.target.value) })
          }
        />
      </label>

      {/* Mayúsculas */}
      <label style={{ display: 'block', marginTop: '1rem' }}>
        <input
          type="checkbox"
          checked={config.uppercase}
          onChange={(e) => updateConfig({ uppercase: e.target.checked })}
        />
        Mostrar descripciones en MAYÚSCULAS
      </label>

      {/* Botón de cerrar sesión */}
      <button
        onClick={handleLogout}
        style={{
          marginTop: '2rem',
          backgroundColor: '#d6336c',
          color: 'white',
          padding: '0.6rem 1rem',
          borderRadius: '10px',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Cerrar sesión
      </button>
    </main>
  );
}
