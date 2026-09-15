import { apiClient } from './api-client';

export type InitiativeStatus = 'active' | 'planned' | 'completed';

export interface Initiative {
   id: string;
   workspaceId: string;
   name: string;
   description?: string;
   icon: string;
   status: InitiativeStatus;
   priority: { id: string; name: string };
   owner?: { id: string; name: string; avatarUrl?: string };
   target?: string;
   health: { id: string; name: string; color: string; description?: string };
   projectIds: string[];
   labels: Array<{ id: string; name: string; color: string }>;
   resources: Array<{ label: string; url: string }>;
   projectCount: number;
   completedProjectCount: number;
   progressPercent: number;
   activity?: Array<{
      id: string;
      event: string;
      actor?: { id: string; name: string; avatarUrl?: string };
      metadata?: Record<string, unknown>;
      createdAt: string;
   }>;
   updates: Array<{
      id: string;
      author?: { id: string; name: string; avatarUrl?: string } | null;
      health: 'no-update' | 'on-track' | 'at-risk' | 'off-track';
      blocks: unknown[];
      createdAt: string;
   }>;
   createdAt: string;
}

export interface InitiativeMutationPayload {
   workspaceId?: string;
   name?: string;
   description?: string | null;
   icon?: string | null;
   status?: InitiativeStatus;
   priorityId?: string;
   ownerId?: string | null;
   target?: string | null;
   healthId?: string;
   projectIds?: string[];
   labelIds?: string[];
   resources?: Array<{ label: string; url: string }>;
}

export interface InitiativeUpdatePayload {
   health: 'no-update' | 'on-track' | 'at-risk' | 'off-track';
   blocks?: unknown[];
}

export const initiativesService = {
   async getInitiatives(): Promise<Initiative[]> {
      return apiClient<Initiative[]>('/circle/api/initiatives');
   },

   async getInitiativeById(id: string): Promise<Initiative> {
      return apiClient<Initiative>(`/circle/api/initiatives/${id}`);
   },

   async createInitiative(payload: InitiativeMutationPayload): Promise<Initiative> {
      return apiClient<Initiative>('/circle/api/initiatives', {
         method: 'POST',
         body: JSON.stringify(payload),
      });
   },

   async updateInitiative(id: string, payload: InitiativeMutationPayload): Promise<Initiative> {
      return apiClient<Initiative>(`/circle/api/initiatives/${id}`, {
         method: 'PATCH',
         body: JSON.stringify(payload),
      });
   },

   async deleteInitiative(id: string): Promise<{ success: boolean }> {
      return apiClient<{ success: boolean }>(`/circle/api/initiatives/${id}`, {
         method: 'DELETE',
      });
   },

   async postInitiativeUpdate(id: string, payload: InitiativeUpdatePayload): Promise<Initiative> {
      return apiClient<Initiative>(`/circle/api/initiatives/${id}/updates`, {
         method: 'POST',
         body: JSON.stringify(payload),
      });
   },
};
