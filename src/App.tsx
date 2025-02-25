import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import { Download, Copy, Link, X, Play, SortAsc, SortDesc } from 'lucide-react';
import { Workflow, VoiceAgent, LibraryType } from './types';

Modal.setAppElement('#root');

const DESCRIPTION_LIMIT = 100;

const App = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [voiceAgents, setVoiceAgents] = useState<VoiceAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Workflow | VoiceAgent | null>(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLibrary, setActiveLibrary] = useState<LibraryType>('n8n');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.post('https://flows.axelriveroc.com/webhook/n8nlibrary/get', {
          type: activeLibrary,
          sort: sortOrder
        });
        
        if (response.data && Array.isArray(response.data.data)) {
          if (activeLibrary === 'retell') {
            setVoiceAgents(response.data.data);
          } else {
            setWorkflows(response.data.data);
          }
        } else {
          setError('Invalid data format received from server');
        }
      } catch (error) {
        setError('Error fetching data. Please try again later.');
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeLibrary, sortOrder]);

  const handleWorkflowClick = (workflow: Workflow) => {
    setSelectedItem(workflow);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedItem(null);
  };

  const copyJson = () => {
    if (selectedItem && 'json' in selectedItem) {
      const textField = document.createElement('textarea');
      textField.innerText = selectedItem.json;
      document.body.appendChild(textField);
      textField.select();
      document.execCommand('copy');
      textField.remove();
      alert('JSON copied to clipboard!');
    }
  };

  const downloadJson = () => {
    if (selectedItem) {
      const element = document.createElement('a');
      const content = 'json' in selectedItem ? selectedItem.json : JSON.stringify(selectedItem);
      const file = new Blob([content], { type: 'application/json' });
      element.href = URL.createObjectURL(file);
      element.download = `${selectedItem.nombre}.json`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const copyUrl = () => {
    if (selectedItem && 'url' in selectedItem) {
      const textField = document.createElement('textarea');
      textField.innerText = selectedItem.url;
      document.body.appendChild(textField);
      textField.select();
      document.execCommand('copy');
      textField.remove();
      alert('URL copied to clipboard!');
    }
  };

  const getShortenedDescription = (description: string) => {
    if (description && description.length > DESCRIPTION_LIMIT) {
      return description.substring(0, DESCRIPTION_LIMIT) + '...';
    }
    return description || 'Sin descripción';
  };

  const handleImageClick = (imageSrc: string) => {
    setZoomedImage(imageSrc);
  };

  const closeZoomedImage = () => {
    setZoomedImage(null);
  };

  const toggleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <p className="text-2xl font-semibold text-gray-600">Templates Pronto</p>
      <p className="text-gray-500 mt-2">Estamos trabajando en nuevos templates</p>
    </div>
  );

  if (loading) {
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
            Retry
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    const currentData = activeLibrary === 'retell' ? voiceAgents : workflows;

    if (!currentData || currentData.length === 0) {
      return renderEmptyState();
    }

    if (activeLibrary === 'retell') {
      return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {voiceAgents.map((agent) => (
            <div
              key={agent.nombre + agent.fecha}
              className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02]"
            >
              <div className="aspect-video w-full overflow-hidden cursor-pointer" onClick={() => handleImageClick(agent.imagen)}>
                <img
                  src={agent.imagen || '/placeholder-image.jpg'}
                  alt={agent.nombre}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                />
              </div>
              <div className="p-6 flex flex-col justify-between" style={{ minHeight: '220px' }}>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{agent.nombre}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-3" title={agent.descripcion || ''}>
                    {getShortenedDescription(agent.descripcion || '')}
                  </p>
                </div>
                <div className="flex flex-col items-stretch">
                  <a
                    href={agent.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors mb-2 text-center"
                    onClick={(e) => {
                      if (!agent.url) {
                        e.preventDefault();
                        alert('URL de Drive no disponible');
                      }
                    }}
                  >
                    Ir a Carpeta Drive
                  </a>
                  <a
                    href={agent.loom || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <Play size={20} />
                    {agent.loom ? 'Ver Tutorial' : 'Tutorial Pendiente'}
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
            <div className="aspect-video w-full overflow-hidden cursor-pointer" onClick={() => handleImageClick(workflow.imagen)}>
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
                  {getShortenedDescription(workflow.descripcion)}
                </p>
              </div>
              <div className="flex flex-col items-stretch">
                <button
                  onClick={() => handleWorkflowClick(workflow)}
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
              onClick={toggleSort}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              {sortOrder === 'asc' ? <SortAsc size={20} /> : <SortDesc size={20} />}
              {sortOrder === 'asc' ? 'Más antiguos primero' : 'Más recientes primero'}
            </button>
          </div>
          <div className="flex justify-center space-x-4">
            <button
              className={`px-4 py-2 rounded-md transition-colors ${
                activeLibrary === 'n8n'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setActiveLibrary('n8n')}
            >
              n8n Templates
            </button>
            <button
              className={`px-4 py-2 rounded-md transition-colors ${
                activeLibrary === 'flowise'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setActiveLibrary('flowise')}
            >
              Flowise Templates
            </button>
            <button
              className={`px-4 py-2 rounded-md transition-colors ${
                activeLibrary === 'retell'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setActiveLibrary('retell')}
            >
              Voice Agents
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {renderContent()}
      </main>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        className="max-w-3xl mx-auto mt-20 bg-white rounded-lg shadow-xl outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedItem?.nombre}
            </h2>
            <button
              onClick={closeModal}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          <div className={`grid gap-4 ${activeLibrary === 'n8n' ? 'grid-cols-3' : 'grid-cols-1'}`}>
            {activeLibrary === 'n8n' ? (
              <>
                <button
                  onClick={copyJson}
                  className="flex items-center justify-center gap-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <Copy size={20} />
                  Copiar JSON
                </button>
                <button
                  onClick={downloadJson}
                  className="flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                >
                  <Download size={20} />
                  Descargar JSON
                </button>
                <button
                  onClick={copyUrl}
                  className="flex items-center justify-center gap-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <Link size={20} />
                  Copiar URL
                </button>
              </>
            ) : (
              <button
                onClick={downloadJson}
                className="flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
              >
                <Download size={20} />
                Descargar Archivo
              </button>
            )}
          </div>
        </div>
      </Modal>

      {zoomedImage && (
        <div className="fixed top-0 left-0 h-screen w-screen bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={closeZoomedImage}>
          <img src={zoomedImage} alt="Zoomed Image" className="max-w-4xl max-h-4xl object-contain cursor-pointer" />
        </div>
      )}
    </div>
  );
};

export default App;
