import { apiClient } from './client';

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
}

export interface MemberInvitation {
   invitationId: string;
   email: string;
   name: string;
   role: string;
   teamIds: string[];
   expiresAt: string;
}

export async function getMembers(workspaceId?: string): Promise<Member[]> {
   return apiClient<Member[]>('/circle/api/members', {
      params: { workspaceId },
   });
}

export async function getMemberById(id: string, accessToken?: string): Promise<Member> {
   return apiClient<Member>(`/circle/api/members/${id}`, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
   });
}

export async function createMember(payload: Partial<Member>): Promise<MemberInvitation> {
   return apiClient<MemberInvitation>('/circle/api/members', {
      method: 'POST',
      body: JSON.stringify(payload),
   });
}

export async function updateMember(id: string, payload: Partial<Member>): Promise<Member> {
   return apiClient<Member>(`/circle/api/members/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
   });
}

export async function deleteMember(id: string): Promise<{ success: boolean }> {
   return apiClient<{ success: boolean }>(`/circle/api/members/${id}`, {
      method: 'DELETE',
   });
}

export async function getMemberTeams(memberId: string): Promise<string[]> {
   return apiClient<string[]>(`/circle/api/members/${memberId}/teams`);
}
