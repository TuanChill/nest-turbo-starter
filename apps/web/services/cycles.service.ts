import { apiClient } from './api-client';

export type CycleStatus = 'planned' | 'upcoming' | 'current' | 'completed';
export interface Cycle {
   id: string;
   number: number;
   name: string;
   teamId: string;
   status: CycleStatus;
   startDate: string;
   endDate: string;
   capacity: number;
   scope: number;
   scopeDelta: number;
   started: number;
   completed: number;
   successRate?: number;
   burnup?: Array<{
      date: string;
      scope: number;
      started: number;
      completed: number;
      ideal: number;
   }>;
}

export const cyclesService = {
   async getCycles(teamId?: string): Promise<Cycle[]> {
      const query = teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';
      return apiClient<Cycle[]>(`/circle/api/cycles${query}`);
   },

   async getCycleById(id: string): Promise<Cycle> {
      return apiClient<Cycle>(`/circle/api/cycles/${id}`);
   },

   async createCycle(payload: Partial<Cycle>): Promise<Cycle> {
      return apiClient<Cycle>('/circle/api/cycles', {
         method: 'POST',
         body: JSON.stringify(payload),
      });
   },

   async updateCycle(id: string, payload: Partial<Cycle>): Promise<Cycle> {
      return apiClient<Cycle>(`/circle/api/cycles/${id}`, {
         method: 'PATCH',
         body: JSON.stringify(payload),
      });
   },

   async deleteCycle(id: string): Promise<{ success: boolean }> {
      return apiClient<{ success: boolean }>(`/circle/api/cycles/${id}`, {
         method: 'DELETE',
      });
   },
};
