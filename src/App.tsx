import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import { Download, Copy, Link, X, Info } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import type { Workflow } from './types';

Modal.setAppElement('#root');

function App() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [fairPrices, setFairPrices] = useState<{ [key: string]: number }>({});
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const response = await axios.post('https://flows.axelriveroc.com/webhook/n8nlibrary/get');
        if (response.data && Array.isArray(response.data.data)) {
          setWorkflows(response.data.data);
          // Initialize fair prices for each workflow
          const initialFairPrices: { [key: string]: number } = {};
          response.data.data.forEach(workflow => {
            initialFairPrices[workflow.nombre + workflow.fecha] = 0;
          });
          setFairPrices(initialFairPrices);
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

  const closePurchaseModal = () => {
    setShowPurchaseModal(false);
  };

  const copyJson = () => {
    if (selectedWorkflow) {
      const textField = document.createElement('textarea');
      textField.innerText = selectedWorkflow.json;
      document.body.appendChild(textField);
      textField.select();
      document.execCommand('copy');
      textField.remove();
      toast.success('JSON copied to clipboard!', {
        position: toast.POSITION.BOTTOM_RIGHT
      });
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
      toast.success('URL copied to clipboard!', {
        position: toast.POSITION.BOTTOM_RIGHT
      });
    }
  };

  const handleFairPriceChange = (workflow: Workflow, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numberValue = Number(value);
    const key = workflow.nombre + workflow.fecha;

    if (value === '' || (!isNaN(numberValue) && isFinite(numberValue))) {
      setFairPrices(prevFairPrices => ({
        ...prevFairPrices,
        [key]: value === '' ? 0 : numberValue,
      }));
    }
  };

  const createStripeSession = async (workflow: Workflow, price: number) => {
    try {
      const response = await axios.post('/.netlify/functions/create-checkout-session', {
        price: price * 100, // Stripe uses cents
        workflowName: workflow.nombre,
      });

      window.location.href = response.data.url; // Redirect to Stripe checkout
    } catch (error) {
      console.error('Error creating Stripe session:', error);
      toast.error('Failed to initiate payment. Please try again.', {
        position: toast.POSITION.BOTTOM_RIGHT
      });
    }
  };

  const handleDownloadOrPurchase = (workflow: Workflow) => {
    const key = workflow.nombre + workflow.fecha;
    const price = fairPrices[key] || 0;

    setSelectedWorkflow(workflow);
    if (price === 0) {
      setModalIsOpen(true);
    } else if (price >= 1) {
      createStripeSession(workflow, price);
    }
  };

  const handleTooltipMouseEnter = (e: React.MouseEvent<HTMLSpanElement>) => {
    setShowTooltip(true);
    setTooltipPosition({
      top: e.clientY,
      left: e.clientX,
    });
  };

  const handleTooltipMouseLeave = () => {
    setShowTooltip(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-center">
          <h1 className="text-3xl font-bold text-gray-900">Infragrowth Library</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <ToastContainer />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {workflows.map((workflow) => {
            const key = workflow.nombre + workflow.fecha;
            return (
              <div
                key={key}
                className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02]"
              >
                <div className="aspect-video w-full overflow-hidden">
                  <img
                    src={workflow.imagen}
                    alt={workflow.nombre}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{workflow.nombre}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">{workflow.descripcion}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <label htmlFor={`fairPrice-${key}`} className="mr-2 text-sm text-gray-700">
                        Precio Justo:
                      </label>
                      <input
                        type="text"
                        id={`fairPrice-${key}`}
                        className="shadow appearance-none border rounded w-20 py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                        value={fairPrices[key] || 0}
                        onChange={(e) => handleFairPriceChange(workflow, e)}
                        placeholder="0"
                      />
                      <span
                        className="ml-1 relative cursor-pointer"
                        onMouseEnter={handleTooltipMouseEnter}
                        onMouseLeave={handleTooltipMouseLeave}
                      >
                        <Info size={16} className="inline-block align-text-top" />
                      </span>
                      {showTooltip && (
                        <div
                          className="absolute bg-gray-800 text-white text-sm rounded-md p-2 z-10"
                          style={{
                            top: tooltipPosition.top + 10,
                            left: tooltipPosition.left + 10,
                          }}
                        >
                          Si bien puedes descargar el flujo gratis, te invitamos a colocar un precio justo por el valor del workflow.
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDownloadOrPurchase(workflow)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      style={{ marginLeft: '10px' }}
                    >
                      {fairPrices[key] === 0 ? 'Descargar' : 'Pagar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            )
          })}
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

          <div className="aspect-video w-full mb-6">
            <iframe
              src={selectedWorkflow?.loom}
              frameBorder="0"
              allowFullScreen
              className="w-full h-full rounded-lg"
            ></iframe>
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

      {/* Purchase Modal */}
      <Modal
        isOpen={showPurchaseModal}
        onRequestClose={closePurchaseModal}
        className="max-w-md mx-auto mt-20 bg-white rounded-lg shadow-xl outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Próximamente
            </h2>
            <button
              onClick={closePurchaseModal}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>
          <p className="text-gray-600 text-center mb-4">
            La opción de compra estará disponible próximamente.
          </p>
          <button
            onClick={closePurchaseModal}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default App;
