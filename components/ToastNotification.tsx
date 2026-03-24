import React, { useEffect } from 'react';

interface Props {
  message: string;
  subMessage: string;
  onClose: () => void;
}

export const ToastNotification: React.FC<Props> = ({ message, subMessage, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Disappears after 4 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-24 left-4 right-4 z-50 flex justify-center pointer-events-none">
      <div className="bg-gray-900/95 backdrop-blur text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-slide-in pointer-events-auto max-w-sm w-full border border-gray-700">
        <div className="bg-red-500 p-2 rounded-full shrink-0 animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm uppercase tracking-wide text-red-400">Alerta Enviada</h4>
          <p className="text-white font-semibold truncate">{message}</p>
          <p className="text-gray-400 text-xs truncate">{subMessage}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};