import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Registro del Service Worker para notificaciones PUSH reales
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('Service Worker registrado con éxito:', registration);
    }).catch(error => {
      console.log('Error al registrar Service Worker:', error);
    });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);