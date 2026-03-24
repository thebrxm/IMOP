
import React, { useState, useEffect } from 'react';
import { PatientState } from '../types';
import { INITIAL_PATIENT_STATE, HOSPITAL_LIST } from '../constants';

export const EcuesDashboard: React.FC = () => {
  const [state, setState] = useState<PatientState>(() => {
    const saved = localStorage.getItem('imop_ecues_v2');
    return saved ? JSON.parse(saved) : INITIAL_PATIENT_STATE;
  });

  const [showMethane, setShowMethane] = useState(false);
  const [showObitos, setShowObitos] = useState(false);
  const [showEvacuados, setShowEvacuados] = useState(false);
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('imop_ecues_v2', JSON.stringify(state));
  }, [state]);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    if ('vibrate' in navigator) navigator.vibrate(30);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const updateMainCounter = (type: 'atendidos' | 'trasladados', delta: number) => {
    if ('vibrate' in navigator) navigator.vibrate(20);

    setState(prev => {
      const newVal = Math.max(0, prev[type] + delta);
      if (delta < 0 && prev[type] === 0) return prev;

      let newHospitals = [...prev.hospitals];
      
      if (type === 'trasladados' && delta > 0) {
        if (newHospitals.length === 0) {
          newHospitals = [{ id: Date.now().toString(), name: '', count: delta }];
        } else {
          newHospitals[0] = { ...newHospitals[0], count: newHospitals[0].count + delta };
        }
      }

      return {
        ...prev,
        [type]: newVal,
        hospitals: newHospitals,
        total: (type === 'atendidos' ? newVal : prev.atendidos) + (type === 'trasladados' ? newVal : prev.trasladados),
        byGender: { ...prev.byGender, sd: Math.max(0, prev.byGender.sd + delta) },
        byAge: { ...prev.byAge, sd: Math.max(0, prev.byAge.sd + delta) },
        lastUpdate: new Date().toISOString()
      };
    });
  };

  const reclassify = (group: 'gender' | 'age', target: string, delta: number) => {
    setState(prev => {
      const isGender = group === 'gender';
      const sdValue = isGender ? prev.byGender.sd : prev.byAge.sd;
      
      let actualDelta = delta;
      if (delta > 0) {
        actualDelta = Math.min(delta, sdValue);
      } else {
        const currentTargetVal = isGender ? (prev.byGender as any)[target] : (prev.byAge as any)[target];
        actualDelta = Math.max(delta, -currentTargetVal);
      }

      if (actualDelta === 0) return prev;
      
      if ('vibrate' in navigator) navigator.vibrate(20);

      const newByGender = isGender 
        ? { ...prev.byGender, sd: prev.byGender.sd - actualDelta, [target]: (prev.byGender as any)[target] + actualDelta } 
        : prev.byGender;
      const newByAge = !isGender 
        ? { ...prev.byAge, sd: prev.byAge.sd - actualDelta, [target]: (prev.byAge as any)[target] + actualDelta } 
        : prev.byAge;
        
      return { ...prev, byGender: newByGender, byAge: newByAge };
    });
  };

  const updateHospital = (id: string, delta: number) => {
    setState(prev => {
      const hospitals = prev.hospitals.map(h => {
        if (h.id === id) {
          const newVal = Math.max(0, h.count + delta);
          return { ...h, count: newVal };
        }
        return h;
      });

      const totalHosp = hospitals.reduce((sum, h) => sum + h.count, 0);
      if (totalHosp > prev.trasladados && delta > 0) return prev;

      return { ...prev, hospitals };
    });
  };

  const addHospitalRow = () => {
    setState(prev => ({
      ...prev,
      hospitals: [...prev.hospitals, { id: Date.now().toString(), name: '', count: 0 }]
    }));
  };

  const removeHospitalRow = (id: string) => {
    setState(prev => ({
      ...prev,
      hospitals: prev.hospitals.filter(h => h.id !== id)
    }));
  };

  const buildSummaryText = (isUrlEncoded: boolean = true) => {
    const { incidente, direccion, total, atendidos, trasladados, byGender, byAge, resources, hospitals, obitos, evacuados, isFinalCount, notas, intervencion } = state;
    
    const nl = isUrlEncoded ? '%0A' : '\n';
    const bold = '*';

    let text = `${bold}Incidente: ${incidente || 'N/A'}${bold}${nl}`;
    text += `${bold}Dirección: ${direccion || 'N/A'}${bold}${nl}${nl}`;
    text += `${bold}${isFinalCount ? 'FINAL' : 'Hasta ahora'} ${total} pacientes${bold}${nl}${nl}`;

    text += `Sexo:${nl}`;
    text += `${bold} Mas: ${byGender.male} | Fem: ${byGender.female} | S/D: ${byGender.sd}${bold}${nl}${nl}`;
    text += `Edad:${nl}`;
    text += `${bold} Men: ${byAge.minor} | May: ${byAge.adult} | S/D: ${byAge.sd}${bold}${nl}${nl}`;

    text += `Procedimiento:${nl}`;
    text += `${bold} Atendidos en el lugar: ${atendidos}${bold}${nl}`;
    text += `${bold} Trasladados: ${trasladados}${bold}${nl}`;
    text += `→ Destino traslados (hospitales):${nl}`;
    
    const activeHospitals = hospitals.filter(h => h.count > 0);
    if (activeHospitals.length > 0) {
      activeHospitals.forEach(h => {
        const hName = h.name === 'OTROS' ? (h.customName || 'OTROS') : h.name;
        text += `- ${hName}: ${h.count}${nl}`;
      });
    } else {
      text += `S/D${nl}`;
    }
    text += `${nl}`;

    text += `Dotación:${nl}`;
    text += `${bold} Móviles: ${resources.moviles} | Aéreo: ${resources.aereo}${bold}${nl}`;

    if (intervencion && intervencion.trim()) {
      text += `${nl}Intervención: ${intervencion}${nl}`;
    }

    if (notas && notas.trim()) {
      text += `${nl}Notas: ${notas}${nl}`;
    }

    if (obitos > 0 || evacuados > 0) {
      text += `${nl}Información Adicional:${nl}`;
      if (obitos > 0) text += `- ${bold}Óbitos: ${obitos}${bold}${nl}`;
      if (evacuados > 0) text += `- Evacuados: ${evacuados}${nl}`;
    }

    return text;
  };

  const generateWhatsAppSummary = () => {
    showNotification("Preparando envío a WhatsApp...");
    const text = buildSummaryText(true);
    setTimeout(() => {
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }, 500);
  };

  const copyToClipboard = () => {
    const text = buildSummaryText(false);
    navigator.clipboard.writeText(text).then(() => {
      showNotification("Copiado al portapapeles correctamente.");
    }).catch(err => {
      console.error('Error al copiar:', err);
      alert("Error al copiar. Intente de nuevo.");
    });
  };

  const handleReset = () => {
    if (confirm("¿Desea reiniciar todos los valores para realizar un NUEVO REPORTE?")) {
      setState(INITIAL_PATIENT_STATE);
      showNotification("Contadores reiniciados para nuevo reporte.");
    }
  };

  const getEmbedFallbackUrl = () => {
    const query = encodeURIComponent(state.direccion || "Buenos Aires");
    return `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  };

  const methanePlaceholders: Record<string, string> = {
    m: "Ej.: Si/no",
    e: "Ej.: Dirección exacta",
    t: "Ej.: Incendio, explosión",
    h: "Ej.: Químicos, humo",
    a: "Ej.: Noria",
    n: "Ej.: 5 heridos",
    e2: "Ej.: SAME, Bomberos"
  };

  return (
    <div className="relative pb-24">
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] animate-slide-in">
          <div className="bg-slate-800 text-white px-6 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 whitespace-nowrap">
            <div className="bg-emerald-500 rounded-full p-1">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider font-mono">{toastMessage}</span>
          </div>
        </div>
      )}

      <div className="fixed right-4 bottom-24 z-50 flex flex-col gap-3">
        <button onClick={handleReset} className="w-12 h-12 rounded-full bg-red-600 text-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform border-2 border-white dark:border-slate-800" title="Reiniciar para nuevo reporte">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
        <button onClick={copyToClipboard} className="w-12 h-12 rounded-full bg-blue-600 text-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform border-2 border-white dark:border-slate-800" title="Copiar al Portapapeles">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-5 5h7m-7 4h7" /></svg>
        </button>
        <button onClick={generateWhatsAppSummary} className="w-12 h-12 rounded-full bg-emerald-500 text-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform border-2 border-white dark:border-slate-800" title="Enviar a WhatsApp">
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </button>
      </div>

      <div className="bg-slate-900 dark:bg-black rounded-3xl p-8 border border-slate-800 shadow-2xl text-center relative overflow-hidden mb-6">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-red-500"></div>
        <div className="flex flex-col items-center">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono mb-2">
            {state.isFinalCount ? 'FINAL' : 'HASTA AHORA'}
          </p>
          <div className="relative">
            <div className="absolute inset-0 blur-3xl bg-blue-500/20 rounded-full scale-150"></div>
            <span className="relative text-8xl font-black text-white font-mono tracking-tighter tabular-nums leading-none">
              {state.total < 10 ? `0${state.total}` : state.total}
            </span>
          </div>
          <button 
            onClick={() => setState(p => ({...p, isFinalCount: !p.isFinalCount}))}
            className={`mt-4 px-4 py-1.5 rounded-full text-[10px] font-black font-mono transition-all border-2 uppercase tracking-widest ${state.isFinalCount ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-red-600 border-red-400 text-white'}`}
          >
            {state.isFinalCount ? 'Hasta Ahora' : 'FINAL'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="flex justify-center gap-3">
          <button onClick={() => setShowMethane(!showMethane)} className={`px-4 py-2 rounded-xl text-xs font-black font-mono tracking-tighter transition-all border ${showMethane ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}>METHANE</button>
          <button onClick={() => setShowObitos(!showObitos)} className={`px-4 py-2 rounded-xl text-xs font-black font-mono tracking-tighter transition-all border ${showObitos ? 'bg-black border-slate-600 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}>ÓBITOS</button>
          <button onClick={() => setShowEvacuados(!showEvacuados)} className={`px-4 py-2 rounded-xl text-xs font-black font-mono tracking-tighter transition-all border ${showEvacuados ? 'bg-amber-600 border-amber-400 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}>EVACUADOS</button>
        </div>

        {showMethane && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-900/50 shadow-lg animate-slide-in">
            <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-mono mb-4 border-b border-emerald-100 dark:border-emerald-900 pb-2">Protocolo METHANE</h3>
            <div className="space-y-3">
              {['m', 'e', 't', 'h', 'a', 'n', 'e2'].map((key) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="w-8 text-center font-black text-emerald-500 font-mono text-lg uppercase">{key[0] === 'e' && key.length > 1 ? 'E' : key.toUpperCase()}:</label>
                  <input 
                    type="text" 
                    value={(state.methane as any)[key]}
                    onChange={(e) => setState(p => ({...p, methane: {...p.methane, [key]: e.target.value}}))}
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 dark:text-white"
                    placeholder={methanePlaceholders[key]}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mb-2">Incidente</label>
            <input type="text" value={state.incidente} onChange={(e) => setState(p => ({...p, incidente: e.target.value}))} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Ej: Incendio, Accidente..."/>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Ubicación / Dirección</label>
              <button 
                onClick={() => setShowLocationMap(!showLocationMap)}
                className={`p-1 rounded flex items-center gap-1 transition-colors ${showLocationMap ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-400 hover:text-blue-500'}`}
                title="Ver mapa de ubicación"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.806-.984A10.324 10.324 0 0118 7.369V2.5" />
                </svg>
                <span className="text-[9px] font-black uppercase tracking-tighter">MAPA</span>
              </button>
            </div>
            <input type="text" value={state.direccion} onChange={(e) => setState(p => ({...p, direccion: e.target.value}))} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Dirección exacta..."/>
            
            {showLocationMap && (
              <div className="mt-4 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 animate-slide-in p-2">
                <div className="w-full h-48 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 relative z-0 shadow-inner">
                   <iframe width="100%" height="100%" frameBorder="0" scrolling="no" src={getEmbedFallbackUrl()} title="Mapa ECUES" className="opacity-95"></iframe>
                </div>
                <p className="text-[9px] text-slate-400 text-center mt-1 font-mono italic">Vista satelital de la ubicación actual</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">Procedimiento</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: 'atendidos', label: 'Atendidos en el Lugar', color: 'emerald' },
              { id: 'trasladados', label: 'Trasladados', color: 'blue' }
            ].map(item => (
              <div key={item.id} className={`p-4 rounded-2xl bg-${item.color}-50 dark:bg-${item.color}-950/20 border border-${item.color}-100 dark:border-${item.color}-900/50`}>
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-[10px] font-black text-${item.color}-600 dark:text-${item.color}-400 uppercase font-mono`}>{item.label}</span>
                  <span className={`text-2xl font-black font-mono dark:text-white`}>{(state as any)[item.id]}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => Array.from({length: 10}).forEach(() => updateMainCounter(item.id as any, -1))} className="py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-[10px] font-black font-mono active:scale-95 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600">-10</button>
                  <button onClick={() => Array.from({length: 10}).forEach(() => updateMainCounter(item.id as any, 1))} className="py-2 bg-slate-800 text-white rounded-lg text-[10px] font-black font-mono active:scale-95 border border-slate-700">+10</button>
                  <button onClick={() => updateMainCounter(item.id as any, -1)} className="py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500 active:scale-90 transition-all font-bold">-1</button>
                  <button onClick={() => updateMainCounter(item.id as any, 1)} className={`py-2 bg-${item.color}-600 text-white rounded-lg shadow-lg border-b-4 border-${item.color}-800 active:scale-90 transition-all font-bold`}>+1</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {(showObitos || showEvacuados) && (
          <div className="grid grid-cols-2 gap-4">
            {showObitos && (
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 shadow-xl">
                <label className="block text-[10px] font-black text-red-500 uppercase tracking-widest font-mono mb-2">Óbitos</label>
                <div className="flex items-center justify-between">
                  <input type="number" value={state.obitos} onChange={(e) => setState(p => ({...p, obitos: Math.max(0, parseInt(e.target.value) || 0)}))} className="w-20 bg-black border border-slate-700 rounded-lg px-2 py-2 text-white font-mono text-xl outline-none focus:ring-1 focus:ring-red-500" />
                  <div className="flex gap-2">
                    <button onClick={() => setState(p => ({...p, obitos: Math.max(0, p.obitos - 1)}))} className="w-10 h-10 bg-slate-800 rounded-lg text-white font-bold">-</button>
                    <button onClick={() => setState(p => ({...p, obitos: p.obitos + 1}))} className="w-10 h-10 bg-red-600 rounded-lg text-white font-bold">+</button>
                  </div>
                </div>
              </div>
            )}
            {showEvacuados && (
              <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-900 shadow-sm">
                <label className="block text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest font-mono mb-2">Evacuados</label>
                <div className="flex items-center justify-between">
                   <input type="number" value={state.evacuados} onChange={(e) => setState(p => ({...p, evacuados: Math.max(0, parseInt(e.target.value) || 0)}))} className="w-20 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-lg px-2 py-2 font-mono text-xl outline-none focus:ring-1 focus:ring-amber-500" />
                   <div className="flex gap-2">
                    <button onClick={() => setState(p => ({...p, evacuados: Math.max(0, p.evacuados - 1)}))} className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-800 font-bold">-</button>
                    <button onClick={() => setState(p => ({...p, evacuados: p.evacuados + 1}))} className="w-10 h-10 bg-amber-600 rounded-lg text-white font-bold">+</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono mb-6 border-b border-slate-100 dark:border-slate-700 pb-2">Sexo</h3>
            <div className="space-y-4">
              {[
                { key: 'male', label: 'Masculino', color: 'blue' },
                { key: 'female', label: 'Femenino', color: 'rose' },
                { key: 'sd', label: 'Sin Datos', color: 'slate', isSD: true }
              ].map(item => (
                <div key={item.key} className={`p-3 rounded-xl border flex items-center justify-between ${item.isSD && state.byGender.sd > 0 ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 animate-pulse' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}>
                  <div>
                    <p className={`text-[10px] font-black uppercase font-mono ${item.isSD ? 'text-amber-600' : `text-${item.color}-500`}`}>{item.label}</p>
                    <p className="text-xl font-black font-mono dark:text-white">{(state.byGender as any)[item.key]}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => item.isSD ? setState(p => ({...p, byGender: {...p.byGender, sd: Math.max(0, p.byGender.sd - 1)}})) : reclassify('gender', item.key, -1)} className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400">-1</button>
                    {!item.isSD && (
                      <button onClick={() => reclassify('gender', item.key, 1)} className={`w-8 h-8 rounded-lg bg-${item.color}-600 text-white shadow-lg`}>+1</button>
                    )}
                    {!item.isSD && (
                      <>
                        <button onClick={() => reclassify('gender', item.key, -10)} className="px-2 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-500 text-[10px] font-black border border-slate-300 dark:border-slate-600">-10</button>
                        <button onClick={() => reclassify('gender', item.key, 10)} className="px-2 h-8 rounded-lg bg-slate-700 text-white text-[10px] font-black">+10</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono mb-6 border-b border-slate-100 dark:border-slate-700 pb-2">Edad</h3>
            <div className="space-y-4">
              {[
                { key: 'minor', label: 'Menores', color: 'purple' },
                { key: 'adult', label: 'Mayores', color: 'indigo' },
                { key: 'sd', label: 'Sin Datos', color: 'slate', isSD: true }
              ].map(item => (
                <div key={item.key} className={`p-3 rounded-xl border flex items-center justify-between ${item.isSD && state.byAge.sd > 0 ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 animate-pulse' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}>
                  <div>
                    <p className={`text-[10px] font-black uppercase font-mono ${item.isSD ? 'text-amber-600' : `text-${item.color}-500`}`}>{item.label}</p>
                    <p className="text-xl font-black font-mono dark:text-white">{(state.byAge as any)[item.key]}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => item.isSD ? setState(p => ({...p, byAge: {...p.byAge, sd: Math.max(0, p.byAge.sd - 1)}})) : reclassify('age', item.key, -1)} className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400">-1</button>
                    {!item.isSD && (
                      <button onClick={() => reclassify('age', item.key, 1)} className={`w-8 h-8 rounded-lg bg-${item.color}-600 text-white shadow-lg`}>+1</button>
                    )}
                    {!item.isSD && (
                      <>
                        <button onClick={() => reclassify('age', item.key, -10)} className="px-2 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-500 text-[10px] font-black border border-slate-300 dark:border-slate-600">-10</button>
                        <button onClick={() => reclassify('age', item.key, 10)} className="px-2 h-8 rounded-lg bg-slate-700 text-white text-[10px] font-black">+10</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">Dotación</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            {['moviles', 'aereo'].map(key => (
              <div key={key} className="flex-1 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black text-slate-500 uppercase font-mono">{key}</span>
                  <span className="text-2xl font-black font-mono dark:text-white">{(state.resources as any)[key]}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <button onClick={() => setState(p => ({...p, resources: {...p.resources, [key]: Math.max(0, (p.resources as any)[key] - 10)}}))} className="py-1.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px] font-black font-mono text-slate-500 border border-slate-300 dark:border-slate-600 active:scale-95">-10</button>
                   <button onClick={() => setState(p => ({...p, resources: {...p.resources, [key]: (p.resources as any)[key] + 10}}))} className="py-1.5 bg-slate-700 text-white rounded text-[10px] font-black font-mono active:scale-95 border border-slate-600">+10</button>
                   <button onClick={() => setState(p => ({...p, resources: {...p.resources, [key]: Math.max(0, (p.resources as any)[key] - 1)}}))} className="py-1.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-bold active:scale-95">-1</button>
                   <button onClick={() => setState(p => ({...p, resources: {...p.resources, [key]: (p.resources as any)[key] + 1}}))} className="py-1.5 bg-blue-600 text-white rounded shadow-md font-bold active:scale-95">+</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">Destinos de Traslado</h3>
            <span className="text-[10px] font-bold text-blue-500 font-mono">Asignados: {state.hospitals.reduce((s, h) => s + h.count, 0)} / {state.trasladados}</span>
          </div>
          
          <div className="space-y-4">
            {state.hospitals.map((hosp) => (
              <div key={hosp.id} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <div className="flex-1 w-full">
                    <select 
                      value={hosp.name}
                      onChange={(e) => setState(p => ({...p, hospitals: p.hospitals.map(h => h.id === hosp.id ? {...h, name: e.target.value} : h)}))}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none dark:text-white"
                    >
                      <option value="">Seleccionar Hospital...</option>
                      {HOSPITAL_LIST.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    {hosp.name === 'OTROS' && (
                      <input 
                        type="text"
                        value={hosp.customName || ''}
                        onChange={(e) => setState(p => ({...p, hospitals: p.hospitals.map(h => h.id === hosp.id ? {...h, customName: e.target.value} : h)}))}
                        className="mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs outline-none dark:text-white"
                        placeholder="Nombre del hospital..."
                      />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button onClick={() => updateHospital(hosp.id, -1)} className="text-slate-400 hover:text-red-500 font-black text-xl">-</button>
                    <span className="w-8 text-center font-black font-mono text-lg dark:text-white">{hosp.count}</span>
                    <button onClick={() => updateHospital(hosp.id, 1)} className="text-blue-500 hover:text-blue-600 font-black text-xl">+</button>
                  </div>

                  <button onClick={() => removeHospitalRow(hosp.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={addHospitalRow}
            className="mt-4 w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 hover:text-blue-500 hover:border-blue-500 transition-all font-black font-mono text-[10px] uppercase tracking-widest"
          >
            + Agregar Destino
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">Intervención</h3>
            <textarea value={state.intervencion} onChange={(e) => setState(p => ({...p, intervencion: e.target.value}))} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[100px] resize-none" placeholder="Detalles de la intervención médica..."/>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">Notas</h3>
            <textarea value={state.notas} onChange={(e) => setState(p => ({...p, notas: e.target.value}))} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[100px] resize-none" placeholder="Observaciones adicionales..."/>
          </div>
        </div>
      </div>
    </div>
  );
};
