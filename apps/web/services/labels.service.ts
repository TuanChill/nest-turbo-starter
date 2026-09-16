import { apiClient } from './api-client';

export interface LabelItem {
   id: string;
   name: string;
   color: string;
   workspaceId?: string;
   description?: string;
   createdAt?: string;
   scope?: 'issue' | 'project' | 'both';
   teamId?: string;
   groupId?: string;
}

export interface LabelGroup {
   id: string;
   workspaceId: string;
   name: string;
   scope: 'issue' | 'project' | 'both';
   mutuallyExclusive: boolean;
   createdAt: string;
}

export type LabelInterface = LabelItem;

export const labelsService = {
   async getLabelGroups(
      scope: 'issue' | 'project' = 'issue',
      workspaceId?: string
   ): Promise<LabelGroup[]> {
      return apiClient<LabelGroup[]>('/circle/api/labels/groups', {
         params: { scope, workspaceId },
      });
   },

   async createLabelGroup(payload: Partial<LabelGroup>): Promise<LabelGroup> {
      return apiClient<LabelGroup>('/circle/api/labels/groups', {
         method: 'POST',
         body: JSON.stringify(payload),
      });
   },

   async updateLabelGroup(id: string, payload: Partial<LabelGroup>): Promise<LabelGroup> {
      return apiClient<LabelGroup>(`/circle/api/labels/groups/${id}`, {
         method: 'PATCH',
         body: JSON.stringify(payload),
      });
   },

   async deleteLabelGroup(id: string): Promise<{ success: boolean }> {
      return apiClient<{ success: boolean }>(`/circle/api/labels/groups/${id}`, {
         method: 'DELETE',
      });
   },

   async getLabels(
      scope: 'issue' | 'project' = 'issue',
      workspaceId?: string,
      teamId?: string
   ): Promise<LabelItem[]> {
      return apiClient<LabelItem[]>('/circle/api/labels', {
         params: { scope, workspaceId, teamId },
      });
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
