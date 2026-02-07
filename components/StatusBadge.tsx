import React from 'react';
import { ProjectStatus } from '../types';
import { Icons } from './Icons';

interface StatusBadgeProps {
  status: ProjectStatus;
  daysSinceActivity: number;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, daysSinceActivity }) => {
  let colorClass = '';
  let icon = null;
  let label = '';

  switch (status) {
    case ProjectStatus.ACTIVE:
      colorClass = 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      icon = <Icons.Work size={14} className="mr-1" />;
      label = 'EN COURS';
      break;
    case ProjectStatus.NEGLECTED:
      colorClass = 'bg-neglected/20 text-neglected border-neglected/50';
      icon = <Icons.Warning size={14} className="mr-1" />;
      label = 'DÉLAISSÉ';
      break;
    case ProjectStatus.ABANDONED:
      colorClass = 'bg-abandoned/20 text-abandoned border-abandoned/50';
      icon = <Icons.Dead size={14} className="mr-1" />;
      label = 'ABANDONNÉ';
      break;
    case ProjectStatus.COMPLETED:
      colorClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
      icon = <Icons.Check size={14} className="mr-1" />;
      label = 'TERMINÉ';
      break;
  }

  return (
    <div className={`flex items-center px-2 py-1 rounded-full border text-xs font-bold tracking-wider ${colorClass}`}>
      {icon}
      <span>{label} {status !== ProjectStatus.COMPLETED && `(${daysSinceActivity}j)`}</span>
    </div>
  );
};