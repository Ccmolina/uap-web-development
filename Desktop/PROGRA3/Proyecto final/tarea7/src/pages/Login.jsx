import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('token'); // Limpia token viejo al cargar login
    localStorage.removeItem('usuarioAutenticadoId'); // Limpia id usuario viejo también
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, clave });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('usuarioAutenticadoId', res.data.usuario.id); // Guardar id del usuario
      toast.success('Inicio de sesión exitoso');
      navigate('/');
    } catch (error) {
      toast.error('Credenciales incorrectas');
    }
  };

  return (
    <div className="background">
      <main className="login-card">
        <img
          src="https://cdn-icons-png.flaticon.com/512/747/747376.png"
          alt="Icono de usuario"
          className="login-icon"
        />
        <h1 className="main-title">Iniciar sesión</h1>
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Clave"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            required
          />
          <button type="submit">Entrar</button>
        </form>
      </main>
    </div>
  );
}
