import QRCode from 'qrcode';
import { useState } from 'react';

const QRCodeGenerator = () => {
  const [url, setUrl] = useState('');
  const [qrCode, setQrCode] = useState('');

  const generarQR = async () => {
    const qr = await QRCode.toDataURL(url);
    setQrCode(qr);
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Generador de QR</h1>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Ingresa la URL"
        className="w-full border rounded p-2 mb-4"
      />
      <button
        onClick={generarQR}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Generar QR
      </button>
      {qrCode && <img src={qrCode} alt="QR Code" className="mt-4" />}
    </div>
  );
};

export default QRCodeGenerator;