import { apiClient } from './api-client';
import type { Project } from '@/mock-data/projects';
import type { ProjectDetail } from '@/mock-data/project-details';
import type { Member } from './members.service';

export type { Project, ProjectDetail };

export interface ProjectUpdatePayload {
   authorId: string;
   health: string;
   blocks: Array<{ type: string; text: string }>;
}

export const projectsService = {
   async getProjects(teamId?: string, workspaceId?: string): Promise<Project[]> {
      return apiClient<Project[]>('/circle/api/projects', {
         params: { teamId, workspaceId },
      });
   },

   async getProjectById(id: string): Promise<Project> {
      return apiClient<Project>(`/circle/api/projects/${id}`);
   },

   async getSubscription(id: string): Promise<{ projectId: string; subscribed: boolean }> {
      return apiClient<{ projectId: string; subscribed: boolean }>(
         `/circle/api/projects/${id}/subscription`
      );
   },

   async subscribe(id: string): Promise<{ projectId: string; subscribed: boolean }> {
      return apiClient<{ projectId: string; subscribed: boolean }>(
         `/circle/api/projects/${id}/subscription`,
         { method: 'POST' }
      );
   },

   async unsubscribe(id: string): Promise<{ projectId: string; subscribed: boolean }> {
      return apiClient<{ projectId: string; subscribed: boolean }>(
         `/circle/api/projects/${id}/subscription`,
         { method: 'DELETE' }
      );
   },

   async getProjectMembers(id: string): Promise<Member[]> {
      return apiClient<Member[]>(`/circle/api/projects/${id}/members`);
   },

   async replaceProjectMembers(id: string, memberIds: string[]): Promise<Member[]> {
      return apiClient<Member[]>(`/circle/api/projects/${id}/members`, {
         method: 'PUT',
         body: JSON.stringify({ memberIds }),
      });
   },

   async createProject(payload: Partial<Project>): Promise<Project> {
      return apiClient<Project>('/circle/api/projects', {
         method: 'POST',
         body: JSON.stringify(payload),
      });
   },

   async updateProject(id: string, payload: Partial<Project>): Promise<Project> {
      return apiClient<Project>(`/circle/api/projects/${id}`, {
         method: 'PATCH',
         body: JSON.stringify(payload),
      });
   },

   async deleteProject(id: string): Promise<{ success: boolean }> {
      return apiClient<{ success: boolean }>(`/circle/api/projects/${id}`, {
         method: 'DELETE',
      });
   },

   async postProjectUpdate(
      projectId: string,
      payload: ProjectUpdatePayload
   ): Promise<{ success: boolean }> {
      return apiClient<{ success: boolean }>(`/circle/api/projects/${projectId}/updates`, {
         method: 'POST',
         body: JSON.stringify(payload),
      });
   },

   async getProjectDetail(id: string): Promise<ProjectDetail> {
      return apiClient<ProjectDetail>(`/circle/api/projects/${id}/detail`);
   },

   async getProjectOverview(id: string): Promise<Record<string, unknown>> {
      return apiClient<Record<string, unknown>>(`/circle/api/projects/${id}/overview`);
   },

   async getProjectActivity(id: string): Promise<Record<string, unknown>> {
      return apiClient<Record<string, unknown>>(`/circle/api/projects/${id}/activity`);
   },

   async addMilestone(
      projectId: string,
      payload: { name: string; targetDate?: string }
   ): Promise<ProjectDetail> {
      return apiClient<ProjectDetail>(`/circle/api/projects/${projectId}/milestones`, {
         method: 'POST',
         body: JSON.stringify(payload),
      });
   },

   async toggleMilestone(projectId: string, milestoneId: string): Promise<ProjectDetail> {
      return apiClient<ProjectDetail>(
         `/circle/api/projects/${projectId}/milestones/${milestoneId}/toggle`,
         { method: 'PATCH' }
      );
   },
};
