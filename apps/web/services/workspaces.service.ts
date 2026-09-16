import { apiClient } from './api-client';

export interface Workspace {
   id: string;
   name: string;
   slug: string;
   icon?: string;
   description?: string;
   ownerId: string;
   inviteCode: string;
   memberCount?: number;
   role?: 'Owner' | 'Admin' | 'Member' | 'Guest';
   joinedAt?: string;
   createdAt?: string;
   updatedAt?: string;
}

export interface CreateWorkspacePayload {
   name: string;
   slug?: string;
   icon?: string;
   description?: string;
}

export interface JoinWorkspacePayload {
   inviteCode?: string;
   slug?: string;
   invitationToken?: string;
}

export const workspacesService = {
   async getWorkspaces(): Promise<Workspace[]> {
      return apiClient<Workspace[]>('/circle/api/workspaces');
   },

   async getWorkspace(idOrSlug: string): Promise<Workspace> {
      return apiClient<Workspace>(`/circle/api/workspaces/${idOrSlug}`);
   },

   async createWorkspace(payload: CreateWorkspacePayload): Promise<Workspace> {
      return apiClient<Workspace>('/circle/api/workspaces', {
         method: 'POST',
         body: JSON.stringify(payload),
      });
   },

   async joinWorkspace(payload: JoinWorkspacePayload): Promise<Workspace> {
      return apiClient<Workspace>('/circle/api/workspaces/join', {
         method: 'POST',
         body: JSON.stringify(payload),
      });
   },

   async regenerateInviteCode(workspaceId: string): Promise<{ inviteCode: string }> {
      return apiClient<{ inviteCode: string }>(
         `/circle/api/workspaces/${workspaceId}/invite-code`,
         {
            method: 'POST',
         }
      );
   },
};
