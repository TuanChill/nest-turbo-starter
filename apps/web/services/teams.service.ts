import { apiClient } from './api-client';
import { Team } from '@/mock-data/teams';

export type { Team };

export const teamsService = {
   async getTeams(): Promise<Team[]> {
      return apiClient<Team[]>('/circle/api/teams');
   },

   async getTeamById(id: string): Promise<Team> {
      return apiClient<Team>(`/circle/api/teams/${id}`);
   },

   async createTeam(data: Partial<Team>): Promise<Team> {
      return apiClient<Team>('/circle/api/teams', {
         method: 'POST',
         body: JSON.stringify(data),
      });
   },

   async updateTeam(id: string, data: Partial<Team>): Promise<Team> {
      return apiClient<Team>(`/circle/api/teams/${id}`, {
         method: 'PATCH',
         body: JSON.stringify(data),
      });
   },

   async toggleJoinTeam(id: string): Promise<Team> {
      return apiClient<Team>(`/circle/api/teams/${id}/join`, {
         method: 'POST',
      });
   },

   async addTeamMember(teamId: string, memberId: string, role?: string): Promise<Team> {
      return apiClient<Team>(`/circle/api/teams/${teamId}/members`, {
         method: 'POST',
         body: JSON.stringify({ memberId, role }),
      });
   },

   async removeTeamMember(teamId: string, memberId: string): Promise<Team> {
      return apiClient<Team>(`/circle/api/teams/${teamId}/members/${memberId}`, {
         method: 'DELETE',
      });
   },

   async deleteTeam(id: string): Promise<{ success: boolean; id: string }> {
      return apiClient<{ success: boolean; id: string }>(`/circle/api/teams/${id}`, {
         method: 'DELETE',
      });
   },
};
