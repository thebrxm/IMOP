
import React, { useState } from 'react';

interface Props {
  onLogin: (username: string) => void;
}

export const AuthScreen: React.FC<Props> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Por favor, complete todos los campos requeridos');
      return;
    }

    setLoading(true);

    // Simulación de validación institucional
    setTimeout(() => {
      const normalizedUser = username.trim().toLowerCase();
      const users = JSON.parse(localStorage.getItem('app_users') || '{"admin": "admin123"}');

      if (isLogin) {
        if (users[normalizedUser] && users[normalizedUser] === password) {
          handleSuccess();
        } else {
          setError('Credenciales no válidas para este sector.');
          setLoading(false);
        }
      } else {
        if (users[normalizedUser]) {
          setError('Este identificador ya está registrado.');
          setLoading(false);
        } else {
          users[normalizedUser] = password;
          localStorage.setItem('app_users', JSON.stringify(users));
          handleSuccess();
        }
      }
    }, 1200);
  };

  const handleSuccess = () => {
    setIsSuccess(true);
    if ('vibrate' in navigator) navigator.vibrate([10, 30, 10]);
    setTimeout(() => {
       onLogin(username.trim());
    }, 1500);
  };

  const handleBiometric = () => {
    setLoading(true);
    setTimeout(() => {
      handleSuccess();
    }, 1000);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center animate-slide-in max-w-sm w-full text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-emerald-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white font-mono uppercase tracking-widest mb-3">
            Acceso Confirmado
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-mono text-xs uppercase tracking-tight">Iniciando protocolo IMOP...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-all duration-500">
        
        {/* Banner Institucional con Efecto de Gradiente */}
        <div className="bg-slate-950 p-8 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-red-500 to-blue-500 opacity-50"></div>
           <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl"></div>
           
           <div className="flex items-center gap-5 relative z-10">
             <div className="p-3 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10">
               <img 
                 src="https://raw.githubusercontent.com/ai-studio-assets/logos/main/ecues-logo.png" 
                 alt="IMOP" 
                 className="h-12 w-12 object-contain"
               />
             </div>
             <div>
               <h1 className="text-3xl font-black text-white tracking-widest font-mono uppercase leading-none">IMOP</h1>
               <p className="text-blue-400 text-[8px] font-black uppercase tracking-[0.1em] mt-2 max-w-[200px] leading-tight">Incident Management Operational Platform</p>
             </div>
           </div>
        </div>

        {/* Cuerpo del Formulario */}
        <div className="p-8 space-y-6">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${isLogin ? 'bg-white dark:bg-slate-700 shadow-lg text-slate-900 dark:text-white' : 'text-slate-500'}`}
            >
              Acceso
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${!isLogin ? 'bg-white dark:bg-slate-700 shadow-lg text-slate-900 dark:text-white' : 'text-slate-500'}`}
            >
              Registro
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identificador de Usuario</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                </span>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold placeholder-slate-400 text-sm"
                  placeholder="ID de Agente"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña Táctica</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                </span>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold placeholder-slate-400 text-sm"
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.888 9.888L2 2m10 8l10 10" /></svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={() => setRememberMe(!rememberMe)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Mantener conectado</span>
              </label>
              {isLogin && <button type="button" className="text-[11px] font-bold text-blue-500 uppercase hover:underline">Olvide mi acceso</button>}
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-2xl text-red-600 dark:text-red-400 text-xs font-black flex items-center gap-3 animate-slide-in">
                <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transform transition-all active:scale-[0.97] uppercase tracking-widest flex justify-center items-center gap-3 disabled:opacity-50 mt-2"
            >
              {loading ? (
                 <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                isLogin ? 'Confirmar Ingreso' : 'Finalizar Registro'
              )}
            </button>
          </form>

          {/* Opciones de Acceso Rápido */}
          <div className="pt-6 space-y-4 border-t border-slate-100 dark:border-slate-800">
             <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acceso Rápido</span>
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
             </div>
             
             <div className="flex gap-3">
               <button 
                onClick={handleBiometric}
                className="flex-1 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
               >
                 <svg className="h-6 w-6 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0112 20c4.478 0 8.268-2.943 9.542-7" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 9a3 3 0 013-3m-3 3a3 3 0 003 3m-3-3l-2.828 2.828M12 12l2.828 2.828M12 12V9m0 3h3" /></svg>
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Biometría</span>
               </button>
               <button className="flex-1 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
                 <svg className="h-6 w-6 text-slate-400 group-hover:text-red-500 transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h4.74c-.2 1.06-.9 1.95-2.02 2.56l2.72 2.1c1.6-1.48 2.53-3.66 2.53-6.22 0-.55-.06-1.1-.17-1.72h-5.12z"/><path d="M12.48 24c3.24 0 5.95-1.08 7.93-2.9l-2.72-2.1c-.74.5-1.7.8-2.73.8-2.1 0-3.88-1.42-4.52-3.32l-2.83 2.18C9.44 21.6 11.77 24 14.48 24z"/><path d="M9.96 16.48c-.16-.48-.25-1-.25-1.52s.09-1.04.25-1.52l-2.83-2.18c-.52 1.06-.83 2.25-.83 3.54s.3 2.48.83 3.54l2.83-2.18z"/><path d="M14.48 7.2c1.76 0 3.34.6 4.58 1.8l3.43-3.43C20.4 3.5 17.7 2.4 14.48 2.4 11.77 2.4 9.44 4.8 7.55 9.72l2.83 2.18c.64-1.9 2.42-3.32 4.1-3.32z"/></svg>
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Google</span>
               </button>
               <button className="flex-1 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
                 <svg className="h-6 w-6 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M17.073 21.376c-.56.323-1.2.504-1.873.504-1.936 0-3.504-1.568-3.504-3.504 0-.673.181-1.313.504-1.873-.896-.544-1.952-.864-3.088-.864-3.232 0-5.856 2.624-5.856 5.856 0 3.232 2.624 5.856 5.856 5.856 3.232 0 5.856-2.624 5.856-5.856 0-1.136-.32-2.192-.864-3.088z"/></svg>
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Apple ID</span>
               </button>
             </div>
          </div>
          
          <p className="text-center text-[9px] text-slate-400 font-mono uppercase tracking-widest mt-4">
            Conexión Segura de Grado Operativo <br/> AES-256 Institucional
          </p>
        </div>
      </div>
    </div>
  );
};
