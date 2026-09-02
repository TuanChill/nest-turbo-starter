import { apiClient } from './api-client';
import type { TeamDocument, DocumentFolder } from '@/mock-data/documents';

export type { TeamDocument, DocumentFolder };

export const documentsService = {
   async getDocuments(teamId?: string): Promise<DocumentFolder[]> {
      const query = teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';
      return apiClient<DocumentFolder[]>(`/circle/api/documents/folders${query}`);
   },

   async getDocumentById(id: string): Promise<TeamDocument> {
      return apiClient<TeamDocument>(`/circle/api/documents/${id}`);
   },

   async createDocument(
      payload: Partial<TeamDocument> & { folderId?: string; content?: string }
   ): Promise<TeamDocument> {
      return apiClient<TeamDocument>('/circle/api/documents', {
         method: 'POST',
         body: JSON.stringify(payload),
      });
   },

   async createFolder(payload: {
      name: string;
      icon?: string;
      teamId?: string;
   }): Promise<DocumentFolder> {
      return apiClient<DocumentFolder>('/circle/api/documents/folders', {
         method: 'POST',
         body: JSON.stringify(payload),
      });
   },

   async updateDocument(id: string, payload: Partial<TeamDocument>): Promise<TeamDocument> {
      return apiClient<TeamDocument>(`/circle/api/documents/${id}`, {
         method: 'PATCH',
         body: JSON.stringify(payload),
      });
   },

   async deleteDocument(id: string): Promise<{ success: boolean }> {
      return apiClient<{ success: boolean }>(`/circle/api/documents/${id}`, {
         method: 'DELETE',
      });
   },
};
