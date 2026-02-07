import React from 'react';
import { Icons } from './Icons';

interface SettingsViewProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ isDarkMode, toggleTheme }) => {
  return (
    <div className="max-w-2xl mx-auto pb-24">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
        <Icons.Settings className="text-slate-500 dark:text-slate-400" /> Paramètres
      </h2>

      {/* Profile Section */}
      <div className="bg-surface p-6 rounded-2xl border border-slate-200 dark:border-slate-700 mb-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400">
            <Icons.User size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Compte Utilisateur</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Non connecté (Données locales uniquement)</p>
          </div>
        </div>
        <button className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm w-full sm:w-auto transition-colors">
          Se connecter / S'inscrire
        </button>
      </div>

      {/* Preferences Section */}
      <div className="bg-surface rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        
        {/* Theme Toggle */}
        <div 
          onClick={toggleTheme}
          className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            {isDarkMode ? <Icons.Moon className="text-slate-500 dark:text-slate-400" size={20} /> : <Icons.Sun className="text-amber-500" size={20} />}
            <div>
              <div className="text-slate-900 dark:text-white font-medium">Apparence</div>
              <div className="text-slate-500 text-xs">{isDarkMode ? 'Mode Sombre' : 'Mode Clair'}</div>
            </div>
          </div>
          <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-primary' : 'bg-slate-300'}`}>
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
          </div>
        </div>

        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
          <div className="flex items-center gap-3">
            <Icons.Language className="text-slate-500 dark:text-slate-400" size={20} />
            <div>
              <div className="text-slate-900 dark:text-white font-medium">Langue</div>
              <div className="text-slate-500 text-xs">Français</div>
            </div>
          </div>
          <span className="text-slate-400 dark:text-slate-500 text-sm">Modifier</span>
        </div>

        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
          <div className="flex items-center gap-3">
            <Icons.Garage className="text-slate-500 dark:text-slate-400" size={20} />
            <div>
              <div className="text-slate-900 dark:text-white font-medium">Devise par défaut</div>
              <div className="text-slate-500 text-xs">Euro (€)</div>
            </div>
          </div>
          <span className="text-slate-400 dark:text-slate-500 text-sm">Modifier</span>
        </div>

        <div className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
          <div className="flex items-center gap-3">
            <Icons.Database className="text-slate-500 dark:text-slate-400" size={20} />
            <div>
              <div className="text-slate-900 dark:text-white font-medium">Données</div>
              <div className="text-slate-500 text-xs">Exporter ou réinitialiser</div>
            </div>
          </div>
          <span className="text-slate-400 dark:text-slate-500 text-sm">Gérer</span>
        </div>
      </div>
      
      <div className="mt-8 text-center text-slate-500 dark:text-slate-600 text-xs">
        RealProject v1.3.0 - Local Storage Mode
      </div>
    </div>
  );
};