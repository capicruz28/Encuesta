import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';

// Define los tipos para sectores y secciones
type Sector = {
  id: string;
  nombre: string;
};

type Seccion = {
  id: string;
  nombre: string;
  sector_id: string;
  sector?: {
    nombre: string;
  };
};

const Secciones = () => {
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [sectorSeleccionado, setSectorSeleccionado] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nombreEditado, setNombreEditado] = useState('');
  const [sectorEditado, setSectorEditado] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [confirmandoEliminacion, setConfirmandoEliminacion] = useState<string | null>(null);

  // Función para cargar datos desde Supabase
  const cargarDatos = async () => {
    setCargando(true);
    setError('');
    try {
      // Cargar sectores
      const { data: sectoresData, error: sectoresError } = await supabase
        .from('sectores')
        .select('*')
        .order('nombre');
      
      if (sectoresError) throw sectoresError;
      
      // Cargar secciones con información del sector
      const { data: seccionesData, error: seccionesError } = await supabase
        .from('secciones')
        .select('*, sector:sector_id(nombre)')
        .order('nombre');
      
      if (seccionesError) throw seccionesError;
      
      setSectores(sectoresData || []);
      setSecciones(seccionesData || []);
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
      setError('No se pudieron cargar los datos. ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  // Función para agregar una nueva sección
  const agregarSeccion = async () => {
    if (!nuevoNombre.trim()) {
      setError('El nombre de la sección no puede estar vacío');
      return;
    }
    
    if (!sectorSeleccionado) {
      setError('Debes seleccionar una comisaria');
      return;
    }
    
    setCargando(true);
    setError('');
    try {
      const { error } = await supabase.from('secciones').insert([
        { nombre: nuevoNombre, sector_id: sectorSeleccionado },
      ]);
      
      if (error) throw error;
      
      setNuevoNombre('');
      setSectorSeleccionado('');
      cargarDatos();
    } catch (error: any) {
      console.error('Error al agregar sección:', error);
      setError('No se pudo agregar la sección. ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  // Función para iniciar la edición de una sección
  const iniciarEdicion = (seccion: Seccion) => {
    setEditandoId(seccion.id);
    setNombreEditado(seccion.nombre);
    setSectorEditado(seccion.sector_id);
  };

  // Función para cancelar la edición
  const cancelarEdicion = () => {
    setEditandoId(null);
    setNombreEditado('');
    setSectorEditado('');
  };

  // Función para guardar los cambios de la edición
  const guardarEdicion = async () => {
    if (!nombreEditado.trim()) {
      setError('El nombre de la sección no puede estar vacío');
      return;
    }
    
    if (!sectorEditado) {
      setError('Debes seleccionar una comisaria');
      return;
    }
    
    setCargando(true);
    setError('');
    try {
      const { error } = await supabase
        .from('secciones')
        .update({ 
          nombre: nombreEditado,
          sector_id: sectorEditado 
        })
        .eq('id', editandoId);
      
      if (error) throw error;
      
      setEditandoId(null);
      cargarDatos();
    } catch (error: any) {
      console.error('Error al actualizar sección:', error);
      setError('No se pudo actualizar la sección. ' + error.message);
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

  // Función para eliminar una sección
  const eliminarSeccion = async (id: string) => {
    setCargando(true);
    setError('');
    try {
      // Primero verificamos si hay respuestas asociadas a esta sección
      const { data: respuestasAsociadas, error: errorConsulta } = await supabase
        .from('respuestas')
        .select('id')
        .eq('seccion_id', id);
      
      if (errorConsulta) throw errorConsulta;
      
      if (respuestasAsociadas && respuestasAsociadas.length > 0) {
        setError(`No se puede eliminar esta sección porque tiene ${respuestasAsociadas.length} respuesta(s) asociada(s).`);
        setConfirmandoEliminacion(null);
        setCargando(false);
        return;
      }
      
      const { error } = await supabase
        .from('secciones')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setConfirmandoEliminacion(null);
      cargarDatos();
    } catch (error: any) {
      console.error('Error al eliminar sección:', error);
      setError('No se pudo eliminar la sección. ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h1 className="text-2xl font-bold mb-6">Mantenimiento de Secciones</h1>
      
      {/* Formulario para agregar nueva sección */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Agregar Nueva Sección</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Sección
            </label>
            <input
              type="text"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              className="border rounded p-2 w-full"
              placeholder="Ej: Familia"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comisaria
            </label>
            <select
              value={sectorSeleccionado}
              onChange={(e) => setSectorSeleccionado(e.target.value)}
              className="border rounded p-2 w-full"
            >
              <option value="">Selecciona una comisaria</option>
              {sectores.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={agregarSeccion}
          disabled={cargando}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition duration-200"
        >
          {cargando ? 'Agregando...' : 'Crear Sección'}
        </button>
      </div>
      
      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {/* Lista de secciones */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Secciones Existentes</h2>
        
        {cargando && secciones.length === 0 ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-500">Cargando secciones...</p>
          </div>
        ) : secciones.length === 0 ? (
          <p className="text-gray-500 italic py-4">No hay secciones registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Nombre</th>
                  <th className="py-3 px-6 text-left">Comisaria</th>
                  <th className="py-3 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm">
                {secciones.map((seccion) => (
                  <tr key={seccion.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-6 text-left">
                      {editandoId === seccion.id ? (
                        <input
                          type="text"
                          value={nombreEditado}
                          onChange={(e) => setNombreEditado(e.target.value)}
                          className="border rounded p-1 w-full"
                          autoFocus
                        />
                      ) : (
                        seccion.nombre
                      )}
                    </td>
                    <td className="py-3 px-6 text-left">
                      {editandoId === seccion.id ? (
                        <select
                          value={sectorEditado}
                          onChange={(e) => setSectorEditado(e.target.value)}
                          className="border rounded p-1 w-full"
                        >
                          <option value="">Selecciona una comisaria</option>
                          {sectores.map((sector) => (
                            <option key={sector.id} value={sector.id}>
                              {sector.nombre}
                            </option>
                          ))}
                        </select>
                      ) : (
                        seccion.sector?.nombre
                      )}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {editandoId === seccion.id ? (
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
                      ) : confirmandoEliminacion === seccion.id ? (
                        <div className="flex justify-end space-x-2">
                          <span className="text-sm text-red-600 mr-2">¿Eliminar?</span>
                          <button
                            onClick={() => eliminarSeccion(seccion.id)}
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
                            onClick={() => iniciarEdicion(seccion)}
                            className="text-blue-500 hover:text-blue-700"
                            title="Editar"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => iniciarEliminacion(seccion.id)}
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

export default Secciones;