import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FaEdit, FaTrash, FaCheck, FaTimes, FaQrcode } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';

// Define los tipos para sectores y encuestas
type Sector = {
  id: string;
  nombre: string;
};

type Encuesta = {
  id: string;
  nombre: string;
  sector_id: string;
  sector?: {
    nombre: string;
  };
};

const Encuestas = () => {
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [encuestas, setEncuestas] = useState<Encuesta[]>([]);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [sectorSeleccionado, setSectorSeleccionado] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nombreEditado, setNombreEditado] = useState('');
  const [sectorEditado, setSectorEditado] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [confirmandoEliminacion, setConfirmandoEliminacion] = useState<string | null>(null);
  const [mostrandoQR, setMostrandoQR] = useState<string | null>(null);

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
      
      // Cargar encuestas con información del sector
      const { data: encuestasData, error: encuestasError } = await supabase
        .from('encuestas')
        .select('*, sector:sector_id(nombre)')
        .order('nombre');
      
      if (encuestasError) throw encuestasError;
      
      setSectores(sectoresData || []);
      setEncuestas(encuestasData || []);
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
      setError('No se pudieron cargar los datos. ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  // Función para agregar una nueva encuesta
  const agregarEncuesta = async () => {
    if (!nuevoNombre.trim()) {
      setError('El nombre de la encuesta no puede estar vacío');
      return;
    }
    
    if (!sectorSeleccionado) {
      setError('Debes seleccionar un sector');
      return;
    }
    
    setCargando(true);
    setError('');
    try {
      const { error } = await supabase.from('encuestas').insert([
        { nombre: nuevoNombre, sector_id: sectorSeleccionado },
      ]);
      
      if (error) throw error;
      
      setNuevoNombre('');
      setSectorSeleccionado('');
      cargarDatos();
    } catch (error: any) {
      console.error('Error al agregar encuesta:', error);
      setError('No se pudo agregar la encuesta. ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  // Función para iniciar la edición de una encuesta
  const iniciarEdicion = (encuesta: Encuesta) => {
    setEditandoId(encuesta.id);
    setNombreEditado(encuesta.nombre);
    setSectorEditado(encuesta.sector_id);
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
      setError('El nombre de la encuesta no puede estar vacío');
      return;
    }
    
    if (!sectorEditado) {
      setError('Debes seleccionar un sector');
      return;
    }
    
    setCargando(true);
    setError('');
    try {
      const { error } = await supabase
        .from('encuestas')
        .update({ 
          nombre: nombreEditado,
          sector_id: sectorEditado 
        })
        .eq('id', editandoId);
      
      if (error) throw error;
      
      setEditandoId(null);
      cargarDatos();
    } catch (error: any) {
      console.error('Error al actualizar encuesta:', error);
      setError('No se pudo actualizar la encuesta. ' + error.message);
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

  // Función para eliminar una encuesta
  const eliminarEncuesta = async (id: string) => {
    setCargando(true);
    setError('');
    try {
      // Primero verificamos si hay preguntas asociadas a esta encuesta
      const { data: preguntasAsociadas, error: errorConsulta } = await supabase
        .from('preguntas')
        .select('id')
        .eq('encuesta_id', id);
      
      if (errorConsulta) throw errorConsulta;
      
      if (preguntasAsociadas && preguntasAsociadas.length > 0) {
        setError(`No se puede eliminar esta encuesta porque tiene ${preguntasAsociadas.length} pregunta(s) asociada(s).`);
        setConfirmandoEliminacion(null);
        setCargando(false);
        return;
      }
      
      const { error } = await supabase
        .from('encuestas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setConfirmandoEliminacion(null);
      cargarDatos();
    } catch (error: any) {
      console.error('Error al eliminar encuesta:', error);
      setError('No se pudo eliminar la encuesta. ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  // Función para mostrar el código QR de una encuesta
  const mostrarQR = (id: string) => {
    setMostrandoQR(id);
  };

  // Función para cerrar el modal del QR
  const cerrarQR = () => {
    setMostrandoQR(null);
  };

  // Función para generar la URL de la encuesta
  const generarURLEncuesta = (id: string) => {
    // Usa la URL base de tu aplicación
    return `${window.location.origin}/responder-encuesta/${id}`;
  };

  // Función para descargar el código QR como imagen
  const descargarQR = () => {
    if (!mostrandoQR) return;
    
    const svgElement = document.getElementById('qr-code-canvas');
    if (!svgElement) return;
    
    // Crear un canvas temporal
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const img = new Image();
    
    // Convertir SVG a imagen
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      // Configurar el canvas con el tamaño adecuado
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Dibujar la imagen en el canvas
      ctx?.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      
      // Convertir el canvas a PNG y descargar
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `qr-encuesta-${mostrandoQR}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    
    img.src = url;
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h1 className="text-2xl font-bold mb-6">Mantenimiento de Encuestas</h1>
      
      {/* Formulario para agregar nueva encuesta */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Agregar Nueva Encuesta</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Encuesta
            </label>
            <input
              type="text"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              className="border rounded p-2 w-full"
              placeholder="Ej: Encuesta de satisfacción"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sector
            </label>
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
        </div>
        <button
          onClick={agregarEncuesta}
          disabled={cargando}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition duration-200"
        >
          {cargando ? 'Agregando...' : 'Crear Encuesta'}
        </button>
      </div>
      
      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {/* Lista de encuestas */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Encuestas Existentes</h2>
        
        {cargando && encuestas.length === 0 ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-500">Cargando encuestas...</p>
          </div>
        ) : encuestas.length === 0 ? (
          <p className="text-gray-500 italic py-4">No hay encuestas registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Nombre</th>
                  <th className="py-3 px-6 text-left">Sector</th>
                  <th className="py-3 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm">
                {encuestas.map((encuesta) => (
                  <tr key={encuesta.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-6 text-left">
                      {editandoId === encuesta.id ? (
                        <input
                          type="text"
                          value={nombreEditado}
                          onChange={(e) => setNombreEditado(e.target.value)}
                          className="border rounded p-1 w-full"
                          autoFocus
                        />
                      ) : (
                        encuesta.nombre
                      )}
                    </td>
                    <td className="py-3 px-6 text-left">
                      {editandoId === encuesta.id ? (
                        <select
                          value={sectorEditado}
                          onChange={(e) => setSectorEditado(e.target.value)}
                          className="border rounded p-1 w-full"
                        >
                          <option value="">Selecciona un sector</option>
                          {sectores.map((sector) => (
                            <option key={sector.id} value={sector.id}>
                              {sector.nombre}
                            </option>
                          ))}
                        </select>
                      ) : (
                        encuesta.sector?.nombre
                      )}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {editandoId === encuesta.id ? (
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
                      ) : confirmandoEliminacion === encuesta.id ? (
                        <div className="flex justify-end space-x-2">
                          <span className="text-sm text-red-600 mr-2">¿Eliminar?</span>
                          <button
                            onClick={() => eliminarEncuesta(encuesta.id)}
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
                            onClick={() => iniciarEdicion(encuesta)}
                            className="text-blue-500 hover:text-blue-700"
                            title="Editar"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => iniciarEliminacion(encuesta.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Eliminar"
                          >
                            <FaTrash />
                          </button>
                          <button
                            onClick={() => mostrarQR(encuesta.id)}
                            className="text-purple-500 hover:text-purple-700"
                            title="Generar QR"
                          >
                            <FaQrcode />
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

      {/* Modal para mostrar el código QR */}
      {mostrandoQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">
              Código QR para la encuesta
            </h3>
            <div className="flex flex-col items-center mb-4">
              <QRCodeSVG
                id="qr-code-canvas"
                value={generarURLEncuesta(mostrandoQR)}
                size={250}
                level="H"
                includeMargin={true}
              />
              <p className="mt-4 text-sm text-gray-600 text-center">
                Escanea este código QR para acceder a la encuesta o comparte el siguiente enlace:
              </p>
              <a 
                href={generarURLEncuesta(mostrandoQR)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline mt-2 text-sm break-all"
              >
                {generarURLEncuesta(mostrandoQR)}
              </a>
            </div>
            <div className="flex justify-between">
              <button
                onClick={descargarQR}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition duration-200"
              >
                Descargar QR
              </button>
              <button
                onClick={cerrarQR}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition duration-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Encuestas;