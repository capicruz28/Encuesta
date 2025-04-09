import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';

// Define los tipos para las encuestas y preguntas
type Encuesta = {
  id: string;
  nombre: string;
  sector?: {
    nombre: string;
  };
};

type Pregunta = {
  id: string;
  texto: string;
  encuesta_id: string;
  encuesta?: {
    nombre: string;
  };
};

const Preguntas = () => {
  const [encuestas, setEncuestas] = useState<Encuesta[]>([]);
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [nuevaPregunta, setNuevaPregunta] = useState('');
  const [encuestaSeleccionada, setEncuestaSeleccionada] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [textoEditado, setTextoEditado] = useState('');
  const [encuestaEditada, setEncuestaEditada] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [confirmandoEliminacion, setConfirmandoEliminacion] = useState<string | null>(null);
  const [filtroEncuesta, setFiltroEncuesta] = useState('');

  // Función para cargar datos desde Supabase
  const cargarDatos = async () => {
    setCargando(true);
    setError('');
    try {
      // Cargar encuestas con información del sector
      const { data: encuestasData, error: encuestasError } = await supabase
        .from('encuestas')
        .select('*, sector:sector_id(nombre)')
        .order('nombre');
      
      if (encuestasError) throw encuestasError;
      
      // Cargar preguntas con información de la encuesta
      const { data: preguntasData, error: preguntasError } = await supabase
        .from('preguntas')
        .select('*, encuesta:encuesta_id(nombre)')
        .order('texto');
      
      if (preguntasError) throw preguntasError;
      
      setEncuestas(encuestasData || []);
      setPreguntas(preguntasData || []);
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
      setError('No se pudieron cargar los datos. ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  // Función para agregar una nueva pregunta
  const agregarPregunta = async () => {
    if (!nuevaPregunta.trim()) {
      setError('El texto de la pregunta no puede estar vacío');
      return;
    }
    
    if (!encuestaSeleccionada) {
      setError('Debes seleccionar una encuesta');
      return;
    }
    
    setCargando(true);
    setError('');
    try {
      const { error } = await supabase.from('preguntas').insert([
        { texto: nuevaPregunta, encuesta_id: encuestaSeleccionada },
      ]);
      
      if (error) throw error;
      
      setNuevaPregunta('');
      setEncuestaSeleccionada('');
      cargarDatos();
    } catch (error: any) {
      console.error('Error al agregar pregunta:', error);
      setError('No se pudo agregar la pregunta. ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  // Función para iniciar la edición de una pregunta
  const iniciarEdicion = (pregunta: Pregunta) => {
    setEditandoId(pregunta.id);
    setTextoEditado(pregunta.texto);
    setEncuestaEditada(pregunta.encuesta_id);
  };

  // Función para cancelar la edición
  const cancelarEdicion = () => {
    setEditandoId(null);
    setTextoEditado('');
    setEncuestaEditada('');
  };

  // Función para guardar los cambios de la edición
  const guardarEdicion = async () => {
    if (!textoEditado.trim()) {
      setError('El texto de la pregunta no puede estar vacío');
      return;
    }
    
    if (!encuestaEditada) {
      setError('Debes seleccionar una encuesta');
      return;
    }
    
    setCargando(true);
    setError('');
    try {
      const { error } = await supabase
        .from('preguntas')
        .update({ 
          texto: textoEditado,
          encuesta_id: encuestaEditada 
        })
        .eq('id', editandoId);
      
      if (error) throw error;
      
      setEditandoId(null);
      cargarDatos();
    } catch (error: any) {
      console.error('Error al actualizar pregunta:', error);
      setError('No se pudo actualizar la pregunta. ' + error.message);
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

  // Función para eliminar una pregunta
  const eliminarPregunta = async (id: string) => {
    setCargando(true);
    setError('');
    try {
      // Verificar si hay respuestas asociadas a esta pregunta
      const { data: respuestasAsociadas, error: errorConsulta } = await supabase
        .from('respuestas')
        .select('id')
        .eq('pregunta_id', id);
      
      if (errorConsulta) throw errorConsulta;
      
      if (respuestasAsociadas && respuestasAsociadas.length > 0) {
        setError(`No se puede eliminar esta pregunta porque tiene ${respuestasAsociadas.length} respuesta(s) asociada(s).`);
        setConfirmandoEliminacion(null);
        setCargando(false);
        return;
      }
      
      const { error } = await supabase
        .from('preguntas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setConfirmandoEliminacion(null);
      cargarDatos();
    } catch (error: any) {
      console.error('Error al eliminar pregunta:', error);
      setError('No se pudo eliminar la pregunta. ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  // Filtrar preguntas por encuesta
  const preguntasFiltradas = filtroEncuesta
    ? preguntas.filter(pregunta => pregunta.encuesta_id === filtroEncuesta)
    : preguntas;

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h1 className="text-2xl font-bold mb-6">Mantenimiento de Preguntas</h1>
      
      {/* Formulario para agregar nueva pregunta */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Agregar Nueva Pregunta</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Texto de la Pregunta
            </label>
            <input
              type="text"
              value={nuevaPregunta}
              onChange={(e) => setNuevaPregunta(e.target.value)}
              className="border rounded p-2 w-full"
              placeholder="Ej: ¿Cómo calificaría nuestro servicio?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Encuesta
            </label>
            <select
              value={encuestaSeleccionada}
              onChange={(e) => setEncuestaSeleccionada(e.target.value)}
              className="border rounded p-2 w-full"
            >
              <option value="">Selecciona una encuesta</option>
              {encuestas.map((encuesta) => (
                <option key={encuesta.id} value={encuesta.id}>
                  {encuesta.nombre} {encuesta.sector?.nombre ? `(${encuesta.sector.nombre})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={agregarPregunta}
          disabled={cargando}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition duration-200"
        >
          {cargando ? 'Agregando...' : 'Agregar Pregunta'}
        </button>
      </div>
      
      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {/* Filtro de preguntas por encuesta */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Filtrar por Encuesta
        </label>
        <select
          value={filtroEncuesta}
          onChange={(e) => setFiltroEncuesta(e.target.value)}
          className="border rounded p-2 w-full md:w-1/2"
        >
          <option value="">Todas las encuestas</option>
          {encuestas.map((encuesta) => (
            <option key={encuesta.id} value={encuesta.id}>
              {encuesta.nombre} {encuesta.sector?.nombre ? `(${encuesta.sector.nombre})` : ''}
            </option>
          ))}
        </select>
      </div>
      
      {/* Lista de preguntas */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          Preguntas Existentes {filtroEncuesta && '(Filtradas)'}
        </h2>
        
        {cargando && preguntas.length === 0 ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-500">Cargando preguntas...</p>
          </div>
        ) : preguntasFiltradas.length === 0 ? (
          <p className="text-gray-500 italic py-4">
            {filtroEncuesta ? 'No hay preguntas para la encuesta seleccionada.' : 'No hay preguntas registradas.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Pregunta</th>
                  <th className="py-3 px-6 text-left">Encuesta</th>
                  <th className="py-3 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm">
                {preguntasFiltradas.map((pregunta) => (
                  <tr key={pregunta.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-6 text-left">
                      {editandoId === pregunta.id ? (
                        <input
                          type="text"
                          value={textoEditado}
                          onChange={(e) => setTextoEditado(e.target.value)}
                          className="border rounded p-1 w-full"
                          autoFocus
                        />
                      ) : (
                        pregunta.texto
                      )}
                    </td>
                    <td className="py-3 px-6 text-left">
                      {editandoId === pregunta.id ? (
                        <select
                          value={encuestaEditada}
                          onChange={(e) => setEncuestaEditada(e.target.value)}
                          className="border rounded p-1 w-full"
                        >
                          <option value="">Selecciona una encuesta</option>
                          {encuestas.map((encuesta) => (
                            <option key={encuesta.id} value={encuesta.id}>
                              {encuesta.nombre} {encuesta.sector?.nombre ? `(${encuesta.sector.nombre})` : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        pregunta.encuesta?.nombre
                      )}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {editandoId === pregunta.id ? (
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
                      ) : confirmandoEliminacion === pregunta.id ? (
                        <div className="flex justify-end space-x-2">
                          <span className="text-sm text-red-600 mr-2">¿Eliminar?</span>
                          <button
                            onClick={() => eliminarPregunta(pregunta.id)}
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
                            onClick={() => iniciarEdicion(pregunta)}
                            className="text-blue-500 hover:text-blue-700"
                            title="Editar"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => iniciarEliminacion(pregunta.id)}
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

export default Preguntas;