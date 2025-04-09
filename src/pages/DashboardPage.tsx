import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Radar } from 'react-chartjs-2';

// Registrar los componentes de Chart.js
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement
);

// Definir tipos
type Sector = {
  id: string;
  nombre: string;
};

type ResultadoPregunta = {
  pregunta: string;
  opcion: string;
  total_respuestas: number;
};

type ResultadoAgrupado = {
  [pregunta: string]: {
    [opcion: string]: number;
  };
};

// Colores para los gráficos
const COLORES = {
  'Muy bueno': '#4CAF50',
  'Bueno': '#2196F3',
  'Regular': '#FFC107',
  'Malo': '#FF5722',
  'Muy malo': '#F44336'
};

const DashboardPage = () => {
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [sectorSeleccionado, setSectorSeleccionado] = useState<string>('');
  const [resultados, setResultados] = useState<ResultadoPregunta[]>([]);
  const [resultadosAgrupados, setResultadosAgrupados] = useState<ResultadoAgrupado>({});
  const [preguntaSeleccionada, setPreguntaSeleccionada] = useState<string>('');
  const [vistaActual, setVistaActual] = useState<'general' | 'individual'>('general');
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Cargar sectores
  const cargarSectores = async () => {
    const { data, error } = await supabase.from('sectores').select('*');
    if (error) {
      console.error('Error al cargar sectores:', error);
      setError('No se pudieron cargar los sectores');
    } else {
      setSectores(data || []);
    }
  };

  // Cargar resultados
  const cargarResultados = async (sectorId: string) => {
    setCargando(true);
    setError('');
    
    try {
      const { data, error } = await supabase.rpc('obtener_reporte_por_sector', {
        sector_id: sectorId
      });

      if (error) {
        console.error('Error al cargar resultados:', error);
        setError('No se pudieron cargar los resultados');
      } else {
        // Asegurarse de que data es un array y convertirlo al tipo ResultadoPregunta
        const resultadosData = (data || []) as ResultadoPregunta[];
        setResultados(resultadosData);
        
        // Agrupar resultados por pregunta y opción
        const agrupados: ResultadoAgrupado = {};
        resultadosData.forEach((item: ResultadoPregunta) => {
          if (!agrupados[item.pregunta]) {
            agrupados[item.pregunta] = {};
          }
          agrupados[item.pregunta][item.opcion] = item.total_respuestas;
        });
        
        setResultadosAgrupados(agrupados);
        
        // Establecer la primera pregunta como seleccionada si hay datos
        if (resultadosData.length > 0) {
          const preguntas = [...new Set(resultadosData.map(item => item.pregunta))];
          if (preguntas.length > 0) {
            setPreguntaSeleccionada(preguntas[0]);
          }
        }
      }
    } catch (err) {
      console.error('Error inesperado:', err);
      setError('Ocurrió un error inesperado');
    } finally {
      setCargando(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    cargarSectores();
  }, []);

  // Cuando cambia el sector seleccionado
  useEffect(() => {
    if (sectorSeleccionado) {
      cargarResultados(sectorSeleccionado);
    }
  }, [sectorSeleccionado]);

  // Manejar cambio de sector
  const handleSectorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSectorSeleccionado(e.target.value);
  };

  // Manejar cambio de pregunta
  const handlePreguntaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPreguntaSeleccionada(e.target.value);
  };

  // Preparar datos para el gráfico de resumen
  const datosResumen = {
    labels: Object.keys(resultadosAgrupados),
    datasets: [
      {
        label: 'Muy bueno',
        data: Object.keys(resultadosAgrupados).map(pregunta => 
          resultadosAgrupados[pregunta]['Muy bueno'] || 0
        ),
        backgroundColor: COLORES['Muy bueno'],
      },
      {
        label: 'Bueno',
        data: Object.keys(resultadosAgrupados).map(pregunta => 
          resultadosAgrupados[pregunta]['Bueno'] || 0
        ),
        backgroundColor: COLORES['Bueno'],
      },
      {
        label: 'Regular',
        data: Object.keys(resultadosAgrupados).map(pregunta => 
          resultadosAgrupados[pregunta]['Regular'] || 0
        ),
        backgroundColor: COLORES['Regular'],
      },
      {
        label: 'Malo',
        data: Object.keys(resultadosAgrupados).map(pregunta => 
          resultadosAgrupados[pregunta]['Malo'] || 0
        ),
        backgroundColor: COLORES['Malo'],
      },
      {
        label: 'Muy malo',
        data: Object.keys(resultadosAgrupados).map(pregunta => 
          resultadosAgrupados[pregunta]['Muy malo'] || 0
        ),
        backgroundColor: COLORES['Muy malo'],
      },
    ],
  };

  // Preparar datos para el gráfico individual
  const datosPreguntaIndividual = preguntaSeleccionada ? {
    labels: ['Muy bueno', 'Bueno', 'Regular', 'Malo', 'Muy malo'],
    datasets: [
      {
        label: preguntaSeleccionada,
        data: [
          resultadosAgrupados[preguntaSeleccionada]?.['Muy bueno'] || 0,
          resultadosAgrupados[preguntaSeleccionada]?.['Bueno'] || 0,
          resultadosAgrupados[preguntaSeleccionada]?.['Regular'] || 0,
          resultadosAgrupados[preguntaSeleccionada]?.['Malo'] || 0,
          resultadosAgrupados[preguntaSeleccionada]?.['Muy malo'] || 0,
        ],
        backgroundColor: [
          COLORES['Muy bueno'],
          COLORES['Bueno'],
          COLORES['Regular'],
          COLORES['Malo'],
          COLORES['Muy malo'],
        ],
      },
    ],
  } : { labels: [], datasets: [] };

  // Preparar datos para el gráfico radar
  const datosRadar = {
    labels: ['Muy bueno', 'Bueno', 'Regular', 'Malo', 'Muy malo'],
    datasets: Object.keys(resultadosAgrupados).map((pregunta, index) => ({
      label: `P${index + 1}`,
      data: [
        resultadosAgrupados[pregunta]?.['Muy bueno'] || 0,
        resultadosAgrupados[pregunta]?.['Bueno'] || 0,
        resultadosAgrupados[pregunta]?.['Regular'] || 0,
        resultadosAgrupados[pregunta]?.['Malo'] || 0,
        resultadosAgrupados[pregunta]?.['Muy malo'] || 0,
      ],
      backgroundColor: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.2)`,
      borderColor: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 1)`,
    })),
  };

  // Exportar a CSV
  const exportarCSV = () => {
    let csv = 'Pregunta,Opción,Total Respuestas\n';
    resultados.forEach(item => {
      csv += `"${item.pregunta}","${item.opcion}",${item.total_respuestas}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard de Resultados</h1>
      
      {/* Filtros y controles */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selecciona una comisaria
            </label>
            <select
              value={sectorSeleccionado}
              onChange={handleSectorChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona una comisaria</option>
              {sectores.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.nombre}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vista
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => setVistaActual('general')}
                className={`px-4 py-2 rounded-md ${
                  vistaActual === 'general'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                Vista General
              </button>
              <button
                onClick={() => setVistaActual('individual')}
                className={`px-4 py-2 rounded-md ${
                  vistaActual === 'individual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                Por Pregunta
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Acciones
            </label>
            <button
              onClick={exportarCSV}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Exportar a CSV
            </button>
          </div>
        </div>
      </div>
      
      {/* Mensajes de error o carga */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {cargando ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Vista general */}
          {vistaActual === 'general' && Object.keys(resultadosAgrupados).length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">Resumen General</h2>
                <div className="h-80">
                  <Bar
                    data={datosResumen}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        title: {
                          display: true,
                          text: 'Distribución de respuestas por pregunta',
                        },
                      },
                      scales: {
                        x: {
                          stacked: false,
                          ticks: {
                            callback: function(value) {
                              const label = this.getLabelForValue(value as number);
                              return label.length > 30 ? label.substr(0, 30) + '...' : label;
                            }
                          }
                        },
                        y: {
                          stacked: false,
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">Análisis Comparativo</h2>
                <div className="h-80">
                  <Radar
                    data={datosRadar}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        title: {
                          display: true,
                          text: 'Comparación de respuestas entre preguntas',
                        },
                        tooltip: {
                          callbacks: {
                            title: function(context) {
                              const index = context[0].dataIndex;
                              const labels = ['Muy bueno', 'Bueno', 'Regular', 'Malo', 'Muy malo'];
                              return labels[index];
                            }
                          }
                        }
                      },
                      scales: {
                        r: {
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow lg:col-span-2">
                <h2 className="text-lg font-semibold mb-4">Tabla de Resultados</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pregunta
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Muy bueno
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bueno
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Regular
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Malo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Muy malo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.keys(resultadosAgrupados).map((pregunta) => {
                        const muyBueno = resultadosAgrupados[pregunta]['Muy bueno'] || 0;
                        const bueno = resultadosAgrupados[pregunta]['Bueno'] || 0;
                        const regular = resultadosAgrupados[pregunta]['Regular'] || 0;
                        const malo = resultadosAgrupados[pregunta]['Malo'] || 0;
                        const muyMalo = resultadosAgrupados[pregunta]['Muy malo'] || 0;
                        const total = muyBueno + bueno + regular + malo + muyMalo;
                        
                        return (
                          <tr key={pregunta}>
                            <td className="px-6 py-4 whitespace-normal text-sm text-gray-900">
                              {pregunta}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {muyBueno} ({total > 0 ? Math.round((muyBueno / total) * 100) : 0}%)
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {bueno} ({total > 0 ? Math.round((bueno / total) * 100) : 0}%)
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {regular} ({total > 0 ? Math.round((regular / total) * 100) : 0}%)
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {malo} ({total > 0 ? Math.round((malo / total) * 100) : 0}%)
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {muyMalo} ({total > 0 ? Math.round((muyMalo / total) * 100) : 0}%)
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {total}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {/* Vista individual por pregunta */}
          {vistaActual === 'individual' && Object.keys(resultadosAgrupados).length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selecciona una pregunta
                </label>
                <select
                  value={preguntaSeleccionada}
                  onChange={handlePreguntaChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.keys(resultadosAgrupados).map((pregunta) => (
                    <option key={pregunta} value={pregunta}>
                      {pregunta}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Distribución de Respuestas</h2>
                  <div className="h-80">
                    <Bar
                      data={datosPreguntaIndividual}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                          title: {
                            display: true,
                            text: preguntaSeleccionada,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <h2 className="text-lg font-semibold mb-4">Porcentaje de Respuestas</h2>
                  <div className="h-80">
                    <Pie
                      data={datosPreguntaIndividual}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'right',
                          },
                          title: {
                            display: true,
                            text: preguntaSeleccionada,
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                const label = context.label || '';
                                const value = context.raw as number;
                                const dataset = context.dataset;
                                const total = dataset.data.reduce((acc: number, data: number) => acc + data, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                              }
                            }
                          }
                        },
                      }}
                    />
                  </div>
                </div>
                
                <div className="lg:col-span-2">
                  <h2 className="text-lg font-semibold mb-4">Análisis Detallado</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-lg mb-2">{preguntaSeleccionada}</h3>
                    
                    {preguntaSeleccionada && (
                      <>
                        <div className="grid grid-cols-5 gap-4 mb-4">
                          {['Muy bueno', 'Bueno', 'Regular', 'Malo', 'Muy malo'].map((opcion) => {
                            const valor = resultadosAgrupados[preguntaSeleccionada]?.[opcion] || 0;
                            const total = ['Muy bueno', 'Bueno', 'Regular', 'Malo', 'Muy malo'].reduce(
                              (acc, op) => acc + (resultadosAgrupados[preguntaSeleccionada]?.[op] || 0),
                              0
                            );
                            const porcentaje = total > 0 ? Math.round((valor / total) * 100) : 0;
                            
                            return (
                              <div key={opcion} className="text-center">
                                <div className="text-sm font-medium">{opcion}</div>
                                <div className="text-2xl font-bold">{valor}</div>
                                <div className="text-sm text-gray-500">{porcentaje}%</div>
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                          {['Muy bueno', 'Bueno', 'Regular', 'Malo', 'Muy malo'].map((opcion) => {
                            const valor = resultadosAgrupados[preguntaSeleccionada]?.[opcion] || 0;
                            const total = ['Muy bueno', 'Bueno', 'Regular', 'Malo', 'Muy malo'].reduce(
                              (acc, op) => acc + (resultadosAgrupados[preguntaSeleccionada]?.[op] || 0),
                              0
                            );
                            const porcentaje = total > 0 ? (valor / total) * 100 : 0;
                            
                            return (
                              <div
                                key={opcion}
                                className="h-4 rounded-full float-left"
                                style={{
                                  width: `${porcentaje}%`,
                                  backgroundColor: COLORES[opcion as keyof typeof COLORES],
                                }}
                              ></div>
                            );
                          })}
                        </div>
                        
                        <div className="text-sm text-gray-500 mt-4">
                          Total de respuestas: {
                            ['Muy bueno', 'Bueno', 'Regular', 'Malo', 'Muy malo'].reduce(
                              (acc, op) => acc + (resultadosAgrupados[preguntaSeleccionada]?.[op] || 0),
                              0
                            )
                          }
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {Object.keys(resultadosAgrupados).length === 0 && !cargando && (
            <div className="bg-yellow-50 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              No hay datos disponibles para mostrar. Por favor, selecciona un sector y asegúrate de que hay respuestas registradas.
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DashboardPage;