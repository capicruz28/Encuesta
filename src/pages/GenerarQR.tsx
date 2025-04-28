import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const GeneradorQR = () => {
  const [texto, setTexto] = useState('');
  const [qrGenerado, setQrGenerado] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // Función para generar el QR
  const generarQR = () => {
    if (texto.trim()) {
      setQrGenerado(true);
    }
  };

  // Función para descargar el QR como imagen PNG
  const descargarQR = () => {
    if (!qrRef.current) return;
    
    const svgElement = qrRef.current.querySelector('svg');
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
      // Configurar el canvas con el tamaño adecuado (un poco más grande para margen)
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      
      // Fondo blanco
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Dibujar la imagen en el canvas con margen
        ctx.drawImage(img, 20, 20);
      }
      
      URL.revokeObjectURL(url);
      
      // Convertir el canvas a PNG y descargar
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      
      // Crear un nombre de archivo basado en las primeras palabras del texto
      const nombreArchivo = texto.trim().split(' ').slice(0, 3).join('_');
      link.download = `QR_${nombreArchivo || 'codigo'}.png`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    
    img.src = url;
  };

  // Función para limpiar el formulario
  const limpiar = () => {
    setTexto('');
    setQrGenerado(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Generador de Códigos QR</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ingresa el texto para el código QR:
        </label>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-3 min-h-[150px] focus:ring-blue-500 focus:border-blue-500"
          placeholder="Ejemplo:&#10;Nombres y Apellidos&#10;Cargo&#10;Telf."
        />
      </div>
      
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={generarQR}
          disabled={!texto.trim()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed flex-grow"
        >
          Generar Código QR
        </button>
        
        <button
          onClick={limpiar}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded transition duration-200"
        >
          Limpiar
        </button>
      </div>
      
      {qrGenerado && (
        <div className="mt-8 flex flex-col items-center">
          <div 
            ref={qrRef} 
            className="bg-white p-4 rounded-lg shadow-md inline-block"
          >
            <QRCodeSVG
              value={texto}
              size={250}
              level="H" // Alta corrección de errores
              includeMargin={true}
            />
          </div>
          
          <div className="mt-6 text-center">
            <button
              onClick={descargarQR}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition duration-200"
            >
              Descargar QR
            </button>
            
            <p className="mt-4 text-sm text-gray-600">
              Este código QR contiene el siguiente texto:
            </p>
            <pre className="mt-2 p-3 bg-gray-100 rounded-lg text-sm text-gray-800 whitespace-pre-wrap break-words max-w-full">
              {texto}
            </pre>
          </div>
        </div>
      )}
      
      <div className="mt-8 text-sm text-gray-500 border-t pt-4">
        <p className="font-medium mb-1">Consejos:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Puedes incluir saltos de línea para mejorar la legibilidad.</li>
          <li>Para información de contacto, incluye nombre, cargo y número de teléfono.</li>
          <li>Evita textos muy largos para que el QR sea fácil de escanear.</li>
        </ul>
      </div>
    </div>
  );
};

export default GeneradorQR;