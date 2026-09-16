import { apiClient } from './api-client';

export type CycleStatus = 'planned' | 'upcoming' | 'current' | 'completed';
export interface CycleBurnupPoint {
   date: string;
   scope: number;
   started: number;
   completed: number;
   ideal: number;
}

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
   burnup?: CycleBurnupPoint[];
}

export interface CycleSettings {
   teamId: string;
   enabled: boolean;
   durationWeeks: number;
   startDayOfWeek: number;
   timeZone: string;
   cooldownDays: number;
   upcomingCycleCount: number;
   autoAddActiveIssues: boolean;
}

export const cyclesService = {
   async getCycles(teamId?: string): Promise<Cycle[]> {
      const query = teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';
      return apiClient<Cycle[]>(`/circle/api/cycles${query}`);
   },

   async getCycleById(id: string): Promise<Cycle> {
      return apiClient<Cycle>(`/circle/api/cycles/${id}`);
   },

   async getCycleHistory(id: string): Promise<CycleBurnupPoint[]> {
      return apiClient<CycleBurnupPoint[]>(`/circle/api/cycles/${id}/history`);
   },

   async getCycleSettings(teamId: string): Promise<CycleSettings> {
      return apiClient<CycleSettings>(
         `/circle/api/cycles/settings?teamId=${encodeURIComponent(teamId)}`
      );
   },

   async updateCycleSettings(
      teamId: string,
      payload: Partial<Omit<CycleSettings, 'teamId'>>
   ): Promise<CycleSettings> {
      return apiClient<CycleSettings>(
         `/circle/api/cycles/settings?teamId=${encodeURIComponent(teamId)}`,
         {
            method: 'PATCH',
            body: JSON.stringify(payload),
         }
      );
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

   async startCycleToday(id: string): Promise<Cycle> {
      return apiClient<Cycle>(`/circle/api/cycles/${id}/start-today`, {
         method: 'POST',
      });
   },

   async deleteCycle(id: string): Promise<{ success: boolean }> {
      return apiClient<{ success: boolean }>(`/circle/api/cycles/${id}`, {
         method: 'DELETE',
      });
   },
};
