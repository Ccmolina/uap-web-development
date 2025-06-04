import { useUIStore } from '../stores/uiStore';
import { Link } from 'react-router-dom';

export default function Settings() {
  const config = useUIStore((state) => state.config);
  const updateConfig = useUIStore((state) => state.updateConfig);

  return (
    <main>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/">← Volver a Tableros</Link>
      </div>

      <h1>Configuración</h1>

      <label>
        Intervalo de actualización (ms):
        <input
          type="number"
          value={config.refetchInterval}
          onChange={(e) => updateConfig({ refetchInterval: Number(e.target.value) })}
        />
      </label>

      <label style={{ display: 'block', marginTop: '1rem' }}>
        <input
          type="checkbox"
          checked={config.uppercase}
          onChange={(e) => updateConfig({ uppercase: e.target.checked })}
        />
        Mostrar descripciones en MAYÚSCULAS
      </label>
    </main>
  );
}
