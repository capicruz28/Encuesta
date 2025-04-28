import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Define los tipos para las preguntas y respuestas
type Pregunta = {
  id: string;
  texto: string;
  encuesta_id: string;
};

type Encuesta = {
  id: string;
  nombre: string;
  sector?: {
    nombre: string;
  };
};

type OpcionRespuesta = {
  id: string;
  texto: string;
};

const ResponderEncuesta = () => {
  const { id } = useParams<{ id: string }>();
  const [encuesta, setEncuesta] = useState<Encuesta | null>(null);
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [respuestas, setRespuestas] = useState<{ [key: string]: number }>({});
  const [opciones, setOpciones] = useState<OpcionRespuesta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  // Función para cargar la encuesta, preguntas y opciones de respuesta
  const cargarDatos = async () => {
    if (!id) return;
    
    setCargando(true);
    setError('');
    try {
      // Cargar información de la encuesta
      const { data: encuestaData, error: encuestaError } = await supabase
        .from('encuestas')
        .select('*, sector:sector_id(nombre)')
        .eq('id', id)
        .single();
      
      if (encuestaError) throw encuestaError;
      if (!encuestaData) throw new Error('Encuesta no encontrada');
      
      // Cargar preguntas de la encuesta
      const { data: preguntasData, error: preguntasError } = await supabase
        .from('preguntas')
        .select('*')
        .eq('encuesta_id', id)
        .order('texto');
      
      if (preguntasError) throw preguntasError;
      
      // Cargar opciones de respuesta
      const { data: opcionesData, error: opcionesError } = await supabase
        .from('opciones_respuesta')
        .select('*')
        .order('texto');
      
      if (opcionesError) throw opcionesError;
      
      setEncuesta(encuestaData);
      setPreguntas(preguntasData || []);
      setOpciones(opcionesData || []);
      
      // Inicializar respuestas con valor 0
      const respuestasIniciales: { [key: string]: number } = {};
      preguntasData?.forEach(pregunta => {
        respuestasIniciales[pregunta.id] = 0;
      });
      setRespuestas(respuestasIniciales);
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
      setError('No se pudieron cargar los datos. ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  // Función para manejar el cambio en las respuestas
  const handleRespuestaChange = (preguntaId: string, valor: number) => {
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: valor
    }));
  };

  // Función para enviar las respuestas (CORREGIDA)
  const enviarRespuestas = async () => {
    if (!id || !encuesta || opciones.length < 5) return;
    
    // Verificar que todas las preguntas tengan respuesta
    const preguntasSinResponder = preguntas.filter(pregunta => respuestas[pregunta.id] === 0);
    if (preguntasSinResponder.length > 0) {
      setError(`Por favor responde todas las preguntas antes de enviar.`);
      return;
    }
    
    setEnviando(true);
    setError('');
    try {
      // Crear un mapa de valor numérico a ID de opción basado en el texto
      const opcionesMap: { [key: number]: string } = {};
      
      // Mapeo explícito de valores a textos de opciones
      const textoAValor: { [key: string]: number } = {
        'Muy malo': 1,
        'Malo': 2,
        'Regular': 3,
        'Bueno': 4,
        'Muy bueno': 5
      };
      
      // Crear el mapa inverso: de valor numérico a ID de opción
      opciones.forEach(opcion => {
        const valor = textoAValor[opcion.texto];
        if (valor) {
          opcionesMap[valor] = opcion.id;
        }
      });
      
      console.log("Mapa de opciones:", opcionesMap); // Para depuración
      
      // Crear un registro para cada respuesta
      const respuestasParaInsertar = Object.entries(respuestas)
        .filter(([_, valor]) => valor !== 0)
        .map(([preguntaId, valor]) => ({
          pregunta_id: preguntaId,
          opcion_id: opcionesMap[valor] // Usar el UUID correspondiente al valor numérico
        }));
      
      console.log("Respuestas a insertar:", respuestasParaInsertar); // Para depuración
      
      const { error } = await supabase
        .from('respuestas')
        .insert(respuestasParaInsertar);
      
      if (error) throw error;
      
      setExito(true);
    } catch (error: any) {
      console.error('Error al enviar respuestas:', error);
      setError('No se pudieron enviar las respuestas. ' + error.message);
    } finally {
      setEnviando(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, [id]);

  // Si se está cargando, mostrar indicador
  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando encuesta...</p>
        </div>
      </div>
    );
  }

  // Si hay un error, mostrarlo
  if (error && !exito) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-6 max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition duration-200"
          >
            Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  // Si se enviaron las respuestas con éxito
  if (exito) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-6 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-green-600 mb-2">¡Gracias por tu participación!</h1>
          <p className="text-gray-700 mb-6">Tus respuestas han sido registradas correctamente.</p>
        </div>
      </div>
    );
  }

  // Renderizar la encuesta
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-2">{encuesta?.nombre}</h1>
        {encuesta?.sector?.nombre && (
          <p className="text-gray-600 mb-6">Comisaria: {encuesta.sector.nombre}</p>
        )}
        
        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            <p>{error}</p>
          </div>
        )}
        
        {/* Lista de preguntas */}
        <div className="space-y-6 mb-8">
          {preguntas.length === 0 ? (
            <p className="text-gray-500 italic">Esta encuesta no tiene preguntas.</p>
          ) : (
            preguntas.map((pregunta, index) => (
              <div key={pregunta.id} className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-4">
                  {index + 1}. {pregunta.texto}
                </h3>
                
                {/* Escala de valoración mejorada para móviles */}
                <div className="mb-4">
                  <div className="grid grid-cols-5 text-center text-xs mb-2">
                    <div className="text-red-500">Muy<br/>Malo</div>
                    <div className="text-red-400">Malo</div>
                    <div className="text-yellow-500">Regular</div>
                    <div className="text-green-400">Bueno</div>
                    <div className="text-green-500">Muy<br/>Bueno</div>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { valor: 1, texto: 'Muy malo' },
                      { valor: 2, texto: 'Malo' },
                      { valor: 3, texto: 'Regular' },
                      { valor: 4, texto: 'Bueno' },
                      { valor: 5, texto: 'Muy bueno' }
                    ].map(({ valor, texto }) => (
                      <button
                        key={valor}
                        onClick={() => handleRespuestaChange(pregunta.id, valor)}
                        className={`h-12 rounded-full flex items-center justify-center transition-colors ${
                          respuestas[pregunta.id] === valor
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                        aria-label={texto}
                        title={texto}
                      >
                        <span className="text-lg font-bold">{valor}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Botón para enviar respuestas */}
        {preguntas.length > 0 && (
          <div className="flex justify-center">
            <button
              onClick={enviarRespuestas}
              disabled={enviando || opciones.length < 5}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition duration-200 disabled:opacity-50"
            >
              {enviando ? 'Enviando...' : 'Enviar Respuestas'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponderEncuesta;