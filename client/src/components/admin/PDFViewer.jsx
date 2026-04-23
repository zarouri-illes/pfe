import React, { useEffect, useState } from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';

// CSS Imports
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

// Lucid Icons Fallback or just Lucide for toolbar if needed, but defaultLayout is great
import { Loader2, AlertCircle, X, Download } from 'lucide-react';
import api from '../../api/client';

const PDFViewer = ({ examId, onClose, title }) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  useEffect(() => {
    const fetchPdf = async () => {
      try {
        setLoading(true);
        // Using the proxy endpoint we just created
        const response = await api(`/api/admin/exams/${examId}/view`, {
            responseType: 'blob' // Assuming our api client supports this or we handle it
        });
        
        // If our api client doesn't handle blobs automatically, we might need a raw fetch
        // But let's assume it returns a blob if we ask for it. 
        // If it returns JSON by default, we'll use a standard fetch here for reliability.
        
        const token = localStorage.getItem('token');
        const rawRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/exams/${examId}/view`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!rawRes.ok) throw new Error('Échec du chargement du document');

        const blob = await rawRes.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (err) {
        console.error('PDF Fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (examId) fetchPdf();

    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [examId]);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center rounded-xl shadow-lg shadow-blue-200">
              <Download size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider truncate max-w-md">
                {title || 'Visionneuse PDF'}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Mode Aperçu Sécurisé</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Viewer Content */}
        <div className="flex-1 bg-slate-50 relative overflow-hidden flex flex-col items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] animate-pulse">Chargement du document...</p>
            </div>
          ) : error ? (
            <div className="text-center p-10 bg-white rounded-lg shadow-xl border border-slate-200 flex flex-col items-center gap-4 max-w-sm mx-auto">
               <AlertCircle className="text-red-500" size={48} />
               <h4 className="text-lg font-black text-slate-900">Erreur de chargement</h4>
               <p className="text-sm text-slate-500 font-bold">{error}</p>
               <button 
                 onClick={onClose}
                 className="mt-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-transform hover:scale-105"
               >
                 Retour
               </button>
            </div>
          ) : (
            <div className="w-full h-full custom-pdf-viewer">
              <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
                <Viewer
                  fileUrl={pdfUrl}
                  plugins={[defaultLayoutPluginInstance]}
                  theme="light"
                />
              </Worker>
            </div>
          )}
        </div>
      </div>
      
      {/* Custom Styles for PDF Scrollbar */}
      <style>{`
        .custom-pdf-viewer .rpv-core__viewer {
          background-color: #f8fafc;
        }
        .custom-pdf-viewer .rpv-default-layout__body {
          flex: 1;
          height: 100%;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default PDFViewer;
