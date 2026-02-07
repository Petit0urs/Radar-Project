import React, { useState, useEffect } from 'react';
import { Project, Material, ProjectStatus } from '../types';
import { Icons } from './Icons';
import { StatusBadge } from './StatusBadge';

interface ProjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | undefined;
  allMaterials: Material[];
  onToggleMaterial: (projectId: string, materialId: string) => void;
  onDeleteProject: (projectId: string) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ 
  isOpen, onClose, project, allMaterials, onToggleMaterial, onDeleteProject 
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
        setIsDeleting(false);
    }
  }, [isOpen]);

  if (!isOpen || !project) return null;

  const projectMaterials = allMaterials.filter(m => project.materialIds.includes(m.id));
  const availableMaterials = allMaterials.filter(m => !project.materialIds.includes(m.id));
  
  // Calculate Status
  const daysSince = Math.floor((new Date().getTime() - new Date(project.lastActivityDate).getTime()) / (1000 * 3600 * 24));
  let status = ProjectStatus.ACTIVE; 
  if (project.progressPercentage === 100) status = ProjectStatus.COMPLETED;
  else if (daysSince > 60) status = ProjectStatus.ABANDONED;
  else if (daysSince > 14) status = ProjectStatus.NEGLECTED;

  // Calculate Costs
  // 1. Fixed costs of machines/tools linked to the project
  const fixedCost = projectMaterials
    .filter(m => m.type !== 'CONSUMABLE')
    .reduce((acc, m) => acc + m.cost, 0);

  // 2. Variable costs from consumable usage
  let consumableCost = 0;
  if (project.consumableUsage) {
      Object.entries(project.consumableUsage).forEach(([id, qty]) => {
          const mat = allMaterials.find(m => m.id === id);
          if (mat) {
              consumableCost += (qty * mat.cost);
          }
      });
  }

  const totalCost = fixedCost + consumableCost;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 dark:bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-surface border border-slate-200 dark:border-slate-600 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white break-words">{project.name}</h2>
            <div className="mt-2 flex gap-2">
                <StatusBadge status={status} daysSinceActivity={daysSince} />
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <Icons.Close size={20} />
          </button>
        </div>

        {/* Description */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 mb-6">
            <h3 className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-1 uppercase tracking-wider">Description</h3>
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{project.description || "Aucune description."}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
             <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl">
                <div className="text-slate-500 dark:text-slate-400 text-xs mb-1">Temps Total</div>
                <div className="text-xl font-mono text-blue-500 dark:text-blue-400">{(project.spentMinutes / 60).toFixed(1)}h</div>
             </div>
             <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl">
                <div className="text-slate-500 dark:text-slate-400 text-xs mb-1">Coût Total</div>
                <div className="text-xl font-mono text-emerald-500 dark:text-emerald-400">{totalCost.toFixed(2)} €</div>
                <div className="text-[10px] text-slate-500 mt-1">
                    Fixe: {fixedCost}€ · Conso: {consumableCost.toFixed(2)}€
                </div>
             </div>
        </div>

        {/* Section Consommables Utilisés (Si existant) */}
        {project.consumableUsage && Object.keys(project.consumableUsage).length > 0 && (
            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Icons.Consumable size={20} className="text-emerald-500 dark:text-emerald-400" />
                    Consommation
                </h3>
                <div className="space-y-2">
                    {Object.entries(project.consumableUsage).map(([id, qty]) => {
                        const mat = allMaterials.find(m => m.id === id);
                        if (!mat) return null;
                        return (
                            <div key={id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800">
                                <span className="text-slate-700 dark:text-slate-300 text-sm">{mat.name}</span>
                                <span className="font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                                    {qty} {mat.unit} <span className="text-slate-500 dark:text-slate-600">({(qty * mat.cost).toFixed(2)}€)</span>
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>
        )}

        {/* Section Matériel */}
        <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Icons.Garage size={20} className="text-slate-400" />
                Machines & Outils ({projectMaterials.filter(m => m.type !== 'CONSUMABLE').length})
            </h3>
            
            <div className="space-y-2 mb-6">
                {projectMaterials.filter(m => m.type !== 'CONSUMABLE').length === 0 && (
                    <div className="text-slate-500 text-sm italic py-2">Aucune machine associée.</div>
                )}
                {projectMaterials.filter(m => m.type !== 'CONSUMABLE').map(mat => (
                    <div key={mat.id} className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div>
                            <span className="font-medium text-slate-800 dark:text-slate-200 block">{mat.name}</span>
                            {mat.linkedConsumableIds && mat.linkedConsumableIds.length > 0 && (
                                <span className="text-[10px] text-slate-500">Utilise des consommables</span>
                            )}
                        </div>
                        <button 
                            onClick={() => onToggleMaterial(project.id, mat.id)}
                            className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 p-1.5 rounded"
                            title="Retirer du projet"
                        >
                            <Icons.Trash size={16} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Ajouter du matériel existant */}
            {availableMaterials.filter(m => m.type !== 'CONSUMABLE').length > 0 && (
                <div>
                    <h4 className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-2 uppercase tracking-wider">Lier une machine</h4>
                    <div className="flex flex-wrap gap-2">
                        {availableMaterials.filter(m => m.type !== 'CONSUMABLE').map(mat => (
                            <button
                                key={mat.id}
                                onClick={() => onToggleMaterial(project.id, mat.id)}
                                className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-full text-xs transition-colors text-slate-700 dark:text-slate-300"
                            >
                                <Icons.Add size={12} />
                                {mat.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Ajouter consommable direct (Optionnel, si on veut lier un consommable sans machine) */}
             <div className="mt-4">
                <h4 className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-2 uppercase tracking-wider">Lier un consommable direct</h4>
                 <div className="flex flex-wrap gap-2">
                    {availableMaterials.filter(m => m.type === 'CONSUMABLE').map(mat => (
                        <button
                            key={mat.id}
                            onClick={() => onToggleMaterial(project.id, mat.id)}
                            className="flex items-center gap-1 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-emerald-200 dark:border-emerald-900/30 px-3 py-1.5 rounded-full text-xs transition-colors"
                        >
                            <Icons.Add size={12} />
                            {mat.name}
                        </button>
                    ))}
                </div>
            </div>

        </div>

        {/* Danger Zone */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
             {!isDeleting ? (
                 <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsDeleting(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-red-600 dark:hover:text-red-400 py-3 border border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors cursor-pointer"
                >
                    <Icons.Trash size={16} /> Supprimer le projet
                </button>
             ) : (
                <div className="flex flex-col gap-2">
                     <div className="text-center text-sm text-red-500 font-bold mb-2">Attention, cette action est irréversible.</div>
                     <div className="flex gap-3">
                         <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsDeleting(false);
                            }}
                            className="flex-1 py-3 text-slate-600 dark:text-slate-300 font-medium bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                            Annuler
                        </button>
                         <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteProject(project.id);
                                onClose();
                            }}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-500/30"
                        >
                            <Icons.Trash size={16} /> Confirmer
                        </button>
                     </div>
                </div>
             )}
        </div>

      </div>
    </div>
  );
};