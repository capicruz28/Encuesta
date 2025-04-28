import { useState, useEffect, useRef } from 'react';
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
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import { FaFilePdf, FaChartBar, FaChartPie, FaExclamationTriangle, FaCheck, FaUsers } from 'react-icons/fa';
// Importar jspdf y html2canvas después de instalarlos
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Registrar los componentes de Chart.js
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
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

// Colores para los gráficos con mejor contraste y accesibilidad
const COLORES = {
  'Muy bueno': '#4CAF50',
  'Bueno': '#2196F3',
  'Regular': '#FFC107',
  'Malo': '#FF9933',
  'Muy malo': '#F44336'
};

// Umbrales para evaluación de satisfacción
const UMBRAL_SATISFACCION = 70; // % de respuestas positivas (Bueno + Muy bueno)
const UMBRAL_INSATISFACCION = 30; // % de respuestas negativas (Malo + Muy malo)

const DashboardPage = () => {
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [sectorSeleccionado, setSectorSeleccionado] = useState<string>('');
  // Eliminamos la variable resultados que no se usa y solo mantenemos resultadosAgrupados
  const [resultadosAgrupados, setResultadosAgrupados] = useState<ResultadoAgrupado>({});
  const [preguntaSeleccionada, setPreguntaSeleccionada] = useState<string>('');
  const [vistaActual, setVistaActual] = useState<'general' | 'individual' | 'insights'>('general');
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [totalEncuestados, setTotalEncuestados] = useState<number>(0);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<string>('todo');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [exportandoPDF, setExportandoPDF] = useState<boolean>(false);
  
  // Referencias para los elementos que queremos exportar a PDF
  const reporteRef = useRef<HTMLDivElement>(null);

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
      // Modificar para incluir filtro por fecha si es necesario
      let params: any = { p_sector_id: sectorId };
      
      if (periodoSeleccionado === 'personalizado' && fechaInicio && fechaFin) {        
        params.fecha_inicio = fechaInicio;
        params.fecha_fin = fechaFin;
      } else if (periodoSeleccionado === 'mes') {
        const hoy = new Date();
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth() - 1, hoy.getDate());
        params.fecha_inicio = inicioMes.toISOString();
        params.fecha_fin = hoy.toISOString();
      } else if (periodoSeleccionado === 'semana') {
        const hoy = new Date();
        const inicioSemana = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
        params.fecha_inicio = inicioSemana.toISOString();
        params.fecha_fin = hoy.toISOString();
      }
      
      const { data, error } = await supabase.rpc('obtener_reporte_por_sector_fecha', params);

      if (error) {
        console.error('Error al cargar resultados:', error);
        setError('No se pudieron cargar los resultados');
      } else {
        // Asegurarse de que data es un array y convertirlo al tipo ResultadoPregunta
        const resultadosData = (data || []) as ResultadoPregunta[];
        
        // Agrupar resultados por pregunta y opción
        const agrupados: ResultadoAgrupado = {};
        resultadosData.forEach(item => {
          if (!agrupados[item.pregunta]) {
            agrupados[item.pregunta] = {};
          }
          agrupados[item.pregunta][item.opcion] = item.total_respuestas;
        });
        
        setResultadosAgrupados(agrupados);
        
        // Calcular total de encuestados (personas únicas)
        // Esto es una aproximación basada en el total de respuestas dividido por el número de preguntas
        const totalPreguntas = Object.keys(agrupados).length;
        if (totalPreguntas > 0) {
          const totalRespuestas = resultadosData.reduce((sum, item) => sum + item.total_respuestas, 0);
          setTotalEncuestados(Math.round(totalRespuestas / totalPreguntas));
        } else {
          setTotalEncuestados(0);
        }
        
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
    
    // Establecer fecha fin como hoy
    const hoy = new Date();
    setFechaFin(hoy.toISOString().split('T')[0]);
    
    // Establecer fecha inicio como hace un mes
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth() - 1, hoy.getDate());
    setFechaInicio(inicioMes.toISOString().split('T')[0]);
  }, []);

  // Cuando cambia el sector seleccionado o el periodo
  useEffect(() => {
    if (sectorSeleccionado) {
      cargarResultados(sectorSeleccionado);
    }
  }, [sectorSeleccionado, periodoSeleccionado, fechaInicio, fechaFin]);

  // Manejar cambio de sector
  const handleSectorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSectorSeleccionado(e.target.value);
  };

  // Manejar cambio de pregunta
  const handlePreguntaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPreguntaSeleccionada(e.target.value);
  };

  // Manejar cambio de periodo
  const handlePeriodoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPeriodoSeleccionado(e.target.value);
  };

  // Calcular puntos de mejora
  const calcularPuntosMejora = () => {
    const puntosMejora: {pregunta: string, porcentajeNegativo: number, totalRespuestas: number}[] = [];
    
    Object.keys(resultadosAgrupados).forEach(preguntaKey => {
      const muyBueno = resultadosAgrupados[preguntaKey]['Muy bueno'] || 0;
      const bueno = resultadosAgrupados[preguntaKey]['Bueno'] || 0;
      const regular = resultadosAgrupados[preguntaKey]['Regular'] || 0;
      const malo = resultadosAgrupados[preguntaKey]['Malo'] || 0;
      const muyMalo = resultadosAgrupados[preguntaKey]['Muy malo'] || 0;
      
      const total = muyBueno + bueno + regular + malo + muyMalo;
      if (total === 0) return;
      
      const porcentajeNegativo = ((malo + muyMalo) / total) * 100;
      
      if (porcentajeNegativo >= UMBRAL_INSATISFACCION) {
        puntosMejora.push({
          pregunta: preguntaKey,
          porcentajeNegativo,
          totalRespuestas: total
        });
      }
    });
    
    // Ordenar por porcentaje negativo (de mayor a menor)
    return puntosMejora.sort((a, b) => b.porcentajeNegativo - a.porcentajeNegativo);
  };

  // Calcular puntos fuertes
  const calcularPuntosFuertes = () => {
    const puntosFuertes: {pregunta: string, porcentajePositivo: number, totalRespuestas: number}[] = [];
    
    Object.keys(resultadosAgrupados).forEach(preguntaKey => {
      const muyBueno = resultadosAgrupados[preguntaKey]['Muy bueno'] || 0;
      const bueno = resultadosAgrupados[preguntaKey]['Bueno'] || 0;
      const total = Object.values(resultadosAgrupados[preguntaKey]).reduce((sum, val) => sum + val, 0);
      
      if (total === 0) return;
      
      const porcentajePositivo = ((muyBueno + bueno) / total) * 100;
      
      if (porcentajePositivo >= UMBRAL_SATISFACCION) {
        puntosFuertes.push({
          pregunta: preguntaKey,
          porcentajePositivo,
          totalRespuestas: total
        });
      }
    });
    
    // Ordenar por porcentaje positivo (de mayor a menor)
    return puntosFuertes.sort((a, b) => b.porcentajePositivo - a.porcentajePositivo);
  };

  // Calcular satisfacción general
  const calcularSatisfaccionGeneral = () => {
    let totalPositivo = 0;
    let totalRespuestas = 0;
    
    Object.keys(resultadosAgrupados).forEach(preguntaKey => {
      const muyBueno = resultadosAgrupados[preguntaKey]['Muy bueno'] || 0;
      const bueno = resultadosAgrupados[preguntaKey]['Bueno'] || 0;
      const total = Object.values(resultadosAgrupados[preguntaKey]).reduce((sum, val) => sum + val, 0);
      
      totalPositivo += muyBueno + bueno;
      totalRespuestas += total;
    });
    
    if (totalRespuestas === 0) return 0;
    
    return (totalPositivo / totalRespuestas) * 100;
  };

  // Preparar datos para el gráfico de resumen
  const datosResumen = {
    labels: Object.keys(resultadosAgrupados).map((_, index) => `P${index + 1}`),
    datasets: [
      {
        label: 'Muy bueno',
        data: Object.keys(resultadosAgrupados).map(preguntaKey => 
          resultadosAgrupados[preguntaKey]['Muy bueno'] || 0
        ),
        backgroundColor: COLORES['Muy bueno'],
      },
      {
        label: 'Bueno',
        data: Object.keys(resultadosAgrupados).map(preguntaKey => 
          resultadosAgrupados[preguntaKey]['Bueno'] || 0
        ),
        backgroundColor: COLORES['Bueno'],
      },
      {
        label: 'Regular',
        data: Object.keys(resultadosAgrupados).map(preguntaKey => 
          resultadosAgrupados[preguntaKey]['Regular'] || 0
        ),
        backgroundColor: COLORES['Regular'],
      },
      {
        label: 'Malo',
        data: Object.keys(resultadosAgrupados).map(preguntaKey => 
          resultadosAgrupados[preguntaKey]['Malo'] || 0
        ),
        backgroundColor: COLORES['Malo'],
      },
      {
        label: 'Muy malo',
        data: Object.keys(resultadosAgrupados).map(preguntaKey => 
          resultadosAgrupados[preguntaKey]['Muy malo'] || 0
        ),
        backgroundColor: COLORES['Muy malo'],
      },
    ],
  };

  // Preparar datos para el gráfico de satisfacción general
  const datosSatisfaccionGeneral = {
    labels: ['Satisfacción', 'Insatisfacción'],
    datasets: [
      {
        data: [
          calcularSatisfaccionGeneral(),
          100 - calcularSatisfaccionGeneral()
        ],
        backgroundColor: [
          '#4CAF50',
          '#F44336'
        ],
        borderWidth: 0,
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

// Función mejorada para exportar a PDF con renderizado correcto de gráficos
const exportarPDF = async () => {
    if (!reporteRef.current) return;
    
    try {
      setExportandoPDF(true);
      
      // Obtener el nombre del sector para el título del PDF
      const nombreSector = obtenerNombreSector();
      
      // Crear un nuevo documento PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Añadir título al PDF
      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Reporte de Satisfacción - ${nombreSector}`, pageWidth / 2, 15, { align: 'center' });
      
      // Añadir fecha al PDF
      pdf.setFontSize(10);
      pdf.text(`Generado el: ${new Date().toLocaleDateString()}`, pageWidth / 2, 22, { align: 'center' });
      
      // Añadir periodo al PDF
      let periodoTexto = 'Periodo: Todo el tiempo';
      if (periodoSeleccionado === 'semana') {
        periodoTexto = 'Periodo: Última semana';
      } else if (periodoSeleccionado === 'mes') {
        periodoTexto = 'Periodo: Último mes';
      } else if (periodoSeleccionado === 'personalizado') {
        periodoTexto = `Periodo: Del ${fechaInicio} al ${fechaFin}`;
      }
      pdf.text(periodoTexto, pageWidth / 2, 27, { align: 'center' });
      
      // Esperar a que los gráficos se rendericen completamente
      // Esto es crucial para asegurar que los gráficos estén listos antes de capturarlos
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Capturar el contenido del reporte como imagen
      const canvas = await html2canvas(reporteRef.current, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        imageTimeout: 15000, // Aumentar el tiempo de espera para imágenes
        logging: true, // Activar logs para depuración
        onclone: (clonedDoc, clonedElement) => {
          // Asegurarse de que todos los elementos sean visibles en el clon
          const allElements = clonedElement.querySelectorAll('*');
          allElements.forEach(el => {
            if (el instanceof HTMLElement) {
              // Hacer visible cualquier elemento oculto que contenga canvas (gráficos)
              if (el.style.display === 'none' && el.querySelector('canvas')) {
                el.style.display = 'block';
              }
              
              // Asegurar que los elementos con gráficos tengan altura y ancho
              if (el.querySelector('canvas')) {
                if (el.style.height === '0px' || !el.style.height) {
                  el.style.height = 'auto';
                }
                if (el.style.width === '0px' || !el.style.width) {
                  el.style.width = '100%';
                }
              }
              
              // Eliminar cualquier estilo que pueda ocultar contenido
              el.style.overflow = 'visible';
              
              // Asegurar que los textos sean legibles
              if (el.tagName === 'SELECT') {
                const selectedOption = el.querySelector('option:checked');
                if (selectedOption) {
                  const textSpan = clonedDoc.createElement('div');
                  textSpan.style.fontWeight = 'bold';
                  textSpan.style.padding = '8px';
                  textSpan.style.border = '1px solid #ccc';
                  textSpan.style.borderRadius = '4px';
                  textSpan.style.marginBottom = '10px';
                  textSpan.textContent = selectedOption.textContent || '';
                  el.parentNode?.insertBefore(textSpan, el);
                  el.style.display = 'none';
                }
              }
            }
          });
          
          // Asegurar que los contenedores de gráficos tengan dimensiones adecuadas
          const chartContainers = clonedElement.querySelectorAll('.h-80');
          chartContainers.forEach(container => {
            if (container instanceof HTMLElement) {
              container.style.height = '300px';
              container.style.width = '100%';
              container.style.maxWidth = '100%';
              container.style.position = 'relative';
            }
          });
          
          // Forzar que los elementos con fondo tengan fondo blanco
          const bgElements = clonedElement.querySelectorAll('.bg-white, .bg-gray-50, .bg-gray-100');
          bgElements.forEach(el => {
            if (el instanceof HTMLElement) {
              el.style.backgroundColor = '#ffffff';
              el.style.boxShadow = 'none';
            }
          });
        }
      });
      
      // Convertir el canvas a una imagen
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // Calcular la altura proporcional para mantener la relación de aspecto
      const imgWidth = pageWidth - 20; // Margen de 10mm en cada lado
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Si la imagen es muy grande, dividirla en múltiples páginas
      let heightLeft = imgHeight;
      let position = 35; // Posición inicial después del título y fecha
      let pageCount = 1;
      
      // Añadir la primera parte de la imagen
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - position);
      
      // Si hay más contenido, añadir nuevas páginas
      while (heightLeft > 0) {
        pageCount++;
        pdf.addPage();
        pdf.addImage(
          imgData, 
          'PNG', 
          10, 
          -(imgHeight - heightLeft - position), 
          imgWidth, 
          imgHeight
        );
        heightLeft -= pageHeight;
      }
      
      // Añadir pie de página
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(
          `Página ${i} de ${pageCount}`, 
          pageWidth / 2, 
          pageHeight - 10, 
          { align: 'center' }
        );
      }
      
      // Guardar el PDF
      pdf.save(`Reporte_${nombreSector.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      setError('No se pudo generar el PDF. Intente nuevamente.');
    } finally {
      setExportandoPDF(false);
    }
  };



  // Obtener el nombre del sector seleccionado
  const obtenerNombreSector = () => {
    const sector = sectores.find(s => s.id === sectorSeleccionado);
    return sector ? sector.nombre : 'Seleccione un sector';
  };

  return (
    <div className="p-4 bg-gray-50">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">Dashboard de Resultados</h1>
        <p className="text-gray-600 mb-4">Análisis de satisfacción y puntos de mejora</p>
        
        {/* Filtros y controles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comisaría
            </label>
            <select
              value={sectorSeleccionado}
              onChange={handleSectorChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona una comisaría</option>
              {sectores.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.nombre}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Periodo
            </label>
            <select
              value={periodoSeleccionado}
              onChange={handlePeriodoChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todo">Todo el tiempo</option>
              <option value="semana">Última semana</option>
              <option value="mes">Último mes</option>
              <option value="personalizado">Personalizado</option>
            </select>
          </div>
          
          {periodoSeleccionado === 'personalizado' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha inicio
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha fin
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
        </div>
        
        {/* Botones de vista */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setVistaActual('general')}
            className={`flex items-center px-4 py-2 rounded-md ${
              vistaActual === 'general'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            <FaChartBar className="mr-2" /> Vista General
          </button>
          <button
            onClick={() => setVistaActual('individual')}
            className={`flex items-center px-4 py-2 rounded-md ${
              vistaActual === 'individual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            <FaChartPie className="mr-2" /> Por Pregunta
          </button>
          <button
            onClick={() => setVistaActual('insights')}
            className={`flex items-center px-4 py-2 rounded-md ${
              vistaActual === 'insights'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            <FaExclamationTriangle className="mr-2" /> Puntos de Mejora
          </button>
          
          <div className="ml-auto">
            <button
              onClick={exportarPDF}
              disabled={exportandoPDF || Object.keys(resultadosAgrupados).length === 0}
              className={`flex items-center px-4 py-2 rounded-md ${
                exportandoPDF 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : Object.keys(resultadosAgrupados).length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {exportandoPDF ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Generando PDF...
                </>
              ) : (
                <>
                  <FaFilePdf className="mr-2" /> Exportar PDF
                </>
              )}
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
        <div ref={reporteRef}>
          {/* Tarjetas de resumen */}
          {Object.keys(resultadosAgrupados).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                    <FaUsers className="text-xl" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">Total Encuestados</p>
                    <p className="text-xl font-semibold">{totalEncuestados}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <div className={`p-3 rounded-full ${
                    calcularSatisfaccionGeneral() >= 70 
                      ? 'bg-green-100 text-green-600' 
                      : calcularSatisfaccionGeneral() >= 50 
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-red-100 text-red-600'
                  }`}>
                    {calcularSatisfaccionGeneral() >= 70 
                      ? <FaCheck className="text-xl" />
                      : <FaExclamationTriangle className="text-xl" />
                    }
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">Satisfacción General</p>
                    <p className="text-xl font-semibold">{calcularSatisfaccionGeneral().toFixed(1)}%</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 text-green-600">
                    <FaCheck className="text-xl" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">Puntos Fuertes</p>
                    <p className="text-xl font-semibold">{calcularPuntosFuertes().length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-red-100 text-red-600">
                    <FaExclamationTriangle className="text-xl" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">Puntos de Mejora</p>
                    <p className="text-xl font-semibold">{calcularPuntosMejora().length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Vista general */}
          {vistaActual === 'general' && Object.keys(resultadosAgrupados).length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-white p-4 rounded-lg shadow lg:col-span-2">
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
                          text: `Distribución de respuestas - ${obtenerNombreSector()}`,
                        },
                        tooltip: {
                          callbacks: {
                            title: function(context) {
                              const index = context[0].dataIndex;
                              const preguntaKey = Object.keys(resultadosAgrupados)[index];
                              return preguntaKey;
                            }
                          }
                        }
                      },
                      scales: {
                        x: {
                          stacked: true,
                          title: {
                            display: true,
                            text: 'Preguntas'
                          }
                        },
                        y: {
                          stacked: true,
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Número de respuestas'
                          }
                        },
                      },
                    }}
                  />
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">Satisfacción General</h2>
                <div className="h-80 flex flex-col items-center justify-center">
                  <div className="w-48 h-48 mb-4">
                    <Doughnut
                      data={datosSatisfaccionGeneral}
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        cutout: '70%',
                        plugins: {
                          legend: {
                            display: false
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                const value = context.raw as number;
                                return `${context.label}: ${value.toFixed(1)}%`;
                              }
                            }
                          }
                        },
                      }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">{calcularSatisfaccionGeneral().toFixed(1)}%</p>
                    <p className="text-gray-500">de satisfacción</p>
                  </div>
                  <div className={`mt-4 px-4 py-2 rounded-full text-sm ${
                    calcularSatisfaccionGeneral() >= 70 
                      ? 'bg-green-100 text-green-800' 
                      : calcularSatisfaccionGeneral() >= 50 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }`}>
                    {calcularSatisfaccionGeneral() >= 70 
                      ? 'Satisfacción Alta' 
                      : calcularSatisfaccionGeneral() >= 50 
                        ? 'Satisfacción Media'
                        : 'Satisfacción Baja'
                    }
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow lg:col-span-3">
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Satisfacción
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.keys(resultadosAgrupados).map((preguntaKey, index) => {
                        const muyBueno = resultadosAgrupados[preguntaKey]['Muy bueno'] || 0;
                        const bueno = resultadosAgrupados[preguntaKey]['Bueno'] || 0;
                        const regular = resultadosAgrupados[preguntaKey]['Regular'] || 0;
                        const malo = resultadosAgrupados[preguntaKey]['Malo'] || 0;
                        const muyMalo = resultadosAgrupados[preguntaKey]['Muy malo'] || 0;
                        const total = muyBueno + bueno + regular + malo + muyMalo;
                        const satisfaccion = total > 0 ? ((muyBueno + bueno) / total) * 100 : 0;
                        
                        return (
                          <tr key={preguntaKey} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-normal text-sm text-gray-900">
                              <span className="font-medium">P{index + 1}:</span> {preguntaKey}
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
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                satisfaccion >= 70 
                                  ? 'bg-green-100 text-green-800' 
                                  : satisfaccion >= 50 
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                              }`}>
                                {satisfaccion.toFixed(1)}%
                              </div>
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
                  {Object.keys(resultadosAgrupados).map((preguntaKey, index) => (
                    <option key={preguntaKey} value={preguntaKey}>
                      P{index + 1}: {preguntaKey}
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
                        indexAxis: 'y',
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
                          x: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Número de respuestas'
                            }
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
                        
                        {/* Análisis de la pregunta */}
                        <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                          <h4 className="font-medium mb-2">Análisis de resultados</h4>
                          
                          {(() => {
                            const muyBueno = resultadosAgrupados[preguntaSeleccionada]?.['Muy bueno'] || 0;
                            const bueno = resultadosAgrupados[preguntaSeleccionada]?.['Bueno'] || 0;
                            const regular = resultadosAgrupados[preguntaSeleccionada]?.['Regular'] || 0;
                            const malo = resultadosAgrupados[preguntaSeleccionada]?.['Malo'] || 0;
                            const muyMalo = resultadosAgrupados[preguntaSeleccionada]?.['Muy malo'] || 0;
                            const total = muyBueno + bueno + regular + malo + muyMalo;
                            
                            if (total === 0) return <p>No hay suficientes datos para analizar.</p>;
                            
                            const satisfaccion = ((muyBueno + bueno) / total) * 100;
                            const insatisfaccion = ((malo + muyMalo) / total) * 100;
                            
                            return (
                              <div>
                                <p className="mb-2">
                                  <span className="font-medium">Nivel de satisfacción:</span>{' '}
                                  <span className={`${
                                    satisfaccion >= 70 
                                      ? 'text-green-600' 
                                      : satisfaccion >= 50 
                                        ? 'text-yellow-600'
                                        : 'text-red-600'
                                  }`}>
                                    {satisfaccion.toFixed(1)}%
                                  </span>
                                </p>
                                
                                <p className="mb-4">
                                  {satisfaccion >= 70 
                                    ? 'Este aspecto muestra un alto nivel de satisfacción. Es una fortaleza que debe mantenerse.' 
                                    : satisfaccion >= 50 
                                      ? 'Este aspecto muestra un nivel moderado de satisfacción. Hay oportunidades de mejora.'
                                      : 'Este aspecto muestra un bajo nivel de satisfacción. Requiere atención prioritaria.'
                                  }
                                </p>
                                
                                {insatisfaccion >= UMBRAL_INSATISFACCION && (
                                  <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 mb-3">
                                    <p className="font-medium">Punto crítico de mejora</p>
                                    <p>El {insatisfaccion.toFixed(1)}% de los encuestados está insatisfecho con este aspecto.</p>
                                  </div>
                                )}
                                
                                {satisfaccion >= UMBRAL_SATISFACCION && (
                                  <div className="p-3 bg-green-50 border-l-4 border-green-500 text-green-700">
                                    <p className="font-medium">Punto fuerte</p>
                                    <p>El {satisfaccion.toFixed(1)}% de los encuestados está satisfecho con este aspecto.</p>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Vista de insights y puntos de mejora */}
          {vistaActual === 'insights' && Object.keys(resultadosAgrupados).length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">Puntos de Mejora Prioritarios</h2>
                
                {calcularPuntosMejora().length > 0 ? (
                  <div className="space-y-4">
                    {calcularPuntosMejora().map((punto, index) => {
                      const muyMalo = resultadosAgrupados[punto.pregunta]['Muy malo'] || 0;
                      const malo = resultadosAgrupados[punto.pregunta]['Malo'] || 0;
                      
                      return (
                        <div key={index} className="p-4 bg-red-50 rounded-lg border border-red-200">
                          <h3 className="font-medium text-red-800 mb-2">
                            {index + 1}. {punto.pregunta}
                          </h3>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600">Nivel de insatisfacción:</span>
                            <span className="text-red-600 font-bold">{punto.porcentajeNegativo.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <div 
                              className="bg-red-600 h-2 rounded-full" 
                              style={{ width: `${punto.porcentajeNegativo}%` }}
                            ></div>
                          </div>
                          <div className="text-sm text-gray-600 mb-3">
                            <span className="font-medium">{malo + muyMalo}</span> de <span className="font-medium">{punto.totalRespuestas}</span> personas están insatisfechas
                          </div>
                          <div className="text-sm text-red-700">
                            <p className="font-medium">Recomendación:</p>
                            <p>Este aspecto requiere atención inmediata. Considere implementar un plan de acción específico para mejorar la percepción en esta área.</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-gray-500">No se han identificado puntos críticos de mejora.</p>
                  </div>
                )}
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">Puntos Fuertes</h2>
                
                {calcularPuntosFuertes().length > 0 ? (
                  <div className="space-y-4">
                    {calcularPuntosFuertes().map((punto, index) => {
                      const muyBueno = resultadosAgrupados[punto.pregunta]['Muy bueno'] || 0;
                      const bueno = resultadosAgrupados[punto.pregunta]['Bueno'] || 0;
                      
                      return (
                        <div key={index} className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <h3 className="font-medium text-green-800 mb-2">
                            {index + 1}. {punto.pregunta}
                          </h3>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600">Nivel de satisfacción:</span>
                            <span className="text-green-600 font-bold">{punto.porcentajePositivo.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${punto.porcentajePositivo}%` }}
                            ></div>
                          </div>
                          <div className="text-sm text-gray-600 mb-3">
                            <span className="font-medium">{bueno + muyBueno}</span> de <span className="font-medium">{punto.totalRespuestas}</span> personas están satisfechas
                          </div>
                          <div className="text-sm text-green-700">
                            <p className="font-medium">Recomendación:</p>
                            <p>Este aspecto es una fortaleza. Mantenga las prácticas actuales y considere compartir estas estrategias exitosas con otras áreas.</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-gray-500">No se han identificado puntos fuertes destacables.</p>
                  </div>
                )}
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow lg:col-span-2">
                <h2 className="text-lg font-semibold mb-4">Resumen Ejecutivo</h2>
                
                {Object.keys(resultadosAgrupados).length > 0 ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="font-medium text-blue-800 mb-3">Análisis General</h3>
                      
                      <p className="mb-3">
                        Basado en las respuestas de <span className="font-medium">{totalEncuestados}</span> personas encuestadas en la comisaría de <span className="font-medium">{obtenerNombreSector()}</span>, 
                        el nivel de satisfacción general es del <span className={`font-medium ${
                          calcularSatisfaccionGeneral() >= 70 
                            ? 'text-green-600' 
                            : calcularSatisfaccionGeneral() >= 50 
                              ? 'text-yellow-600'
                              : 'text-red-600'
                        }`}>{calcularSatisfaccionGeneral().toFixed(1)}%</span>.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <h4 className="font-medium text-blue-700 mb-2">Hallazgos Clave</h4>
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li>Se identificaron <span className="font-medium">{calcularPuntosFuertes().length}</span> puntos fuertes.</li>
                            <li>Se identificaron <span className="font-medium">{calcularPuntosMejora().length}</span> puntos de mejora prioritarios.</li>
                            <li>
                              {calcularSatisfaccionGeneral() >= 70 
                                ? 'La satisfacción general es alta, lo que indica una buena percepción del servicio.' 
                                : calcularSatisfaccionGeneral() >= 50 
                                  ? 'La satisfacción general es moderada, con oportunidades de mejora.'
                                  : 'La satisfacción general es baja, requiriendo atención inmediata.'
                              }
                            </li>
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-blue-700 mb-2">Recomendaciones</h4>
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            {calcularPuntosMejora().length > 0 && (
                              <li>Priorizar la mejora en: <span className="font-medium">{calcularPuntosMejora()[0]?.pregunta}</span></li>
                            )}
                            {calcularPuntosFuertes().length > 0 && (
                              <li>Mantener las buenas prácticas en: <span className="font-medium">{calcularPuntosFuertes()[0]?.pregunta}</span></li>
                            )}
                            <li>
                              {calcularSatisfaccionGeneral() >= 70 
                                ? 'Continuar con las estrategias actuales y buscar oportunidades de excelencia.' 
                                : calcularSatisfaccionGeneral() >= 50 
                                  ? 'Implementar mejoras específicas en los puntos identificados como críticos.'
                                  : 'Desarrollar un plan de acción integral para mejorar la satisfacción general.'
                              }
                            </li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="text-sm text-blue-700 mt-3">
                        <p className="font-medium">Conclusión:</p>
                        <p>
                          {calcularSatisfaccionGeneral() >= 70 
                            ? 'Los resultados indican un buen nivel de satisfacción general. Se recomienda mantener las prácticas actuales y enfocarse en mejorar los pocos puntos críticos identificados.' 
                            : calcularSatisfaccionGeneral() >= 50 
                              ? 'Los resultados muestran un nivel moderado de satisfacción. Existen áreas específicas que requieren atención para mejorar la percepción general del servicio.'
                              : 'Los resultados revelan un nivel bajo de satisfacción. Es necesario implementar cambios significativos en múltiples áreas para mejorar la percepción del servicio.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-gray-500">No hay datos suficientes para generar un resumen ejecutivo.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {Object.keys(resultadosAgrupados).length === 0 && !cargando && (
            <div className="bg-yellow-50 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              No hay datos disponibles para mostrar. Por favor, selecciona un sector y asegúrate de que hay respuestas registradas.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;