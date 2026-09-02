import { apiClient } from './client';
import { Team } from '@/mock-data/teams';

export type { Team };

export async function fetchTeams(): Promise<Team[]> {
   return apiClient<Team[]>('/circle/api/teams');
}

export async function fetchTeamById(id: string): Promise<Team> {
   return apiClient<Team>(`/circle/api/teams/${id}`);
}

export async function createTeam(data: Partial<Team>): Promise<Team> {
   return apiClient<Team>('/circle/api/teams', {
      method: 'POST',
      body: JSON.stringify(data),
   });
}

export async function updateTeam(id: string, data: Partial<Team>): Promise<Team> {
   return apiClient<Team>(`/circle/api/teams/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
   });
}

export async function toggleJoinTeam(id: string): Promise<Team> {
   return apiClient<Team>(`/circle/api/teams/${id}/join`, {
      method: 'POST',
   });
}

export async function addTeamMember(
   teamId: string,
   memberId: string,
   role?: string
): Promise<Team> {
   return apiClient<Team>(`/circle/api/teams/${teamId}/members`, {
      method: 'POST',
      body: JSON.stringify({ memberId, role }),
   });
}

export async function removeTeamMember(teamId: string, memberId: string): Promise<Team> {
   return apiClient<Team>(`/circle/api/teams/${teamId}/members/${memberId}`, {
      method: 'DELETE',
   });
}

export async function deleteTeam(id: string): Promise<{ success: boolean; id: string }> {
   return apiClient<{ success: boolean; id: string }>(`/circle/api/teams/${id}`, {
      method: 'DELETE',
   });
}
