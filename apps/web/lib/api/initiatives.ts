import { apiClient } from './client';
import type { Initiative } from '@/mock-data/initiatives';

export type { Initiative };

export async function getInitiatives(): Promise<Initiative[]> {
   return apiClient<Initiative[]>('/circle/api/initiatives');
}

export async function getInitiativeById(id: string): Promise<Initiative> {
   return apiClient<Initiative>(`/circle/api/initiatives/${id}`);
}

export async function createInitiative(payload: Partial<Initiative>): Promise<Initiative> {
   return apiClient<Initiative>('/circle/api/initiatives', {
      method: 'POST',
      body: JSON.stringify(payload),
   });
}

export async function updateInitiative(
   id: string,
   payload: Partial<Initiative>
): Promise<Initiative> {
   return apiClient<Initiative>(`/circle/api/initiatives/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
   });
}
