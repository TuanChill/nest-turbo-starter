import { apiClient } from './api-client';

export type ProjectTemplateScope = 'workspace' | 'team';
export interface ProjectTemplateConfig {
   project?: {
      summary?: string;
      description?: unknown[];
      icon?: string;
      statusId?: string;
      statusCategory?: string;
      priorityId?: string;
      healthId?: string;
      percentComplete?: number;
      leadId?: string;
      initiativeId?: string;
      labelIds?: string[];
      memberIds?: string[];
      startDate?: string;
      targetDate?: string;
   };
   milestones?: Array<{ key: string; name: string; targetDate?: string; orderIndex?: number }>;
   issues?: Array<{
      key: string;
      title: string;
      description?: string;
      statusId?: string;
      statusCategory?: string;
      priorityId?: string;
      assigneeId?: string;
      labelIds?: string[];
      milestoneKey?: string;
      parentKey?: string;
      dueDate?: string;
      rank?: string;
   }>;
}
export interface ProjectTemplate {
   id: string;
   workspaceId: string;
   name: string;
   description?: string;
   scope: ProjectTemplateScope;
   teamId?: string;
   createdBy: string;
   isDefault: boolean;
   config: ProjectTemplateConfig;
   createdAt: string;
   updatedAt: string;
}
export interface CreateProjectTemplatePayload {
   workspaceId: string;
   name: string;
   description?: string;
   scope: ProjectTemplateScope;
   teamId?: string;
   isDefault?: boolean;
   config: ProjectTemplateConfig;
}

export const projectTemplatesService = {
   getTemplates(workspaceId?: string, teamId?: string) {
      return apiClient<ProjectTemplate[]>('/circle/api/project-templates', {
         params: { workspaceId, teamId },
      });
   },
   createTemplate(payload: CreateProjectTemplatePayload) {
      return apiClient<ProjectTemplate>('/circle/api/project-templates', {
         method: 'POST',
         body: JSON.stringify(payload),
      });
   },
   updateTemplate(id: string, payload: Partial<CreateProjectTemplatePayload>) {
      return apiClient<ProjectTemplate>(`/circle/api/project-templates/${id}`, {
         method: 'PATCH',
         body: JSON.stringify(payload),
      });
   },
   duplicateTemplate(id: string) {
      return apiClient<ProjectTemplate>(`/circle/api/project-templates/${id}/duplicate`, {
         method: 'POST',
      });
   },
   deleteTemplate(id: string) {
      return apiClient<{ success: boolean }>(`/circle/api/project-templates/${id}`, {
         method: 'DELETE',
      });
   },
   createProjectFromTemplate(
      id: string,
      payload: { name: string; teamId: string; overrides?: Record<string, unknown> }
   ) {
      return apiClient(`/circle/api/projects/from-template/${id}`, {
         method: 'POST',
         body: JSON.stringify(payload),
      });
   },
};
