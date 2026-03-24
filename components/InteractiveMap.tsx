
import React, { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import { Coordinates } from '../types';

interface Props {
  coordinates: Coordinates;
  popupText: string;
}

export const InteractiveMap: React.FC<Props> = ({ coordinates, popupText }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Configuración inicial de Leaflet (Fix para iconos en frameworks modernos)
    if (L.Icon && L.Icon.Default) {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    }

    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false
      }).setView([coordinates.lat, coordinates.lng], 16);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      // Marcador del Incidente
      L.marker([coordinates.lat, coordinates.lng]).addTo(map)
        .bindPopup(`<b>Ubicación del Reporte</b><br>${popupText}`)
        .openPopup();
      
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coordinates, popupText]);

  const openExternalMap = () => {
    // We combine coordinates and the location text to ensure Google Maps shows the exact point
    // but also fills the search bar with the descriptive location name.
    const query = `${coordinates.lat},${coordinates.lng}+(${encodeURIComponent(popupText)})`;
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(url, '_blank');
  };

  return (
    <div className="relative w-full h-full group">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* Controles de Zoom Simplificados (Arriba Izquierda) */}
      <div className="absolute top-2 left-2 z-[1000] flex flex-col gap-1">
        <button 
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="bg-white dark:bg-slate-800 p-2 rounded-md shadow-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 active:scale-95 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
        <button 
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="bg-white dark:bg-slate-800 p-2 rounded-md shadow-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 active:scale-95 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Botón Re-centrar (Arriba Derecha) */}
      <div className="absolute top-2 right-2 z-[1000]">
        <button 
          onClick={() => mapInstanceRef.current?.setView([coordinates.lat, coordinates.lng], 16)}
          className="bg-white dark:bg-slate-800 p-2 rounded-md shadow-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 active:scale-95 transition-transform"
          title="Centrar en incidente"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
        </button>
      </div>

      {/* Botón Abrir Externo (Abajo Derecha) */}
      <div className="absolute bottom-4 right-4 z-[1000]">
        <button 
          onClick={openExternalMap}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-xl shadow-blue-500/30 border-2 border-white dark:border-slate-700 flex items-center justify-center active:scale-90 transition-all group"
          title="Abrir en Google Maps"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 text-[10px] font-black uppercase tracking-widest font-mono whitespace-nowrap">
            Abrir App
          </span>
        </button>
      </div>
    </div>
  );
};
