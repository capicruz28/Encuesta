const EnMantenimiento = () => {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md flex flex-col items-center">
          <svg
            className="w-16 h-16 text-yellow-400 mb-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h1 className="text-3xl font-bold mb-2 text-gray-800">Página en mantenimiento</h1>
          <p className="text-gray-600 mb-4 text-center">
            Estamos trabajando para mejorar esta sección.<br />
            Por favor, vuelve más tarde.
          </p>
        </div>
      </div>
    );
  };
  
  export default EnMantenimiento;