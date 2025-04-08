import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Define los tipos para las encuestas y preguntas
type Encuesta = {
  id: string;
  nombre: string;
};

type Pregunta = {
  id: string;
  texto: string;
  encuesta_id: string;
};

const Preguntas = () => {
  const [encuestas, setEncuestas] = useState<Encuesta[]>([]);
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [nuevaPregunta, setNuevaPregunta] = useState('');
  const [encuestaSeleccionada, setEncuestaSeleccionada] = useState('');

  const cargarDatos = async () => {
    const { data: encuestasData } = await supabase.from('encuestas').select('*');
    const { data: preguntasData } = await supabase.from('preguntas').select('*');
    setEncuestas(encuestasData || []);
    setPreguntas(preguntasData || []);
  };

  const agregarPregunta = async () => {
    if (!nuevaPregunta || !encuestaSeleccionada) return;
    await supabase.from('preguntas').insert([
      { texto: nuevaPregunta, encuesta_id: encuestaSeleccionada },
    ]);
    setNuevaPregunta('');
    setEncuestaSeleccionada('');
    cargarDatos();
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Mantenimiento de Preguntas</h1>
      <div className="mb-4">
        <label className="block text-sm font-medium">Texto de la Pregunta</label>
        <input
          type="text"
          value={nuevaPregunta}
          onChange={(e) => setNuevaPregunta(e.target.value)}
          className="border rounded p-2 w-full"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium">Encuesta</label>
        <select
          value={encuestaSeleccionada}
          onChange={(e) => setEncuestaSeleccionada(e.target.value)}
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
      <button
        onClick={agregarPregunta}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Agregar Pregunta
      </button>
      <h2 className="text-xl font-bold mt-8 mb-4">Preguntas Existentes</h2>
      <ul>
        {preguntas.map((pregunta) => (
          <li key={pregunta.id} className="border-b p-2">
            {pregunta.texto}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Preguntas;