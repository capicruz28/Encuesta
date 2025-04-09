// src/pages/Dashboard.tsx (componente de layout)
import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Importamos los iconos
import { 
  FaHome, 
  FaBuilding, 
  FaClipboardList, 
  FaQuestion, 
  FaChartBar, 
  FaSignOutAlt, 
  FaBars, 
  FaTimes,
  FaEdit
} from 'react-icons/fa';

// Definimos una interfaz para las opciones del menú
interface OpcionMenu {
  ruta: string;
  nombre: string;
  icono: React.ReactNode;
  visible: boolean; // Añadimos propiedad para controlar visibilidad
}

const Dashboard = () => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [esPantallaMovil, setEsPantallaMovil] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Verificar si es una pantalla móvil
  useEffect(() => {
    const verificarTamañoPantalla = (): void => {
      const esMobil = window.innerWidth < 768;
      setEsPantallaMovil(esMobil);
    };

    // Verificar inmediatamente
    verificarTamañoPantalla();
    
    // Configurar el listener para cambios de tamaño
    window.addEventListener('resize', verificarTamañoPantalla);
    
    // Limpiar el listener cuando el componente se desmonte
    return () => {
      window.removeEventListener('resize', verificarTamañoPantalla);
    };
  }, []);

  // Cerrar sesión
  const cerrarSesion = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Opciones de menú con iconos
  const opcionesMenu: OpcionMenu[] = [
    { ruta: '/dashboard', nombre: 'Dashboard', icono: <FaHome size={20} />, visible: true },
    { ruta: '/dashboard/sectores', nombre: 'Comisarias', icono: <FaBuilding size={20} />, visible: true },
    { ruta: '/dashboard/encuestas', nombre: 'Encuestas', icono: <FaClipboardList size={20} />, visible: true },
    { ruta: '/dashboard/preguntas', nombre: 'Preguntas', icono: <FaQuestion size={20} />, visible: true },
    { ruta: '/dashboard/llenar', nombre: 'Llenar Encuesta', icono: <FaEdit size={20} />, visible: true },
    { ruta: '/dashboard/reportes', nombre: 'Reportes', icono: <FaChartBar size={20} />, visible: false }, // Oculto
  ];

  // Filtrar solo las opciones visibles para mostrar en el menú
  const opcionesVisibles = opcionesMenu.filter(opcion => opcion.visible);

  // Determinar la ruta activa
  const esRutaActiva = (ruta: string): boolean => {
    if (ruta === '/dashboard' && location.pathname === '/dashboard') {
      return true;
    }
    return location.pathname.startsWith(ruta) && ruta !== '/dashboard';
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Barra superior - visible en todas las pantallas */}
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md z-10">
        <div className="flex items-center">
          {!esPantallaMovil && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="mr-4 focus:outline-none"
              aria-label="Toggle menu"
            >
              {isCollapsed ? <FaBars size={24} /> : <FaTimes size={24} />}
            </button>
          )}
          <h1 className="text-xl font-bold">Sistema de Encuestas</h1>
        </div>
        {!esPantallaMovil && (
          <button
            onClick={cerrarSesion}
            className="flex items-center bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
          >
            <FaSignOutAlt className="mr-2" /> Cerrar Sesión
          </button>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Menú lateral - solo visible en pantallas grandes */}
        {!esPantallaMovil && (
          <aside
            className={`bg-gray-800 text-white transition-all duration-300 ${
              isCollapsed ? 'w-16' : 'w-64'
            } flex-shrink-0`}
          >
            <nav className="mt-4">
              <ul>
                {opcionesVisibles.map((opcion: OpcionMenu) => (
                  <li key={opcion.ruta}>
                    <Link 
                      to={opcion.ruta} 
                      className={`flex items-center p-4 ${
                        esRutaActiva(opcion.ruta) ? 'bg-blue-600' : 'hover:bg-gray-700'
                      }`}
                    >
                      <span className="mr-3">{opcion.icono}</span>
                      {!isCollapsed && <span>{opcion.nombre}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        )}

        {/* Contenido principal */}
        <main className="flex-1 overflow-auto p-4 pb-20">
          <Outlet />
        </main>
      </div>

      {/* Menú inferior - solo visible en pantallas móviles */}
      {esPantallaMovil && (
        <nav className="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-20 shadow-lg">
          <div className="grid grid-cols-5 h-16">
            {opcionesVisibles.map((opcion: OpcionMenu) => (
              <Link
                key={opcion.ruta}
                to={opcion.ruta}
                className={`flex flex-col items-center justify-center ${
                  esRutaActiva(opcion.ruta)
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-blue-600'
                }`}
              >
                <div>{opcion.icono}</div>
                <span className="text-xs mt-1">{opcion.nombre}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}

      {/* Botón de cerrar sesión flotante para móviles */}
      {esPantallaMovil && (
        <button
          onClick={cerrarSesion}
          className="fixed right-4 top-16 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg z-20"
          aria-label="Cerrar sesión"
        >
          <FaSignOutAlt size={20} />
        </button>
      )}
    </div>
  );
};

export default Dashboard;