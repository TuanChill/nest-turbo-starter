import { apiClient } from './client';

export interface LabelItem {
   id: string;
   name: string;
   color: string;
}

export type LabelInterface = LabelItem;

export async function fetchLabels(): Promise<LabelItem[]> {
   return apiClient<LabelItem[]>('/circle/api/labels');
}

export const getLabels = fetchLabels;

export async function createLabel(payload: Partial<LabelItem>): Promise<LabelItem> {
   return apiClient<LabelItem>('/circle/api/labels', {
      method: 'POST',
      body: JSON.stringify(payload),
   });
}

export async function updateLabel(id: string, payload: Partial<LabelItem>): Promise<LabelItem> {
   return apiClient<LabelItem>(`/circle/api/labels/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
   });
}

export async function deleteLabel(id: string): Promise<{ success: boolean }> {
   return apiClient<{ success: boolean }>(`/circle/api/labels/${id}`, {
      method: 'DELETE',
   });
}
