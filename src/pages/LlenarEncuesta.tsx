import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Define los tipos para encuestas, preguntas y opciones de respuesta
type Encuesta = {
  id: string;
  nombre: string;
};

type Pregunta = {
  id: string;
  texto: string;
};

type OpcionRespuesta = {
  id: string;
  texto: string;
};

const LlenarEncuesta = () => {
  const [encuestas, setEncuestas] = useState<Encuesta[]>([]);
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [opciones, setOpciones] = useState<OpcionRespuesta[]>([]);
  const [respuestas, setRespuestas] = useState<{ [key: string]: string }>({});
  const [encuestaSeleccionada, setEncuestaSeleccionada] = useState('');

  // Cargar encuestas
  const cargarEncuestas = async () => {
    const { data, error } = await supabase.from('encuestas').select('*');
    if (error) {
      console.error('Error al cargar encuestas:', error);
    } else {
      setEncuestas(data || []);
    }
  };

  // Cargar preguntas de la encuesta seleccionada
  const cargarPreguntas = async (encuestaId: string) => {
    const { data, error } = await supabase
      .from('preguntas')
      .select('*')
      .eq('encuesta_id', encuestaId);
    if (error) {
      console.error('Error al cargar preguntas:', error);
    } else {
      setPreguntas(data || []);
    }
  };

  // Cargar opciones de respuesta
  const cargarOpciones = async () => {
    const { data, error } = await supabase.from('opciones_respuesta').select('*');
    if (error) {
      console.error('Error al cargar opciones de respuesta:', error);
    } else {
      setOpciones(data || []);
    }
  };

  // Manejar el cambio de respuesta
  const manejarCambio = (preguntaId: string, opcionId: string) => {
    setRespuestas({ ...respuestas, [preguntaId]: opcionId });
  };

  // Enviar respuestas
  const enviarRespuestas = async () => {
    // Convertir las respuestas en un array para insertar en la tabla
    const respuestasArray = Object.entries(respuestas).map(([preguntaId, opcionId]) => ({
      pregunta_id: preguntaId,
      opcion_id: opcionId,
    }));

    const { error } = await supabase.from('respuestas').insert(respuestasArray);

    if (error) {
      console.error('Error al guardar las respuestas:', error);
      alert('Ocurrió un error al guardar las respuestas.');
    } else {
      alert('Respuestas enviadas con éxito.');
      setRespuestas({});
    }
  };

  // Cargar encuestas y opciones al montar el componente
  useEffect(() => {
    cargarEncuestas();
    cargarOpciones();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Llenar Encuesta</h1>
      <div className="mb-4">
        <label className="block text-sm font-medium">Encuesta</label>
        <select
          value={encuestaSeleccionada}
          onChange={(e) => {
            setEncuestaSeleccionada(e.target.value);
            cargarPreguntas(e.target.value);
          }}
          className="border rounded p-2 w-full"
        >
          <option value="">Selecciona una encuesta</option>
          {encuestas.map((encuesta) => (
            <option key={encuesta.id} value={encuesta.id}>
              {encuesta.nombre}
            </option>
          ))}
        </select>
      </div>
      {preguntas.map((pregunta) => (
        <div key={pregunta.id} className="mb-4">
          <p className="font-medium">{pregunta.texto}</p>
          <select
            value={respuestas[pregunta.id] || ''}
            onChange={(e) => manejarCambio(pregunta.id, e.target.value)}
            className="border rounded p-2 w-full"
          >
            <option value="">Selecciona una respuesta</option>
            {opciones.map((opcion) => (
              <option key={opcion.id} value={opcion.id}>
                {opcion.texto}
              </option>
            ))}
          </select>
        </div>
      ))}
      <button
        onClick={enviarRespuestas}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Enviar Respuestas
      </button>
    </div>
  );
};

export default LlenarEncuesta;