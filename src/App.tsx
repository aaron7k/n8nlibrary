import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import { Download, Copy, Link, X, Play } from 'lucide-react';
import { Workflow } from './types';

Modal.setAppElement('#root');

const DESCRIPTION_LIMIT = 100;

function App() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tooltipText, setTooltipText] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const response = await axios.post('https://flows.axelriveroc.com/webhook/n8nlibrary/get');
        if (response.data && Array.isArray(response.data.data)) {
          setWorkflows(response.data.data);
        } else {
          setError('Invalid data format received from server');
        }
      } catch (error) {
        setError('Error fetching workflows. Please try again later.');
        console.error('Error fetching workflows:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflows();
  }, []);

  const handleWorkflowClick = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedWorkflow(null);
  };

  const copyJson = () => {
    if (selectedWorkflow) {
      const textField = document.createElement('textarea');
      textField.innerText = selectedWorkflow.json;
      document.body.appendChild(textField);
      textField.select();
      document.execCommand('copy');
      textField.remove();
      alert('JSON copied to clipboard!');
    }
  };

  const downloadJson = () => {
    if (selectedWorkflow) {
      const element = document.createElement('a');
      const file = new Blob([selectedWorkflow.json], { type: 'application/json' });
      element.href = URL.createObjectURL(file);
      element.download = `${selectedWorkflow.nombre}.json`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const copyUrl = () => {
    if (selectedWorkflow) {
      const textField = document.createElement('textarea');
      textField.innerText = selectedWorkflow.url;
      document.body.appendChild(textField);
      textField.select();
      document.execCommand('copy');
      textField.remove();
      alert('URL copied to clipboard!');
    }
  };

  const getShortenedDescription = (description: string) => {
    if (description.length > DESCRIPTION_LIMIT) {
      return description.substring(0, DESCRIPTION_LIMIT) + '...';
    }
    return description;
  };

  const handleImageClick = (imageSrc: string) => {
    setZoomedImage(imageSrc);
  };

  const closeZoomedImage = () => {
    setZoomedImage(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-center">
          <h1 className="text-3xl font-bold text-gray-900">Infragrowth Library</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
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
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors mb-2"
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
      </main>

      {/* Tutorial Modal */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        className="max-w-3xl mx-auto mt-20 bg-white rounded-lg shadow-xl outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedWorkflow?.nombre}
            </h2>
            <button
              onClick={closeModal}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={copyJson}
              className="flex items-center justify-center gap-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
            >
              <Copy size={20} />
              Copiar JSON
            </button>
            <button
              onClick={downloadJson}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
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
}

export default App;
