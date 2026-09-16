import { apiClient } from './api-client';

export interface Member {
   id: string;
   name: string;
   email: string;
   avatarUrl?: string;
   role: string;
   status: string;
   timezone: string;
   teamIds?: string[];
   bio?: string;
   joinedDate?: string;
   workspaceId?: string;
}

export interface MemberInvitation {
   invitationId: string;
   email: string;
   name: string;
   role: string;
   teamIds: string[];
   expiresAt: string;
   inviteUrl?: string;
}

export const membersService = {
   async getMembers(workspaceId?: string): Promise<Member[]> {
      return apiClient<Member[]>('/circle/api/members', {
         params: { workspaceId },
      });
   },

   async getMemberById(id: string): Promise<Member> {
      return apiClient<Member>(`/circle/api/members/${id}`);
   },

   async createMember(payload: Partial<Member>): Promise<MemberInvitation> {
      return apiClient<MemberInvitation>('/circle/api/members', {
         method: 'POST',
         body: JSON.stringify(payload),
      });
   },

   async updateMember(id: string, payload: Partial<Member>): Promise<Member> {
      return apiClient<Member>(`/circle/api/members/${id}`, {
         method: 'PATCH',
         body: JSON.stringify(payload),
      });
   },

   async deleteMember(id: string): Promise<{ success: boolean }> {
      return apiClient<{ success: boolean }>(`/circle/api/members/${id}`, {
         method: 'DELETE',
      });
   },

   async getMemberTeams(memberId: string): Promise<string[]> {
      return apiClient<string[]>(`/circle/api/members/${memberId}/teams`);
   },
};
