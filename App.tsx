import React, { useState, useEffect, useMemo } from 'react';
import { Project, Material, ProjectStatus, THRESHOLDS, WorkSession } from './types';
import { Icons } from './components/Icons';
import { StatusBadge } from './components/StatusBadge';
import { GarageView } from './components/GarageView';
import { StatsView } from './components/StatsView';
import { SettingsView } from './components/SettingsView';
import { ProjectDetailModal } from './components/ProjectDetailModal';

// --- Types for App State ---
type SortOption = 'DATE' | 'TIME' | 'LOCATION' | 'MACHINE';

// --- Helper Functions ---
const calculateStatus = (project: Project): ProjectStatus => {
  if (project.progressPercentage === 100) return ProjectStatus.COMPLETED;

  const now = new Date();
  const last = new Date(project.lastActivityDate);
  const diffTime = Math.abs(now.getTime() - last.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > THRESHOLDS.ABANDONED_DAYS) return ProjectStatus.ABANDONED;
  if (diffDays > THRESHOLDS.NEGLECTED_DAYS) return ProjectStatus.NEGLECTED;
  return ProjectStatus.ACTIVE;
};

const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

// Helper to get location string from a project
const getProjectLocation = (project: Project, materials: Material[]): string => {
    const projectMaterials = materials.filter(m => project.materialIds.includes(m.id));
    const location = projectMaterials.find(m => m.location)?.location;
    return location || '';
};

// Helper to get main machine name
const getProjectMainMachine = (project: Project, materials: Material[]): string => {
    const projectMaterials = materials.filter(m => project.materialIds.includes(m.id));
    const machine = projectMaterials.find(m => m.type === 'MACHINE');
    return machine ? machine.name : '';
};

