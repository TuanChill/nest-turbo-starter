import type { Initiative, InitiativeStatus } from '@/services/initiatives.service';
import type { Project } from '@/services/projects.service';

export const INITIATIVE_STATUS_META: Record<InitiativeStatus, { label: string; color: string }> = {
   active: { label: 'Active', color: '#f2c94c' },
   planned: { label: 'Planned', color: '#95a2b3' },
   completed: { label: 'Completed', color: '#5e6ad2' },
};

export const INITIATIVE_HEALTH_META = [
   { id: 'on-track', name: 'On track', color: '#4cb782' },
   { id: 'at-risk', name: 'At risk', color: '#f2c94c' },
   { id: 'off-track', name: 'Off track', color: '#eb5757' },
   { id: 'no-update', name: 'No update', color: '#8f9299' },
] as const;

export function getInitiativeProjects(initiative: Initiative, liveProjects: Project[]): Project[] {
   return initiative.projectIds
      .map((id) => liveProjects.find((project) => project.id === id))
      .filter((project): project is Project => Boolean(project));
}

export function countCompletedProjects(initiative: Initiative, liveProjects: Project[]): number {
   return getInitiativeProjects(initiative, liveProjects).filter(
      (project) => project.status.category === 'completed' || project.percentComplete >= 100
   ).length;
}
