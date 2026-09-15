import { apiClient } from './api-client';

export interface LabelItem {
   id: string;
   name: string;
   color: string;
   scope?: 'issue' | 'project' | 'both';
}

export type LabelInterface = LabelItem;

export const labelsService = {
   async getLabels(scope: 'issue' | 'project' = 'issue'): Promise<LabelItem[]> {
      return apiClient<LabelItem[]>('/circle/api/labels', { params: { scope } });
   },

   async createLabel(payload: Partial<LabelItem>): Promise<LabelItem> {
      return apiClient<LabelItem>('/circle/api/labels', {
         method: 'POST',
         body: JSON.stringify(payload),
      });
   },

   async updateLabel(id: string, payload: Partial<LabelItem>): Promise<LabelItem> {
      return apiClient<LabelItem>(`/circle/api/labels/${id}`, {
         method: 'PATCH',
         body: JSON.stringify(payload),
      });
   },

   async deleteLabel(id: string): Promise<{ success: boolean }> {
      return apiClient<{ success: boolean }>(`/circle/api/labels/${id}`, {
         method: 'DELETE',
      });
   },
};
