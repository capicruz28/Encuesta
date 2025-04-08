import { useState } from 'react';
import { supabase } from '../supabaseClient';

const EncuestaDinamica = () => {
  const [sector, setSector] = useState('');
  const [preguntas, setPreguntas] = useState([{ pregunta: '', respuesta: '' }]);
  const [mensaje, setMensaje] = useState('');

  const agregarPregunta = () => {
    setPreguntas([...preguntas, { pregunta: '', respuesta: '' }]);
  };

  const actualizarPregunta = (index: number, campo: 'pregunta' | 'respuesta', valor: string) => {
    const nuevasPreguntas = [...preguntas];
    nuevasPreguntas[index][campo] = valor; // Ahora TypeScript sabe que 'campo' es válido
    setPreguntas(nuevasPreguntas);
  };

  const enviarRespuestas = async () => {
    const { error } = await supabase.from('respuestas').insert([
      { sector, preguntas },
    ]);
    if (error) {
      setMensaje('Error al enviar la respuesta.');
    } else {
      setMensaje('¡Respuesta enviada con éxito!');
      setSector('');
      setPreguntas([{ pregunta: '', respuesta: '' }]);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Encuesta Dinámica</h1>
      <div className="mb-4">
        <label className="block text-sm font-medium">Sector</label>
        <input
          type="text"
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          className="w-full border rounded p-2"
        />
      </div>
      {preguntas.map((pregunta, index) => (
        <div key={index} className="mb-4">
          <label className="block text-sm font-medium">Pregunta {index + 1}</label>
          <input
            type="text"
            value={pregunta.pregunta}
            onChange={(e) =>
              actualizarPregunta(index, 'pregunta', e.target.value)
            }
            placeholder="Escribe la pregunta"
            className="w-full border rounded p-2 mb-2"
          />
          <input
            type="text"
            value={pregunta.respuesta}
            onChange={(e) =>
              actualizarPregunta(index, 'respuesta', e.target.value)
            }
            placeholder="Escribe la respuesta"
            className="w-full border rounded p-2"
          />
        </div>
      ))}
      <button
        onClick={agregarPregunta}
        className="bg-gray-500 text-white px-4 py-2 rounded mb-4"
      >
        Agregar Pregunta
      </button>
      <button
        onClick={enviarRespuestas}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Enviar Respuestas
      </button>
      {mensaje && <p className="mt-4 text-green-500">{mensaje}</p>}
    </div>
  );
};

export default EncuestaDinamica;