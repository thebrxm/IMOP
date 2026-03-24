import React from 'react';

interface Props {
  permission: NotificationPermission;
  onRequest: () => void;
}

export const NotificationBell: React.FC<Props> = ({ permission, onRequest }) => {
  const getIconColor = () => {
    if (permission === 'granted') return 'text-green-500';
    if (permission === 'denied') return 'text-red-500';
    return 'text-gray-400';
  };

  return (
    <button 
      onClick={onRequest}
      className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
      title="Permisos de Notificación"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${getIconColor()}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {permission !== 'granted' && (
        <span className="absolute top-1 right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
        </span>
      )}
    </button>
  );
};