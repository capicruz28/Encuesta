import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';

// Define el tipo para los sectores
type Sector = {
  id: string;
  nombre: string;
  created_at: string;
};

const Sectores = () => {
  const [sectores, setSectores] = useState<Sector[]>([]); 
  const [nuevoSector, setNuevoSector] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nombreEditado, setNombreEditado] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [confirmandoEliminacion, setConfirmandoEliminacion] = useState<string | null>(null);

  // Función para cargar los sectores desde Supabase
  const cargarSectores = async () => {
    setCargando(true);
    setError('');
    try {
      const { data, error } = await supabase.from('sectores').select('*').order('nombre');
      if (error) {
        throw error;
      }
      setSectores(data || []);
    } catch (error: any) {
      console.error('Error al cargar comisarias:', error);
      setError('No se pudieron cargar los comisarias. ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  // Función para agregar un nuevo sector
  const agregarSector = async () => {
    if (nuevoSector.trim() === '') {
      setError('El nombre de la comisaria no puede estar vacío');
      return;
    }
    
    setCargando(true);
    setError('');
    try {
      const { error } = await supabase.from('sectores').insert([{ nombre: nuevoSector }]);
      if (error) {
        throw error;
      }
      setNuevoSector('');
      cargarSectores();
    } catch (error: any) {
      console.error('Error al agregar comisaria:', error);
      setError('No se pudo agregar la comisaria. ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  // Función para iniciar la edición de un sector
  const iniciarEdicion = (sector: Sector) => {
    setEditandoId(sector.id);
    setNombreEditado(sector.nombre);
  };

  // Función para cancelar la edición
  const cancelarEdicion = () => {
    setEditandoId(null);
    setNombreEditado('');
  };

  // Función para guardar los cambios de la edición
  const guardarEdicion = async () => {
    if (nombreEditado.trim() === '') {
      setError('El nombre de la comisaria no puede estar vacío');
      return;
    }
    
    setCargando(true);
    setError('');
    try {
      const { error } = await supabase
        .from('sectores')
        .update({ nombre: nombreEditado })
        .eq('id', editandoId);
      
      if (error) {
        throw error;
      }
      
      setEditandoId(null);
      cargarSectores();
    } catch (error: any) {
      console.error('Error al actualizar comisaria:', error);
      setError('No se pudo actualizar la comisaria. ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  // Función para iniciar la confirmación de eliminación
  const iniciarEliminacion = (id: string) => {
    setConfirmandoEliminacion(id);
  };

  // Función para cancelar la eliminación
  const cancelarEliminacion = () => {
    setConfirmandoEliminacion(null);
  };

  // Función para eliminar un sector
  const eliminarSector = async (id: string) => {
    setCargando(true);
    setError('');
    try {
      // Primero verificamos si hay encuestas asociadas a este sector
      const { data: encuestasAsociadas, error: errorConsulta } = await supabase
        .from('encuestas')
        .select('id')
        .eq('sector_id', id);
      
      if (errorConsulta) {
        throw errorConsulta;
      }
      
      if (encuestasAsociadas && encuestasAsociadas.length > 0) {
        setError(`No se puede eliminar esta comisaria porque tiene ${encuestasAsociadas.length} encuesta(s) asociada(s).`);
        setConfirmandoEliminacion(null);
        setCargando(false);
        return;
      }
      
      const { error } = await supabase
        .from('sectores')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setConfirmandoEliminacion(null);
      cargarSectores();
    } catch (error: any) {
      console.error('Error al eliminar comisaria:', error);
      setError('No se pudo eliminar la comisaria. ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  // Cargar los sectores al montar el componente
  useEffect(() => {
    cargarSectores();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h1 className="text-2xl font-bold mb-6">Mantenimiento de Comisarias</h1>
      
      {/* Formulario para agregar nuevo sector */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Agregar Nueva Comisaria</h2>
        <div className="flex flex-col md:flex-row gap-2">
          <input
            type="text"
            value={nuevoSector}
            onChange={(e) => setNuevoSector(e.target.value)}
            placeholder="Nombre de la comisaria"
            className="flex-1 border rounded p-2"
          />
          <button
            onClick={agregarSector}
            disabled={cargando}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition duration-200"
          >
            {cargando ? 'Agregando...' : 'Agregar Comisaria'}
          </button>
        </div>
      </div>
      
      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {/* Lista de sectores */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Comisarias Existentes</h2>
        
        {cargando && sectores.length === 0 ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-500">Cargando comisarias...</p>
          </div>
        ) : sectores.length === 0 ? (
          <p className="text-gray-500 italic py-4">No hay comisarias registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Nombre</th>
                  <th className="py-3 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm">
                {sectores.map((sector) => (
                  <tr key={sector.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-6 text-left">
                      {editandoId === sector.id ? (
                        <input
                          type="text"
                          value={nombreEditado}
                          onChange={(e) => setNombreEditado(e.target.value)}
                          className="border rounded p-1 w-full"
                          autoFocus
                        />
                      ) : (
                        sector.nombre
                      )}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {editandoId === sector.id ? (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={guardarEdicion}
                            className="text-green-500 hover:text-green-700"
                            title="Guardar"
                          >
                            <FaCheck />
                          </button>
                          <button
                            onClick={cancelarEdicion}
                            className="text-red-500 hover:text-red-700"
                            title="Cancelar"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ) : confirmandoEliminacion === sector.id ? (
                        <div className="flex justify-end space-x-2">
                          <span className="text-sm text-red-600 mr-2">¿Eliminar?</span>
                          <button
                            onClick={() => eliminarSector(sector.id)}
                            className="text-green-500 hover:text-green-700"
                            title="Confirmar"
                          >
                            <FaCheck />
                          </button>
                          <button
                            onClick={cancelarEliminacion}
                            className="text-red-500 hover:text-red-700"
                            title="Cancelar"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => iniciarEdicion(sector)}
                            className="text-blue-500 hover:text-blue-700"
                            title="Editar"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => iniciarEliminacion(sector.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Eliminar"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sectores;