// --- Sub-Components ---
const ProjectCard: React.FC<{ 
  project: Project; 
  materials: Material[];
  onLogSession: (id: string) => void;
  onClick: (id: string) => void;
}> = ({ project, materials, onLogSession, onClick }) => {
  
  const status = calculateStatus(project);
  const daysSince = Math.floor((new Date().getTime() - new Date(project.lastActivityDate).getTime()) / (1000 * 3600 * 24));
  
  const estimatedMinutes = project.estimatedHours * 60;
  const timePercentage = estimatedMinutes > 0 ? (project.spentMinutes / estimatedMinutes) * 100 : 0;
  const isTimeOverrun = timePercentage > 100;
  const isCompleted = status === ProjectStatus.COMPLETED;
  
  const location = getProjectLocation(project, materials);
  const machineName = getProjectMainMachine(project, materials);

  return (
    <div 
      onClick={() => onClick(project.id)}
      className={`bg-surface rounded-xl p-5 border shadow-lg transition-all cursor-pointer relative overflow-hidden group flex flex-col ${isCompleted ? 'border-emerald-500/30 opacity-75 hover:opacity-100' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500'}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="min-w-0 flex-1">
          <h3 className={`text-xl font-bold truncate pr-2 ${isCompleted ? 'text-emerald-600 dark:text-emerald-100 line-through decoration-emerald-500/50' : 'text-slate-900 dark:text-slate-100'}`}>{project.name}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{project.description}</p>
          
          <div className="flex gap-2 mt-2">
            {location && (
                <span className="flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    <Icons.Location size={10} /> {location}
                </span>
            )}
            {machineName && (
                <span className="flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    <Icons.Garage size={10} /> {machineName}
                </span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 ml-2">
             <StatusBadge status={status} daysSinceActivity={daysSince} />
        </div>
      </div>

      <div className="space-y-4 flex-1">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><Icons.Time size={12} /> Temps Réel</span>
            <span className={isTimeOverrun ? "text-red-500 dark:text-red-400 font-bold" : "text-slate-700 dark:text-slate-300"}>
              {formatDuration(project.spentMinutes)} / {project.estimatedHours}h
            </span>
          </div>
          <div className="h-3 w-full bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden relative">
            <div 
              className={`h-full absolute top-0 left-0 transition-all duration-500 ${isTimeOverrun ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(timePercentage, 100)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><Icons.Progress size={12} /> Avancement Ressenti</span>
            <span className={`font-bold ${isCompleted ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>{project.progressPercentage}%</span>
          </div>
          <div className="h-3 w-full bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`}
              style={{ width: `${project.progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {!isCompleted && (
        <button 
          onClick={(e) => { e.stopPropagation(); onLogSession(project.id); }}
          className="mt-5 w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors z-10 relative"
        >
          <Icons.Work size={16} />
          Log Session
        </button>
      )}
      {isCompleted && (
          <div className="mt-5 w-full text-center text-emerald-600 dark:text-emerald-500 font-bold text-sm py-2 bg-emerald-100 dark:bg-emerald-900/10 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
              Projet Terminé !
          </div>
      )}
    </div>
  );
};

// --- Modals (Session & New Project) ---
const SessionModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (minutes: number, progress: number, consumableUpdates: Record<string, number>) => void; 
  project: Project | undefined;
  materials: Material[];
}> = ({ isOpen, onClose, onSave, project, materials }) => {
  const [duration, setDuration] = useState<string>('60');
  const [progress, setProgress] = useState<string>('0');
  const [consumableInputs, setConsumableInputs] = useState<Record<string, string>>({});

  useEffect(() => {
      if (isOpen && project) {
          setProgress(project.progressPercentage.toString());
          setConsumableInputs({});
      }
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  // Identify relevant consumables
  const linkedMaterials = materials.filter(m => project.materialIds.includes(m.id));
  const directConsumables = linkedMaterials.filter(m => m.type === 'CONSUMABLE');
  const machineConsumablesIds = linkedMaterials
    .filter(m => m.type === 'MACHINE' && m.linkedConsumableIds)
    .flatMap(m => m.linkedConsumableIds || []);
  const machineConsumables = materials.filter(m => machineConsumablesIds.includes(m.id));
  
  // Unique set of consumables to show input for
  const relevantConsumables = [...new Set([...directConsumables, ...machineConsumables])];

  const handleSave = () => {
    const updates: Record<string, number> = {};
    Object.entries(consumableInputs).forEach(([id, val]) => {
        const num = parseFloat(val);
        if (num > 0) updates[id] = num;
    });
    onSave(parseInt(duration) || 0, parseInt(progress) || 0, updates);
    onClose();
  };

  const handleConsumableChange = (id: string, val: string) => {
      setConsumableInputs(prev => ({...prev, [id]: val}));
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-surface border border-slate-200 dark:border-slate-600 w-full max-w-md rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Travailler sur : {project.name}</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm text-slate-500 dark:text-slate-400 mb-2">Temps passé (minutes)</label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[15, 30, 60, 120, 240].map(m => (
                <button key={m} onClick={() => setDuration(m.toString())} className={`px-4 py-2 rounded-lg border ${duration === m.toString() ? 'bg-primary text-white border-primary' : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'}`}>{m}m</button>
              ))}
            </div>
            <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-3 mt-2"/>
          </div>
          
          <div>
            <label className="block text-sm text-slate-500 dark:text-slate-400 mb-2">Nouvel avancement estimé (%)</label>
            <input type="range" min="0" max="100" value={progress} onChange={(e) => setProgress(e.target.value)} className="w-full accent-green-500 h-2 bg-slate-200 dark:bg-slate-900 rounded-lg appearance-none cursor-pointer"/>
            <div className="text-center font-bold text-2xl text-green-500 dark:text-green-400 mt-2">{progress}%</div>
          </div>

          {relevantConsumables.length > 0 && (
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <label className="block text-sm text-emerald-600 dark:text-emerald-400 font-bold mb-3 uppercase flex items-center gap-2">
                      <Icons.Consumable size={14} /> Consommables Utilisés
                  </label>
                  <div className="space-y-3">
                      {relevantConsumables.map(c => (
                          <div key={c.id}>
                              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300 mb-1">
                                  <span>{c.name}</span>
                                  <span className="text-xs text-slate-400 dark:text-slate-500">({c.unit})</span>
                              </div>
                              <input 
                                type="number" 
                                placeholder={`Quantité en ${c.unit}`}
                                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2"
                                value={consumableInputs[c.id] || ''}
                                onChange={(e) => handleConsumableChange(c.id, e.target.value)}
                              />
                          </div>
                      ))}
                  </div>
              </div>
          )}

        </div>
        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 py-3 text-slate-500 dark:text-slate-400 font-medium">Annuler</button>
          <button onClick={handleSave} className="flex-1 bg-primary hover:bg-blue-600 text-white py-3 rounded-xl font-bold">Enregistrer</button>
        </div>
      </div>
    </div>
  );
};

const NewProjectModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (p: Partial<Project>) => void }> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [hours, setHours] = useState('');

  if (!isOpen) return null;

  const hoursNum = parseFloat(hours);
  const isValid = name.trim().length > 0 && !isNaN(hoursNum) && hoursNum > 0;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-surface border border-slate-200 dark:border-slate-600 w-full max-w-md rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Nouveau Projet</h2>
        <div className="space-y-4">
          <input 
            placeholder="Nom du projet" 
            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-3" 
            value={name} 
            onChange={e => setName(e.target.value)} 
          />
          <textarea 
            placeholder="Description courte" 
            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-3 h-24" 
            value={desc} 
            onChange={e => setDesc(e.target.value)} 
          />
          <input 
            type="number" 
            placeholder="Estimation heures (> 0)" 
            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-3" 
            value={hours} 
            onChange={e => setHours(e.target.value)} 
            min="0.1"
          />
          <button 
            onClick={() => { 
                if (isValid) {
                    onSave({ name, description: desc, estimatedHours: hoursNum }); 
                    onClose(); 
                    setName(''); 
                    setDesc(''); 
                    setHours(''); 
                }
            }} 
            disabled={!isValid} 
            className="w-full bg-active text-white font-bold py-3 rounded-xl mt-4 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            Créer
          </button>
          <button onClick={onClose} className="w-full py-3 text-slate-500 dark:text-slate-400">Annuler</button>
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

const App = () => {
  // Theme State
  const [theme, setTheme] = useState<'light'|'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('rp_theme') as 'light'|'dark' || 'dark';
    }
    return 'dark';
  });

  // Data State
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('rp_projects');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [materials, setMaterials] = useState<Material[]>(() => {
    const saved = localStorage.getItem('rp_materials');
    return saved ? JSON.parse(saved) : [];
  });

  const [sessions, setSessions] = useState<WorkSession[]>(() => {
    const saved = localStorage.getItem('rp_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  // UI State
  const [activeTab, setActiveTab] = useState<'projects' | 'garage' | 'stats' | 'settings'>('projects');
  const [activeModal, setActiveModal] = useState<'none' | 'newProject' | 'session' | 'detail'>('none');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('DATE');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  // Persistence
  useEffect(() => { localStorage.setItem('rp_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('rp_materials', JSON.stringify(materials)); }, [materials]);
  useEffect(() => { localStorage.setItem('rp_sessions', JSON.stringify(sessions)); }, [sessions]);


  // Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('rp_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // --- Project Actions ---
  const addProject = (p: Partial<Project>) => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: p.name || 'Untitled',
      description: p.description || '',
      estimatedHours: p.estimatedHours || 10,
      spentMinutes: 0,
      progressPercentage: 0,
      lastActivityDate: new Date().toISOString(),
      materialIds: [],
      consumableUsage: {},
      createdAt: new Date().toISOString(),
    };
    setProjects(prev => [newProject, ...prev]);
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    // Also remove associated sessions? Optional, but cleaner.
    // For now, let's keep sessions for historical data even if project is deleted
    if (selectedProjectId === id) setSelectedProjectId(null);
  };

  const logSession = (minutes: number, newProgress: number, consumableUpdates: Record<string, number>) => {
    if (!selectedProjectId) return;
    
    // 1. Create Work Session Record
    const newSession: WorkSession = {
        id: Date.now().toString(),
        projectId: selectedProjectId,
        date: new Date().toISOString(),
        durationMinutes: minutes,
        notes: ''
    };
    setSessions(prev => [newSession, ...prev]); // Add to history

    // 2. Update Project Totals
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id === selectedProjectId) {
          // Merge consumable usage
          const newUsage = { ... (p.consumableUsage || {}) };
          Object.entries(consumableUpdates).forEach(([id, amount]) => {
              newUsage[id] = (newUsage[id] || 0) + amount;
          });

          return { 
              ...p, 
              spentMinutes: p.spentMinutes + minutes, 
              progressPercentage: newProgress, 
              lastActivityDate: new Date().toISOString(),
              consumableUsage: newUsage
          };
        }
        return p;
      });
      return updated;
    });
  };

  const toggleMaterialForProject = (projectId: string, materialId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const isLinked = p.materialIds.includes(materialId);
      return {
        ...p,
        materialIds: isLinked ? p.materialIds.filter(id => id !== materialId) : [...p.materialIds, materialId]
      };
    }));
  };

  // --- Material Actions ---
  const addMaterial = (m: Partial<Material>) => {
    const newMat: Material = {
      id: Date.now().toString(),
      name: m.name || 'Outil Inconnu',
      type: m.type || 'MACHINE',
      cost: m.cost || 0,
      unit: m.unit,
      location: m.location,
      linkedConsumableIds: m.linkedConsumableIds,
      purchasedDate: m.purchasedDate || new Date().toISOString()
    };
    setMaterials(prev => [...prev, newMat]);
  };

  const updateMaterial = (updated: Material) => {
    setMaterials(prev => prev.map(m => m.id === updated.id ? updated : m));
  };

  const deleteMaterial = (id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
    // Clean up references in projects
    setProjects(prev => prev.map(p => ({
      ...p,
      materialIds: p.materialIds.filter(mid => mid !== id),
    })));
  };

  // --- Derived State ---
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      // 1. Always Completed at bottom
      const isCompletedA = a.progressPercentage === 100;
      const isCompletedB = b.progressPercentage === 100;
      
      if (isCompletedA && !isCompletedB) return 1;
      if (!isCompletedA && isCompletedB) return -1;

      // 2. Custom sorting
      if (sortOption === 'TIME') {
          return b.spentMinutes - a.spentMinutes;
      }
      
      if (sortOption === 'LOCATION') {
          const locA = getProjectLocation(a, materials) || 'zzzz'; // Push empty to bottom
          const locB = getProjectLocation(b, materials) || 'zzzz';
          return locA.localeCompare(locB);
      }

      if (sortOption === 'MACHINE') {
          const machA = getProjectMainMachine(a, materials) || 'zzzz';
          const machB = getProjectMainMachine(b, materials) || 'zzzz';
          return machA.localeCompare(machB);
      }
      
      // Default 'DATE'
      return new Date(b.lastActivityDate).getTime() - new Date(a.lastActivityDate).getTime();
    });
  }, [projects, sortOption, materials]);

  return (
    <div className="min-h-screen bg-background text-slate-900 dark:text-slate-100 font-sans flex flex-col transition-colors duration-300">
      
      {/* Top Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-4 py-4 flex justify-between items-center transition-colors">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Icons.Dashboard className="text-primary" size={24} /> 
          RealProject
        </h1>
        
        <div className="flex items-center gap-2">
            {activeTab === 'projects' && (
                <div className="relative">
                    <button 
                        onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                        className={`p-2 rounded-lg transition-colors ${isSortMenuOpen ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                        title="Trier"
                    >
                        <Icons.Sort size={20} />
                    </button>
                    {isSortMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsSortMenuOpen(false)}></div>
                            <div className="absolute right-0 top-12 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-2">
                                <button 
                                    onClick={() => { setSortOption('DATE'); setIsSortMenuOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${sortOption === 'DATE' ? 'text-primary bg-slate-100 dark:bg-slate-700/50' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                >
                                    Récents <Icons.Time size={14} />
                                </button>
                                <button 
                                    onClick={() => { setSortOption('TIME'); setIsSortMenuOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${sortOption === 'TIME' ? 'text-primary bg-slate-100 dark:bg-slate-700/50' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                >
                                    Temps Passé <Icons.Work size={14} />
                                </button>
                                <button 
                                    onClick={() => { setSortOption('MACHINE'); setIsSortMenuOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${sortOption === 'MACHINE' ? 'text-primary bg-slate-100 dark:bg-slate-700/50' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                >
                                    Machine <Icons.Garage size={14} />
                                </button>
                                <button 
                                    onClick={() => { setSortOption('LOCATION'); setIsSortMenuOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${sortOption === 'LOCATION' ? 'text-primary bg-slate-100 dark:bg-slate-700/50' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                >
                                    Localisation <Icons.Location size={14} />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
            {activeTab === 'projects' && (
              <button 
                onClick={() => setActiveModal('newProject')}
                className="bg-primary hover:bg-blue-600 text-white p-2 rounded-lg shadow-lg shadow-blue-900/20 ml-2"
              >
                <Icons.Add size={20} />
              </button>
            )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 pb-24 max-w-7xl mx-auto w-full">
        {activeTab === 'projects' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProjects.length === 0 ? (
              <div 
                onClick={() => setActiveModal('newProject')}
                className="col-span-full py-20 text-center border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl bg-slate-100/50 dark:bg-surface/50 cursor-pointer hover:border-primary dark:hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all group"
              >
                <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/10 group-hover:text-primary text-slate-400 transition-colors">
                    <Icons.Add size={32} />
                </div>
                <h3 className="text-xl text-slate-500 dark:text-slate-400 mb-2 group-hover:text-primary transition-colors">Aucun projet</h3>
                <p className="text-slate-600 dark:text-slate-600">Commencez par créer un projet.</p>
              </div>
            ) : (
              sortedProjects.map(project => (
                <ProjectCard 
                  key={project.id} 
                  project={project}
                  materials={materials} 
                  onLogSession={(id) => { setSelectedProjectId(id); setActiveModal('session'); }}
                  onClick={(id) => { setSelectedProjectId(id); setActiveModal('detail'); }}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'garage' && (
          <GarageView 
            materials={materials} 
            projects={projects}
            onAddMaterial={addMaterial} 
            onUpdateMaterial={updateMaterial}
            onDeleteMaterial={deleteMaterial}
            onToggleMaterial={toggleMaterialForProject}
          />
        )}

        {activeTab === 'stats' && (
          <StatsView projects={projects} materials={materials} sessions={sessions} />
        )}
        
        {activeTab === 'settings' && (
          <SettingsView isDarkMode={theme === 'dark'} toggleTheme={toggleTheme} />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe pt-2 z-40 transition-colors">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          <button 
            onClick={() => setActiveTab('projects')}
            className={`flex flex-col items-center p-3 rounded-xl transition-colors ${activeTab === 'projects' ? 'text-primary' : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Icons.Dashboard size={24} />
            <span className="text-xs font-medium mt-1">Projets</span>
          </button>
          
          <button 
             onClick={() => setActiveTab('garage')}
             className={`flex flex-col items-center p-3 rounded-xl transition-colors ${activeTab === 'garage' ? 'text-active' : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Icons.Garage size={24} />
            <span className="text-xs font-medium mt-1">Garage</span>
          </button>

          <button 
             onClick={() => setActiveTab('stats')}
             className={`flex flex-col items-center p-3 rounded-xl transition-colors ${activeTab === 'stats' ? 'text-purple-500 dark:text-purple-400' : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Icons.Stats size={24} />
            <span className="text-xs font-medium mt-1">Stats</span>
          </button>
          
           <button 
             onClick={() => setActiveTab('settings')}
             className={`flex flex-col items-center p-3 rounded-xl transition-colors ${activeTab === 'settings' ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Icons.Settings size={24} />
            <span className="text-xs font-medium mt-1">Paramètres</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <NewProjectModal 
        isOpen={activeModal === 'newProject'} 
        onClose={() => setActiveModal('none')} 
        onSave={addProject} 
      />
      
      <SessionModal 
        isOpen={activeModal === 'session' && !!selectedProjectId}
        onClose={() => { setActiveModal('none'); setSelectedProjectId(null); }}
        onSave={logSession}
        project={projects.find(p => p.id === selectedProjectId)}
        materials={materials}
      />

      <ProjectDetailModal 
        isOpen={activeModal === 'detail' && !!selectedProjectId}
        onClose={() => { setActiveModal('none'); setSelectedProjectId(null); }}
        project={projects.find(p => p.id === selectedProjectId)}
        allMaterials={materials}
        onToggleMaterial={toggleMaterialForProject}
        onDeleteProject={deleteProject}
      />

    </div>
  );
};

export default App;