
import React, { useState, useEffect } from 'react';
import { IncidentForm } from './components/IncidentForm';
import { AlertCard } from './components/AlertCard';
import { NotificationBell } from './components/NotificationBell';
import { ToastNotification } from './components/ToastNotification';
import { SettingsPanel } from './components/SettingsPanel';
import { AuthScreen } from './components/AuthScreen';
import { IncidentSummary } from './components/IncidentSummary';
import { EcuesDashboard } from './components/EcuesDashboard';
import { AlertData, Coordinates, NotificationSettings, SeverityLevel } from './types';
import { analyzeIncident } from './services/geminiService';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<string | null>(null);

  // App States
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(true);
  
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<'send' | 'ecues' | 'history' | 'settings'>('send');
  const [toast, setToast] = useState<{message: string, location: string} | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Settings State with Persistence
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('alertSettings');
    return saved ? JSON.parse(saved) : {
      soundEnabled: true,
      vibrationEnabled: true,
      vibrationPattern: 'default',
      customIconUrl: ''
    };
  });

  // Derived state for Critical Alert Mode
  const hasCriticalAlerts = alerts.some(a => !a.isHandled && a.severity === SeverityLevel.CRITICAL);

  useEffect(() => {
    localStorage.setItem('alertSettings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('alerty_user');
    if (savedUser) {
      setUser(savedUser);
    }

    // Check for browser support
    if (!('Notification' in window)) {
      setIsSupported(false);
    } else {
      setPermission(Notification.permission);
      // Auto-request permission on load if default
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(res => setPermission(res));
      }
    }
    
    // Check system preference for dark mode initially
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  // Toggle Dark Mode Class on HTML element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogin = (username: string) => {
    setUser(username);
    localStorage.setItem('alerty_user', username);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('alerty_user');
    setActiveTab('send'); // Reset tab
  };

  const requestNotificationPermission = async () => {
    if (!isSupported) return;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  };

  const sendPushNotification = async (alert: AlertData) => {
    if (isSupported && permission === 'granted') {
      const title = `🚨 ${alert.incident}`;
      const bodyText = alert.notes 
        ? `${alert.location}\nNota: ${alert.notes}`
        : alert.location;

      // Calculate Vibration Pattern
      let vibratePattern: number[] = [];
      if (settings.vibrationEnabled) {
          switch (settings.vibrationPattern) {
              case 'urgent': vibratePattern = [100, 50, 100, 50, 100, 50]; break;
              case 'long': vibratePattern = [500, 200, 500, 200]; break;
              case 'default': 
              default: vibratePattern = [200, 100, 200]; break;
          }
      }

      // Determine Icon
      const iconUrl = settings.customIconUrl || 'https://cdn-icons-png.flaticon.com/512/564/564619.png';

      const options: any = {
        body: bodyText,
        icon: iconUrl,
        badge: 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
        tag: alert.id,
        requireInteraction: alert.severity === 'CRITICAL',
        vibrate: vibratePattern,
        silent: !settings.soundEnabled,
        data: { id: alert.id }
      };

      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          registration.showNotification(title, options);
        } else {
          const notification = new Notification(title, options);
          notification.onclick = () => window.focus();
        }
      } catch (e) {
        console.error("Error enviando notificación:", e);
        new Notification(title, options);
      }
    }
  };

  const handleCreateAlert = async (incident: string, location: string, notes: string, coords?: Coordinates) => {
    setLoading(true);
    
    const analysis = await analyzeIncident(incident, location);

    const newAlert: AlertData = {
      id: Date.now().toString(),
      incident,
      location,
      notes,
      formattedMessage: analysis.formattedMessage,
      severity: analysis.severity,
      timestamp: new Date(),
      coordinates: coords,
      isHandled: false
    };

    setAlerts(prev => [newAlert, ...prev]);
    sendPushNotification(newAlert);
    setToast({ message: incident, location: location });
    setLoading(false);
  };

  const handleUpdateAlert = (id: string, updatedData: Partial<AlertData>) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, ...updatedData } : alert
    ));
  };

  const toggleAlertHandled = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, isHandled: !alert.isHandled } : alert
    ));
  };

  const deleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const filteredAlerts = alerts.filter(alert => {
    const query = searchQuery.toLowerCase();
    return (
      alert.incident.toLowerCase().includes(query) ||
      alert.location.toLowerCase().includes(query) ||
      (alert.notes && alert.notes.toLowerCase().includes(query))
    );
  });

  if (!user) {
    return (
       <div className={darkMode ? 'dark' : ''}>
          <AuthScreen onLogin={handleLogin} />
       </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 max-w-md mx-auto sm:max-w-xl md:max-w-2xl bg-slate-50 dark:bg-slate-900 shadow-2xl overflow-hidden border-x border-slate-200 dark:border-slate-800 relative transition-colors duration-300">
      
      {toast && (
        <ToastNotification 
          message={toast.message} 
          subMessage={toast.location}
          onClose={() => setToast(null)} 
        />
      )}

      <header className={`bg-slate-900 dark:bg-slate-950 text-white sticky top-0 z-10 px-6 py-4 flex justify-between items-center shadow-lg border-b-4 transition-colors duration-500 ${hasCriticalAlerts ? 'border-red-600' : 'border-slate-700'}`}>
        <div className="flex items-center gap-3">
          <img 
            src="https://raw.githubusercontent.com/ai-studio-assets/logos/main/ecues-logo.png" 
            alt="Logo ECUES" 
            className="h-10 w-10 object-contain drop-shadow-md"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div>
            <h1 className="text-xl font-black tracking-widest uppercase font-mono leading-none">IMOP</h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mt-1">Hola, {user}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          
          {hasCriticalAlerts && (
            <div className="relative mr-2 flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <div className="relative bg-red-600 p-1.5 rounded-full shadow-lg shadow-red-600/50 flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          )}

          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {isSupported && (
            <NotificationBell 
              permission={permission} 
              onRequest={requestNotificationPermission} 
            />
          )}

          <button 
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors ml-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      <div className="px-4 pt-6 pb-2">
        <div className="flex bg-slate-200 dark:bg-slate-800 p-1.5 rounded-xl shadow-inner transition-colors duration-300">
          <button
            onClick={() => setActiveTab('send')}
            className={`flex-1 py-2.5 px-2 rounded-lg text-[10px] sm:text-xs font-bold tracking-wide transition-all duration-200 ${activeTab === 'send' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
          >REPORTE</button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 px-2 rounded-lg text-[10px] sm:text-xs font-bold tracking-wide transition-all duration-200 ${activeTab === 'history' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
          >LOG</button>
          <button
            onClick={() => setActiveTab('ecues')}
            className={`flex-1 py-2.5 px-2 rounded-lg text-[10px] sm:text-xs font-bold tracking-wide transition-all duration-200 ${activeTab === 'ecues' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
          >ECUES</button>
           <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2.5 px-2 rounded-lg text-[10px] sm:text-xs font-bold tracking-wide transition-all duration-200 ${activeTab === 'settings' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
          >AJUSTES</button>
        </div>
      </div>

      <main className="p-4 space-y-6">
        {activeTab === 'send' && (
          <div className="animate-slide-in">
             <IncidentForm onSubmit={handleCreateAlert} isLoading={loading} />
          </div>
        )}

        {activeTab === 'ecues' && <EcuesDashboard />}

        {activeTab === 'history' && (
          <div className="animate-slide-in">
            <IncidentSummary alerts={alerts} />
            <div className="relative mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar evento..."
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all"
                />
            </div>
            <div className="space-y-3 pb-10">
              {filteredAlerts.map(alert => (
                <AlertCard 
                  key={alert.id} 
                  alert={alert} 
                  onToggleHandled={toggleAlertHandled}
                  onDelete={deleteAlert}
                  onUpdate={handleUpdateAlert}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && <SettingsPanel settings={settings} onUpdate={setSettings} />}
      </main>
    </div>
  );
};

export default App;
