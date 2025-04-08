import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    // Validar que los campos no estén vacíos
    if (!username || !password) {
      setError('Por favor, ingresa usuario y contraseña.');
      return;
    }

    try {
      // Consultar la tabla `usuarios` en Supabase
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !data) {
        setError('Usuario o contraseña incorrectos.');
      } else {
        // Redirigir al dashboard si el login es exitoso
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      setError('Ocurrió un error al iniciar sesión.');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h1 className="text-2xl font-bold mb-4">Iniciar Sesión</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="mb-4">
          <label className="block text-sm font-medium">Usuario</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>
        <button
          onClick={handleLogin}
          className="bg-blue-500 text-white px-4 py-2 rounded w-full"
        >
          Iniciar Sesión
        </button>
      </div>
    </div>
  );
};

export default Login;