import React, { useState } from 'react';
import { Material, Project, MaterialType } from '../types';
import { Icons } from './Icons';

interface GarageViewProps {
  materials: Material[];
  projects: Project[];
  onAddMaterial: (m: Partial<Material>) => void;
  onUpdateMaterial: (m: Material) => void;
  onDeleteMaterial: (id: string) => void;
  onToggleMaterial: (projectId: string, materialId: string) => void;
}

export const GarageView: React.FC<GarageViewProps> = ({ 
  materials, 
  projects, 
  onAddMaterial, 
  onUpdateMaterial,
  onDeleteMaterial,
  onToggleMaterial 
}) => {
  const [activeTab, setActiveTab] = useState<MaterialType>('MACHINE');
  
  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [selectedLinkMaterial, setSelectedLinkMaterial] = useState<Material | null>(null); // For linking projects

  // Form State
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [unit, setUnit] = useState('');
  const [location, setLocation] = useState('');
  const [linkedConsumables, setLinkedConsumables] = useState<string[]>([]);

  const filteredMaterials = materials.filter(m => (m.type || 'MACHINE') === activeTab);
  const allConsumables = materials.filter(m => m.type === 'CONSUMABLE');

  // Open Create Modal
  const openCreateModal = () => {
      setEditingMaterial(null);
      setName('');
      setCost('');
      setUnit('');
      setLocation('');
      setLinkedConsumables([]);
      setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (m: Material) => {
      setEditingMaterial(m);
      setName(m.name);
      setCost(m.cost.toString());
      setUnit(m.unit || '');
      setLocation(m.location || '');
      setLinkedConsumables(m.linkedConsumableIds || []);
      if (m.type !== activeTab) setActiveTab(m.type);
      setIsFormModalOpen(true);
  };

  const handleSave = () => {
    if (!name) return;

    const materialData = {
        name,
        type: editingMaterial ? editingMaterial.type : activeTab,
        cost: parseFloat(cost) || 0,
        unit: (editingMaterial ? editingMaterial.type : activeTab) === 'CONSUMABLE' ? unit : undefined,
        location: location || undefined,
        linkedConsumableIds: (editingMaterial ? editingMaterial.type : activeTab) === 'MACHINE' ? linkedConsumables : undefined,
    };

    if (editingMaterial) {
        onUpdateMaterial({
            ...editingMaterial,
            ...materialData
        });
    } else {
        onAddMaterial({
            ...materialData,
            purchasedDate: new Date().toISOString()
        });
    }
    setIsFormModalOpen(false);
  };

  const toggleConsumableSelection = (id: string) => {
    setLinkedConsumables(prev => 
        prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Icons.Garage className="text-active" /> Garage
        </h2>
        <button 
          onClick={openCreateModal}
          className="bg-active hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/20"
        >
          <Icons.Add size={18} /> Ajouter
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl mb-6 w-full max-w-sm">
        <button 
            onClick={() => setActiveTab('MACHINE')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'MACHINE' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
            <Icons.Garage size={16} /> Machines
        </button>
        <button 
            onClick={() => setActiveTab('CONSUMABLE')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'CONSUMABLE' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
            <Icons.Consumable size={16} /> Consommables
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMaterials.length === 0 ? (
            <div className="col-span-full py-12 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-100/50 dark:bg-slate-800/30">
                <p className="text-slate-500 dark:text-slate-400">Aucun élément dans cette catégorie.</p>
            </div>
        ) : (
            filteredMaterials.map(mat => {
                const usageCount = projects.filter(p => p.materialIds.includes(mat.id)).length;
                return (
                    <div 
                        key={mat.id} 
                        onClick={() => setSelectedLinkMaterial(mat)}
                        className="bg-surface p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-2 group cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 relative"
                    >
                        <div className="flex justify-between items-start">
                             <div className="flex-1">
                                <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    {mat.name}
                                    {usageCount > 0 && (
                                        <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full flex items-center gap-1 border border-slate-300 dark:border-slate-600">
                                            <Icons.Link size={10} /> {usageCount}
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-3 mt-1">
                                    <span className="flex items-center gap-1">
                                        <Icons.Currency size={12} /> 
                                        {mat.type === 'CONSUMABLE' 
                                            ? `${mat.cost} € / ${mat.unit}` 
                                            : `${mat.cost} € (Fixe)`}
                                    </span>
                                    {mat.location && (
                                        <span className="flex items-center gap-1 text-slate-500 dark:text-slate-300">
                                            <Icons.Location size={12} /> {mat.location}
                                        </span>
                                    )}
                                </div>
                             </div>
                             
                             <div className="flex gap-1">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); openEditModal(mat); }}
                                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                                    title="Modifier"
                                >
                                    <Icons.Edit size={18} />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); if(confirm('Supprimer cet outil ?')) onDeleteMaterial(mat.id); }}
                                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 rounded transition-colors"
                                    title="Supprimer"
                                >
                                    <Icons.Trash size={18} />
                                </button>
                             </div>
                        </div>

                        {/* Display Linked Consumables for Machines */}
                        {mat.type === 'MACHINE' && mat.linkedConsumableIds && mat.linkedConsumableIds.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/50">
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold mb-1">Utilise :</div>
                                <div className="flex flex-wrap gap-1">
                                    {mat.linkedConsumableIds.map(cid => {
                                        const c = materials.find(m => m.id === cid);
                                        return c ? (
                                            <span key={c.id} className="text-xs bg-slate-100 dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/30 flex items-center gap-1">
                                                <Icons.Consumable size={10} /> {c.name}
                                            </span>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })
        )}
      </div>

      {/* Link Projects Modal */}
      {selectedLinkMaterial && (
        <div 
            className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setSelectedLinkMaterial(null)}
        >
            <div 
                className="bg-white dark:bg-surface border border-slate-200 dark:border-slate-600 w-full max-w-md rounded-2xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate pr-2 flex items-center gap-2">
                        <Icons.Link size={20} className="text-active" />
                        Lier : {selectedLinkMaterial.name}
                    </h3>
                    <button onClick={() => setSelectedLinkMaterial(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><Icons.Close /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                        Sélectionnez les projets utilisant {selectedLinkMaterial.type === 'MACHINE' ? 'cette machine' : 'ce consommable'}.
                    </p>
                    <div className="space-y-2">
                        {projects.length === 0 && <p className="text-slate-400 italic text-center py-4">Aucun projet créé.</p>}
                        
                        {projects.map(p => {
                            const isLinked = p.materialIds.includes(selectedLinkMaterial.id);
                            return (
                                <button 
                                    key={p.id}
                                    onClick={() => onToggleMaterial(p.id, selectedLinkMaterial.id)}
                                    className={`w-full flex justify-between items-center p-3 rounded-lg border transition-all text-left ${
                                        isLinked 
                                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-500/50 text-blue-700 dark:text-blue-200' 
                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                                >
                                    <span className="truncate font-medium pr-2">{p.name}</span>
                                    {isLinked ? (
                                        <Icons.Check size={18} className="text-blue-500 dark:text-blue-400 flex-shrink-0" />
                                    ) : (
                                        <div className="w-[18px] h-[18px] rounded-full border border-slate-400 dark:border-slate-600 flex-shrink-0"></div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>
                
                <button onClick={() => setSelectedLinkMaterial(null)} className="mt-6 w-full py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl font-bold">Fermer</button>
            </div>
        </div>
      )}

      {/* Add/Edit Material Modal */}
      {isFormModalOpen && (
        <div 
            className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setIsFormModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-surface border border-slate-200 dark:border-slate-600 w-full max-w-sm rounded-2xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                {editingMaterial ? 'Modifier' : 'Ajouter'} { (editingMaterial ? editingMaterial.type : activeTab) === 'MACHINE' ? 'une Machine' : 'un Consommable'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-500 dark:text-slate-400 block mb-1">Nom</label>
                <input 
                  autoFocus
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-3"
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder={(editingMaterial ? editingMaterial.type : activeTab) === 'MACHINE' ? "Ex: Imprimante 3D" : "Ex: Filament PLA"}
                />
              </div>

              <div>
                <label className="text-sm text-slate-500 dark:text-slate-400 block mb-1">Emplacement</label>
                <div className="relative">
                    <Icons.Location className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={16} />
                    <input 
                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-3 pl-9"
                        value={location} onChange={e => setLocation(e.target.value)}
                        placeholder="Ex: Garage, Bureau, Atelier..."
                    />
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                    <label className="text-sm text-slate-500 dark:text-slate-400 block mb-1">
                        {(editingMaterial ? editingMaterial.type : activeTab) === 'MACHINE' ? 'Coût Achat (€)' : 'Coût Unitaire (€)'}
                    </label>
                    <input 
                        type="number"
                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-3"
                        value={cost} onChange={e => setCost(e.target.value)}
                        placeholder="0"
                    />
                </div>
                {(editingMaterial ? editingMaterial.type : activeTab) === 'CONSUMABLE' && (
                    <div className="flex-1">
                        <label className="text-sm text-slate-500 dark:text-slate-400 block mb-1">Unité</label>
                        <input 
                            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-3"
                            value={unit} onChange={e => setUnit(e.target.value)}
                            placeholder="kg, m, L..."
                        />
                    </div>
                )}
              </div>

              {(editingMaterial ? editingMaterial.type : activeTab) === 'MACHINE' && allConsumables.length > 0 && (
                  <div>
                      <label className="text-sm text-slate-500 dark:text-slate-400 block mb-2">Consommables compatibles</label>
                      <div className="max-h-32 overflow-y-auto border border-slate-300 dark:border-slate-700 rounded-lg p-2 bg-slate-100 dark:bg-slate-900 space-y-1">
                          {allConsumables.map(c => (
                              <button
                                key={c.id}
                                onClick={() => toggleConsumableSelection(c.id)}
                                className={`w-full flex items-center justify-between p-2 rounded text-xs ${linkedConsumables.includes(c.id) ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                              >
                                  <span>{c.name}</span>
                                  {linkedConsumables.includes(c.id) && <Icons.Check size={14} />}
                              </button>
                          ))}
                      </div>
                  </div>
              )}

              <div className="pt-4 flex gap-3">
                <button onClick={() => setIsFormModalOpen(false)} className="flex-1 py-3 text-slate-500 dark:text-slate-400 font-medium">Annuler</button>
                <button onClick={handleSave} disabled={!name} className="flex-1 bg-active text-white font-bold py-3 rounded-xl disabled:opacity-50">
                    {editingMaterial ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};