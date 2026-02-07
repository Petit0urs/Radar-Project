export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  NEGLECTED = 'NEGLECTED',
  ABANDONED = 'ABANDONED',
  COMPLETED = 'COMPLETED',
}

export type MaterialType = 'MACHINE' | 'CONSUMABLE';

export interface Material {
  id: string;
  name: string;
  type: MaterialType;
  cost: number; // Machine: Prix d'achat | Consommable: Prix unitaire
  unit?: string; // Uniquement pour consommables (ex: 'g', 'm', 'L')
  location?: string; // Ex: 'Garage', 'Bureau', 'Atelier'
  linkedConsumableIds?: string[]; // Pour les machines : liste des ID de consommables compatibles
  purchasedDate: string;
}

export interface WorkSession {
  id: string;
  projectId: string;
  date: string; // ISO string
  durationMinutes: number;
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  estimatedHours: number;
  spentMinutes: number;
  progressPercentage: number; // 0-100, subjective
  lastActivityDate: string; // ISO string
  materialIds: string[];
  consumableUsage: Record<string, number>; // Map<MaterialID, QuantitéUtilisée>
  createdAt: string;
}

// Helper to define thresholds (in days)
export const THRESHOLDS = {
  NEGLECTED_DAYS: 14,
  ABANDONED_DAYS: 60,
};