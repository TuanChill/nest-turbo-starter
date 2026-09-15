import { apiClient } from './client';
import type { View } from '@/services/views.service';

export type { View };
export type ViewItem = View;

export async function getViews(teamId?: string): Promise<View[]> {
   const query = teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';
   return apiClient<View[]>(`/circle/api/views${query}`);
}

export async function getViewById(id: string): Promise<View> {
   return apiClient<View>(`/circle/api/views/${id}`);
}

export async function createView(payload: Partial<View>): Promise<View> {
   return apiClient<View>('/circle/api/views', {
      method: 'POST',
      body: JSON.stringify(payload),
   });
}

export async function updateView(id: string, payload: Partial<View>): Promise<View> {
   return apiClient<View>(`/circle/api/views/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
   });
}

export async function deleteView(id: string): Promise<{ success: boolean }> {
   return apiClient<{ success: boolean }>(`/circle/api/views/${id}`, {
      method: 'DELETE',
   });
}
