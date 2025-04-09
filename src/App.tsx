// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DashboardPage from './pages/DashboardPage';
import Sectores from './pages/Sectores';
import Encuestas from './pages/Encuestas';
import Preguntas from './pages/Preguntas';
import LlenarEncuesta from './pages/LlenarEncuesta';
import Reportes from './pages/Reportes';
import ResponderEncuesta from './pages/ResponderEncuesta'; // Importamos el nuevo componente

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta pública para responder encuestas */}
        <Route path="/responder-encuesta/:id" element={<ResponderEncuesta />} />
        
        {/* Rutas existentes */}
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<DashboardPage />} />
          <Route path="sectores" element={<Sectores />} />
          <Route path="encuestas" element={<Encuestas />} />
          <Route path="preguntas" element={<Preguntas />} />
          <Route path="llenar" element={<LlenarEncuesta />} />
          <Route path="reportes" element={<Reportes />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;