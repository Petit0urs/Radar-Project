import React, { useState, useMemo } from 'react';
import { Project, Material, ProjectStatus, THRESHOLDS, WorkSession } from '../types';
import { Icons } from './Icons';

interface StatsViewProps {
  projects: Project[];
  materials: Material[];
  sessions: WorkSession[];
}

type ChartPeriod = 'WEEK' | 'MONTH' | 'YEAR';

export const StatsView: React.FC<StatsViewProps> = ({ projects, materials, sessions }) => {
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('WEEK');
  
  // Calculate Stats (Global)
  const totalTimeMinutes = projects.reduce((acc, p) => acc + p.spentMinutes, 0);
  
  // 1. Coût des Machines (Investissement fixe)
  const totalMachineCost = materials
    .filter(m => m.type === 'MACHINE')
    .reduce((acc, m) => acc + m.cost, 0);

  // 2. Coût des Consommables (Basé sur l'utilisation réelle dans les projets)
  const totalConsumableUsageCost = projects.reduce((acc, project) => {
    let projectConsumableCost = 0;
    if (project.consumableUsage) {
      Object.entries(project.consumableUsage).forEach(([matId, qty]) => {
        const material = materials.find(m => m.id === matId);
        // On ne compte que si le matériau existe et est un consommable (sécurité)
        if (material && material.type === 'CONSUMABLE') {
          projectConsumableCost += (qty * material.cost);
        }
      });
    }
    return acc + projectConsumableCost;
  }, 0);

  const totalGlobalCost = totalMachineCost + totalConsumableUsageCost;
  
  const statusCounts = {
    [ProjectStatus.ACTIVE]: 0,
    [ProjectStatus.NEGLECTED]: 0,
    [ProjectStatus.ABANDONED]: 0,
    [ProjectStatus.COMPLETED]: 0
  };

  projects.forEach(p => {
    if (p.progressPercentage === 100) {
        statusCounts[ProjectStatus.COMPLETED]++;
        return;
    }

    const daysSince = Math.floor((new Date().getTime() - new Date(p.lastActivityDate).getTime()) / (1000 * 3600 * 24));
    if (daysSince > THRESHOLDS.ABANDONED_DAYS) statusCounts[ProjectStatus.ABANDONED]++;
    else if (daysSince > THRESHOLDS.NEGLECTED_DAYS) statusCounts[ProjectStatus.NEGLECTED]++;
    else statusCounts[ProjectStatus.ACTIVE]++;
  });

  // Material Usage
  const materialUsage = materials.map(m => {
    const usageCount = projects.filter(p => p.materialIds.includes(m.id)).length;
    return { ...m, usageCount };
  }).sort((a, b) => b.usageCount - a.usageCount);

  const topMaterials = materialUsage.filter(m => m.usageCount > 0).slice(0, 5);

  // --- CHART LOGIC ---
  const chartData = useMemo(() => {
      const now = new Date();
      const data: { label: string; value: number; fullDate?: string }[] = [];
      
      if (chartPeriod === 'WEEK') {
          // Last 7 days (current week view)
          const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
          // Initialize last 7 days map
          const map = new Map<string, number>();
          // Start from 6 days ago
          for (let i = 6; i >= 0; i--) {
              const d = new Date(now);
              d.setDate(now.getDate() - i);
              const key = d.toISOString().split('T')[0];
              const label = days[d.getDay()];
              map.set(key, 0);
              data.push({ label, value: 0, fullDate: key });
          }

          sessions.forEach(s => {
              const sDate = s.date.split('T')[0];
              if (map.has(sDate)) {
                  const idx = data.findIndex(d => d.fullDate === sDate);
                  if (idx !== -1) data[idx].value += s.durationMinutes;
              }
          });
      } else if (chartPeriod === 'MONTH') {
          // Days of current month
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
          
          for (let i = 1; i <= daysInMonth; i++) {
              data.push({ label: `${i}`, value: 0 });
          }

          sessions.forEach(s => {
              const d = new Date(s.date);
              if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                  const day = d.getDate();
                  if (data[day - 1]) data[day - 1].value += s.durationMinutes;
              }
          });
      } else if (chartPeriod === 'YEAR') {
          // Months of current year
          const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
          months.forEach(m => data.push({ label: m, value: 0 }));
          
          sessions.forEach(s => {
              const d = new Date(s.date);
              if (d.getFullYear() === now.getFullYear()) {
                  const monthIdx = d.getMonth();
                  if (data[monthIdx]) data[monthIdx].value += s.durationMinutes;
              }
          });
      }

      return data;
  }, [sessions, chartPeriod]);

  const maxChartValue = Math.max(...chartData.map(d => d.value), 60); // Min scale of 1h to avoid empty look

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
        <Icons.Stats className="text-purple-500 dark:text-purple-400" /> Tableau de Bord
      </h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold mb-1">Projets Total</div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{projects.length}</div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold mb-1">Temps Passé</div>
            <div className="text-3xl font-bold text-blue-500 dark:text-blue-400">{Math.floor(totalTimeMinutes / 60)}h<span className="text-lg text-slate-400 dark:text-slate-500">{totalTimeMinutes % 60}</span></div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold mb-1">Coût Total</div>
            <div className="text-3xl font-bold text-emerald-500 dark:text-emerald-400">{totalGlobalCost.toFixed(0)}€</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex justify-between">
                <span>Mat: {totalMachineCost}€</span>
                <span>Conso: {totalConsumableUsageCost.toFixed(0)}€</span>
            </div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold mb-1">Terminés</div>
            <div className="text-3xl font-bold text-emerald-500 dark:text-emerald-400">{statusCounts[ProjectStatus.COMPLETED]}</div>
        </div>
      </div>

      {/* --- TIME CHART --- */}
      <div className="bg-surface p-6 rounded-2xl border border-slate-200 dark:border-slate-700 mb-8">
          <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Icons.Time className="text-blue-500" size={20} /> Historique de Travail
              </h3>
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                  <button 
                    onClick={() => setChartPeriod('WEEK')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${chartPeriod === 'WEEK' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                      7J
                  </button>
                  <button 
                    onClick={() => setChartPeriod('MONTH')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${chartPeriod === 'MONTH' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                      Mois
                  </button>
                  <button 
                    onClick={() => setChartPeriod('YEAR')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${chartPeriod === 'YEAR' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                      Année
                  </button>
              </div>
          </div>
          
          <div className="h-48 w-full flex items-end gap-1 md:gap-2">
              {chartData.map((data, i) => {
                  const heightPercent = (data.value / maxChartValue) * 100;
                  const isZero = data.value === 0;
                  return (
                      <div key={i} className="flex-1 flex flex-col items-center group relative">
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] px-2 py-1 rounded pointer-events-none whitespace-nowrap z-10">
                              {Math.floor(data.value / 60)}h {data.value % 60}m
                          </div>
                          
                          {/* Bar */}
                          <div 
                              className={`w-full rounded-t-sm transition-all duration-500 ${isZero ? 'bg-slate-100 dark:bg-slate-800 h-[2px]' : 'bg-blue-500 hover:bg-blue-400'}`}
                              style={{ height: isZero ? '4px' : `${heightPercent}%` }}
                          ></div>
                          
                          {/* Label */}
                          <div className="mt-2 text-[10px] text-slate-400 font-mono truncate w-full text-center">
                              {data.label}
                          </div>
                      </div>
                  )
              })}
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Status Distribution */}
        <div className="bg-surface p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">État des projets</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400"><Icons.Check size={16}/> Terminés</span>
                    <span className="font-bold text-xl text-slate-900 dark:text-white">{statusCounts[ProjectStatus.COMPLETED]}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-900 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${(statusCounts[ProjectStatus.COMPLETED] / projects.length) * 100 || 0}%` }}></div>
                </div>

                <div className="flex items-center justify-between mt-2">
                    <span className="flex items-center gap-2 text-blue-600 dark:text-blue-400"><Icons.Work size={16}/> En Cours</span>
                    <span className="font-bold text-xl text-slate-900 dark:text-white">{statusCounts[ProjectStatus.ACTIVE]}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-900 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-500 h-full" style={{ width: `${(statusCounts[ProjectStatus.ACTIVE] / projects.length) * 100 || 0}%` }}></div>
                </div>

                <div className="flex items-center justify-between mt-2">
                    <span className="flex items-center gap-2 text-neglected"><Icons.Warning size={16}/> Délaissés</span>
                    <span className="font-bold text-xl text-slate-900 dark:text-white">{statusCounts[ProjectStatus.NEGLECTED]}</span>
                </div>
                 <div className="w-full bg-slate-200 dark:bg-slate-900 rounded-full h-2 overflow-hidden">
                    <div className="bg-neglected h-full" style={{ width: `${(statusCounts[ProjectStatus.NEGLECTED] / projects.length) * 100 || 0}%` }}></div>
                </div>

                <div className="flex items-center justify-between mt-2">
                    <span className="flex items-center gap-2 text-abandoned"><Icons.Dead size={16}/> Abandonnés</span>
                    <span className="font-bold text-xl text-slate-900 dark:text-white">{statusCounts[ProjectStatus.ABANDONED]}</span>
                </div>
                 <div className="w-full bg-slate-200 dark:bg-slate-900 rounded-full h-2 overflow-hidden">
                    <div className="bg-abandoned h-full" style={{ width: `${(statusCounts[ProjectStatus.ABANDONED] / projects.length) * 100 || 0}%` }}></div>
                </div>
            </div>
        </div>

        {/* Top Tools */}
        <div className="bg-surface p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Matériel le plus utilisé</h3>
             {topMaterials.length === 0 ? (
                 <p className="text-slate-500 dark:text-slate-500 italic">Aucune donnée d'utilisation.</p>
             ) : (
                 <ul className="space-y-3">
                     {topMaterials.map(m => (
                         <li key={m.id} className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700/50 pb-2 last:border-0">
                             <span className="text-slate-700 dark:text-slate-300">{m.name}</span>
                             <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white text-xs px-2 py-1 rounded-full font-mono">
                                 {m.usageCount} projets
                             </span>
                         </li>
                     ))}
                 </ul>
             )}
        </div>
      </div>
    </div>
  );
};