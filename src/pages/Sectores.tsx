import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Define el tipo para los sectores
type Sector = {
  id: string;
  nombre: string;
  created_at: string;
};

const Sectores = () => {
  const [sectores, setSectores] = useState<Sector[]>([]); // Estado con tipo Sector[]
  const [nuevoSector, setNuevoSector] = useState('');

  // Función para cargar los sectores desde Supabase
  const cargarSectores = async () => {
    const { data, error } = await supabase.from('sectores').select('*');
    if (error) {
      console.error('Error al cargar sectores:', error);
    } else {
      setSectores(data || []); // Actualiza el estado con los datos obtenidos
    }
  };

  // Función para agregar un nuevo sector
  const agregarSector = async () => {
    if (nuevoSector.trim() === '') return; // Validación simple
    const { error } = await supabase.from('sectores').insert([{ nombre: nuevoSector }]);
    if (error) {
      console.error('Error al agregar sector:', error);
    } else {
      setNuevoSector(''); // Limpia el campo de texto
      cargarSectores(); // Recarga los sectores
    }
  };

  // Cargar los sectores al montar el componente
  useEffect(() => {
    cargarSectores();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Mantenimiento de Sectores</h1>
      <div className="mb-4">
        <input
          type="text"
          value={nuevoSector}
          onChange={(e) => setNuevoSector(e.target.value)}
          placeholder="Nuevo sector"
          className="border rounded p-2 w-full"
        />
        <button
          onClick={agregarSector}
          className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
        >
          Agregar Sector
        </button>
      </div>
      <h2 className="text-xl font-bold mt-8 mb-4">Sectores Existentes</h2>
      <ul>
        {sectores.map((sector) => (
          <li key={sector.id} className="border-b p-2">
            {sector.nombre}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sectores;