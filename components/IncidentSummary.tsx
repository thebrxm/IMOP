
import React, { useState, useMemo, useEffect } from 'react';
import { AlertData } from '../types';

interface Props {
  alerts: AlertData[];
}

export const IncidentSummary: React.FC<Props> = ({ alerts }) => {
  const [copied, setCopied] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [cumulativeStats, setCumulativeStats] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('alerty_cumulative_stats');
    return saved ? JSON.parse(saved) : {};
  });

  const [processedIds, setProcessedIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('alerty_processed_ids');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    let statsChanged = false;
    const newStats = { ...cumulativeStats };
    const newProcessedIds = new Set(processedIds);

    alerts.forEach(alert => {
      if (!newProcessedIds.has(alert.id)) {
        const label = alert.incident.trim();
        newStats[label] = (Number(newStats[label]) || 0) + 1;
        newProcessedIds.add(alert.id);
        statsChanged = true;
      }
    });

    if (statsChanged) {
      setCumulativeStats(newStats);
      setProcessedIds(newProcessedIds);
      localStorage.setItem('alerty_cumulative_stats', JSON.stringify(newStats));
      localStorage.setItem('alerty_processed_ids', JSON.stringify(Array.from(newProcessedIds)));
    }
  }, [alerts]);

  const sortedIncidents = useMemo(() => {
    return Object.entries(cumulativeStats)
      .map(([label, count]) => ({ label, count: count as number }))
      .sort((a, b) => (b.count as number) - (a.count as number) || a.label.localeCompare(b.label));
  }, [cumulativeStats]);

  const activeLabels = useMemo(() => new Set(alerts.map(a => a.incident.trim())), [alerts]);
  
  // Fix: Explicitly type the accumulator as 'number' to prevent 'unknown' operator errors.
  const totalCumulative = useMemo(() => Object.values(cumulativeStats).reduce((sum: number, val) => sum + Number(val), 0), [cumulativeStats]);

  const toggleSelection = (label: string) => {
    const key = label.toUpperCase();
    const newSelection = new Set(selectedIds);
    if (newSelection.has(key)) newSelection.delete(key);
    else newSelection.add(key);
    setSelectedIds(newSelection);
  };

  const handleCopySummary = () => {
    const itemsToCopy = selectedIds.size > 0 
      ? sortedIncidents.filter(inc => selectedIds.has(inc.label.toUpperCase()))
      : sortedIncidents;
    
    // Fix: Explicitly type the accumulator as 'number' to prevent 'unknown' operator errors.
    const finalTotal = itemsToCopy.reduce((s: number, i) => s + i.count, 0);
    const summaryText = `*RESUMEN OPERATIVO*\n\n` +
      itemsToCopy.map(inc => `- ${inc.label}: ${inc.count < 10 ? '0' : ''}${inc.count}`).join('\n') +
      `\n\n*TOTAL: ${finalTotal < 10 ? '0' : ''}${finalTotal}*`;
    navigator.clipboard.writeText(summaryText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const resetAllStats = () => {
    if (confirm("¿Limpiar todo el historial acumulativo?")) {
      setCumulativeStats({});
      setProcessedIds(new Set());
      setSelectedIds(new Set());
      localStorage.removeItem('alerty_cumulative_stats');
      localStorage.removeItem('alerty_processed_ids');
    }
  };

  if (sortedIncidents.length === 0) return null;

  return (
    <div className="mb-6 space-y-4 animate-slide-in">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] font-mono">Resumen Acumulativo</h3>
        <div className="flex items-center gap-2">
          {copied && <span className="text-[9px] font-bold text-emerald-500 animate-pulse font-mono uppercase">Copiado</span>}
          <div className="flex bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 shadow-sm">
            <button onClick={handleCopySummary} className="p-1.5 flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {sortedIncidents.map((incident, idx) => {
          const isSelected = selectedIds.has(incident.label.toUpperCase());
          const isActiveNow = activeLabels.has(incident.label);
          return (
            <button 
              key={idx} 
              onClick={() => toggleSelection(incident.label)}
              className={`text-left p-3 rounded-xl flex items-center justify-between shadow-sm transition-all active:scale-95 border
                ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' : isActiveNow ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700' : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800 opacity-60'}
              `}
            >
              <div className="min-w-0 flex-1">
                <p className={`text-[9px] font-bold uppercase tracking-tight font-mono mb-0.5 truncate ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>{incident.label}</p>
                <p className={`text-xl font-black font-mono leading-none ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'dark:text-white text-slate-900'}`}>{incident.count < 10 ? `0${incident.count}` : incident.count}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div onDoubleClick={resetAllStats} className={`p-5 rounded-2xl flex justify-between items-center shadow-xl border cursor-pointer ${selectedIds.size > 0 ? 'bg-blue-600 border-blue-400' : 'bg-slate-900 border-slate-800'}`}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" /></svg></div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.2em] font-mono text-white/60 leading-none mb-1">Total Sistema</p>
            <p className="text-white font-black text-sm font-mono tracking-tighter uppercase leading-none">Acumulado General</p>
          </div>
        </div>
        <div className="text-4xl font-black text-white font-mono tracking-tighter leading-none">{totalCumulative < 10 ? `0${totalCumulative}` : totalCumulative}</div>
      </div>
    </div>
  );
};
