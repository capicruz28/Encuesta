import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';

const Dashboard = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen">
      {/* Menú lateral */}
      <div
        className={`bg-gray-800 text-white ${
          isCollapsed ? 'w-16' : 'w-64'
        } transition-all duration-300`}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-4 focus:outline-none"
        >
          {isCollapsed ? '☰' : 'Cerrar'}
        </button>
        <nav className="mt-4">
          <ul>
            <li>
              <Link to="/dashboard/sectores" className="block p-4 hover:bg-gray-700">
                Sectores
              </Link>
            </li>
            <li>
              <Link to="/dashboard/encuestas" className="block p-4 hover:bg-gray-700">
                Encuestas
              </Link>
            </li>
            <li>
              <Link to="/dashboard/preguntas" className="block p-4 hover:bg-gray-700">
                Preguntas
              </Link>
            </li>
            <li>
              <Link to="/dashboard/llenar" className="block p-4 hover:bg-gray-700">
                Llenar Encuesta
              </Link>
            </li>
            <li>
              <Link to="/dashboard/reportes" className="block p-4 hover:bg-gray-700">
                Reportes
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 bg-gray-100 p-4">
        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard;