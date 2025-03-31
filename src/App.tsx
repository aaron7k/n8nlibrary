import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { Download, Copy, Link, X, Play, SortAsc, SortDesc } from 'lucide-react';
import { Workflow, VoiceAgent, LibraryType, Archivo } from './types';

Modal.setAppElement('#root');

const LIMITE_DESCRIPCION = 100;

const App: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [voiceAgents, setVoiceAgents] = useState<VoiceAgent[]>([]);
  const [cargando, setCargando] = useState(true);
  const [elementoSeleccionado, setElementoSeleccionado] = useState<Workflow | VoiceAgent | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [libreriActiva, setLibreriaActiva] = useState<LibraryType>('n8n');
  const [imagenAmpliada, setImagenAmpliada] = useState<string | null>(null);
  const [ordenamiento, setOrdenamiento] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const obtenerDatos = async () => {
      setCargando(true);
      try {
        const respuesta = await fetch('https://api.axelriveroc.com/webhook/n8nlibrary/get', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: libreriActiva,
            sort: ordenamiento
          })
        });
        
        const datos = await respuesta.json();
        
        if (datos && Array.isArray(datos.data)) {
          if (libreriActiva === 'retell') {
            setVoiceAgents(datos.data);
          } else {
            setWorkflows(datos.data);
          }
        } else {
          setError('Formato de datos inválido recibido del servidor');
        }
      } catch (error) {
        setError('Error al obtener los datos. Por favor, intente nuevamente.');
        console.error('Error al obtener datos:', error);
      } finally {
        setCargando(false);
      }
    };

    obtenerDatos();
  }, [libreriActiva, ordenamiento]);

  const manejarClickWorkflow = (workflow: Workflow) => {
    setModalAbierto(true);
    setElementoSeleccionado(workflow);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setElementoSeleccionado(null);
  };

  const copiarJson = () => {
    if (elementoSeleccionado && 'json' in elementoSeleccionado) {
      const campoTexto = document.createElement('textarea');
      campoTexto.innerText = elementoSeleccionado.json;
      document.body.appendChild(campoTexto);
      campoTexto.select();
      document.execCommand('copy');
      campoTexto.remove();
      alert('JSON copiado al portapapeles!');
    }
  };

  const descargarJson = () => {
    if (elementoSeleccionado) {
      const elemento = document.createElement('a');
      const contenido = 'json' in elementoSeleccionado ? elementoSeleccionado.json : JSON.stringify(elementoSeleccionado);
      const archivo = new Blob([contenido], { type: 'application/json' });
      elemento.href = URL.createObjectURL(archivo);
      elemento.download = `${elementoSeleccionado.nombre}.json`;
      document.body.appendChild(elemento);
      elemento.click();
      document.body.removeChild(elemento);
    }
  };

  const descargarArchivo = async (path: string, title: string) => {
    try {
      const respuesta = await fetch(path);
      const blob = await respuesta.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', title);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar archivo:', error);
      alert('Error al descargar archivo');
    }
  };

  const copiarUrl = () => {
    if (elementoSeleccionado && 'url' in elementoSeleccionado) {
      const campoTexto = document.createElement('textarea');
      campoTexto.innerText = elementoSeleccionado.url;
      document.body.appendChild(campoTexto);
      campoTexto.select();
      document.execCommand('copy');
      campoTexto.remove();
      alert('URL copiada al portapapeles!');
    }
  };

  const obtenerDescripcionCorta = (descripcion: string) => {
    if (descripcion && descripcion.length > LIMITE_DESCRIPCION) {
      return descripcion.substring(0, LIMITE_DESCRIPCION) + '...';
    }
    return descripcion || 'Sin descripción';
  };

  const manejarClickImagen = (srcImagen: string) => {
    setImagenAmpliada(srcImagen);
  };

  const cerrarImagenAmpliada = () => {
    setImagenAmpliada(null);
  };

  const cambiarOrden = () => {
    setOrdenamiento(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const renderizarEstadoVacio = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <p className="text-2xl font-semibold text-gray-600">Templates Pronto</p>
      <p className="text-gray-500 mt-2">Estamos trabajando en nuevos templates</p>
    </div>
  );

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const renderizarContenido = () => {
    const datosActuales = libreriActiva === 'retell' ? voiceAgents : workflows;

    if (!datosActuales || datosActuales.length === 0) {
      return renderizarEstadoVacio();
    }

    if (libreriActiva === 'retell') {
      return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {voiceAgents.map((agente) => (
            <div
              key={agente.nombre + agente.fecha}
              className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02]"
            >
              <div className="aspect-video w-full overflow-hidden cursor-pointer" onClick={() => manejarClickImagen(agente.imagen)}>
                <img
                  src={agente.imagen || '/placeholder-image.jpg'}
                  alt={agente.nombre}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                />
              </div>
              <div className="p-6 flex flex-col justify-between" style={{ minHeight: '220px' }}>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{agente.nombre}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-3" title={agente.descripcion || ''}>
                    {obtenerDescripcionCorta(agente.descripcion || '')}
                  </p>
                </div>
                <div className="flex flex-col items-stretch">
                  <a
                    href={agente.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors mb-2 text-center"
                    onClick={(e) => {
                      if (!agente.url) {
                        e.preventDefault();
                        alert('URL de Drive no disponible');
                      }
                    }}
                  >
                    Ir a Carpeta Drive
                  </a>
                  <a
                    href={agente.loom || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <Play size={20} />
                    {agente.loom ? 'Ver Tutorial' : 'Tutorial Pendiente'}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {workflows.map((workflow) => (
          <div
            key={workflow.nombre + workflow.fecha}
            className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02]"
          >
            <div className="aspect-video w-full overflow-hidden cursor-pointer" onClick={() => manejarClickImagen(workflow.imagen)}>
              <img
                src={workflow.imagen}
                alt={workflow.nombre}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
              />
            </div>
            <div className="p-6 flex flex-col justify-between" style={{ minHeight: '220px' }}>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{workflow.nombre}</h3>
                <p className="text-gray-600 mb-4 line-clamp-3" title={workflow.descripcion}>
                  {obtenerDescripcionCorta(workflow.descripcion)}
                </p>
              </div>
              <div className="flex flex-col items-stretch">
                <button
                  onClick={() => manejarClickWorkflow(workflow)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors mb-2"
                >
                  Descargar
                </button>
                <a
                  href={workflow.loom}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <Play size={20} />
                  {workflow.loom ? 'Ver Tutorial' : 'Tutorial Pendiente'}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Infragrowth Library</h1>
            <button
              onClick={cambiarOrden}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              {ordenamiento === 'asc' ? <SortAsc size={20} /> : <SortDesc size={20} />}
              {ordenamiento === 'asc' ? 'Más antiguos primero' : 'Más recientes primero'}
            </button>
          </div>
          <div className="flex justify-center space-x-4">
            <button
              className={`px-4 py-2 rounded-md transition-colors ${
                libreriActiva === 'n8n'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setLibreriaActiva('n8n')}
            >
              n8n Templates
            </button>
            <button
              className={`px-4 py-2 rounded-md transition-colors ${
                libreriActiva === 'flowise'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setLibreriaActiva('flowise')}
            >
              Flowise Templates
            </button>
            <button
              className={`px-4 py-2 rounded-md transition-colors ${
                libreriActiva === 'retell'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setLibreriaActiva('retell')}
            >
              Voice Agents
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {renderizarContenido()}
      </main>

      <Modal
        isOpen={modalAbierto}
        onRequestClose={cerrarModal}
        className="max-w-3xl mx-auto mt-20 bg-white rounded-lg shadow-xl outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {elementoSeleccionado?.nombre}
            </h2>
            <button
              onClick={cerrarModal}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          {libreriActiva === 'flowise' && elementoSeleccionado && 'archivo' in elementoSeleccionado && elementoSeleccionado.archivo ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-2">Archivos Disponibles:</h3>
              {elementoSeleccionado.archivo.map((archivo, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                  <div className="flex-1 mr-8">
                    <span className="text-gray-700">{index + 1}. {archivo.title}</span>
                  </div>
                  <button
                    onClick={() => descargarArchivo(archivo.path, archivo.title)}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors whitespace-nowrap"
                  >
                    <Download size={16} />
                    Descargar
                  </button>
                </div>
              ))}
            </div>
          ) : libreriActiva === 'n8n' ? (
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={copiarJson}
                className="flex items-center justify-center gap-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
              >
                <Copy size={20} />
                Copiar JSON
              </button>
              <button
                onClick={descargarJson}
                className="flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
              >
                <Download size={20} />
                Descargar JSON
              </button>
              <button
                onClick={copiarUrl}
                className="flex items-center justify-center gap-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
              >
                <Link size={20} />
                Copiar URL
              </button>
            </div>
          ) : null}
        </div>
      </Modal>

      {imagenAmpliada && (
        <div 
          className="fixed top-0 left-0 h-screen w-screen bg-black bg-opacity-75 flex items-center justify-center z-50" 
          onClick={cerrarImagenAmpliada}
        >
          <img 
            src={imagenAmpliada} 
            alt="Imagen Ampliada" 
            className="max-w-4xl max-h-4xl object-contain cursor-pointer" 
          />
        </div>
      )}
    </div>
  );
};

export default App;
