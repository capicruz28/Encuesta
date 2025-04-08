import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Define los tipos para sectores y encuestas
type Sector = {
  id: string;
  nombre: string;
};

type Encuesta = {
  id: string;
  nombre: string;
  sector_id: string;
};

const Encuestas = () => {
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [encuestas, setEncuestas] = useState<Encuesta[]>([]);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [sectorSeleccionado, setSectorSeleccionado] = useState('');

  const cargarDatos = async () => {
    const { data: sectoresData } = await supabase.from('sectores').select('*');
    const { data: encuestasData } = await supabase.from('encuestas').select('*');
    setSectores(sectoresData || []);
    setEncuestas(encuestasData || []);
  };

  const agregarEncuesta = async () => {
    if (!nuevoNombre || !sectorSeleccionado) return;
    await supabase.from('encuestas').insert([
      { nombre: nuevoNombre, sector_id: sectorSeleccionado },
    ]);
    setNuevoNombre('');
    setSectorSeleccionado('');
    cargarDatos();
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Mantenimiento de Encuestas</h1>
      <div className="mb-4">
        <label className="block text-sm font-medium">Nombre de la Encuesta</label>
        <input
          type="text"
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
          className="border rounded p-2 w-full"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium">Sector</label>
        <select
          value={sectorSeleccionado}
          onChange={(e) => setSectorSeleccionado(e.target.value)}
          className="border rounded p-2 w-full"
        >
          <option value="">Selecciona un sector</option>
          {sectores.map((sector) => (
            <option key={sector.id} value={sector.id}>
              {sector.nombre}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={agregarEncuesta}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Crear Encuesta
      </button>
      <h2 className="text-xl font-bold mt-8 mb-4">Encuestas Existentes</h2>
      <ul>
        {encuestas.map((encuesta) => (
          <li key={encuesta.id} className="border-b p-2">
            {encuesta.nombre}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Encuestas;