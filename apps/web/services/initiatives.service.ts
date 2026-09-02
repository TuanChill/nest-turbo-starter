import { apiClient } from './api-client';
import { Initiative } from '@/mock-data/initiatives';

export type { Initiative };

export const initiativesService = {
   async getInitiatives(): Promise<Initiative[]> {
      return apiClient<Initiative[]>('/circle/api/initiatives');
   },

   async getInitiativeById(id: string): Promise<Initiative> {
      return apiClient<Initiative>(`/circle/api/initiatives/${id}`);
   },

   async createInitiative(payload: Partial<Initiative>): Promise<Initiative> {
      return apiClient<Initiative>('/circle/api/initiatives', {
         method: 'POST',
         body: JSON.stringify(payload),
      });
   },

   async updateInitiative(id: string, payload: Partial<Initiative>): Promise<Initiative> {
      return apiClient<Initiative>(`/circle/api/initiatives/${id}`, {
         method: 'PATCH',
         body: JSON.stringify(payload),
      });
   },
};
