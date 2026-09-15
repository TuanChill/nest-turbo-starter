import { apiClient } from './api-client';

export type IssueTemplateScope = 'workspace' | 'team';

export interface IssueTemplateConfig {
   title?: string;
   description?: string;
   descriptionBlocks?: unknown[];
   statusId?: string;
   statusCategory?: string;
   priorityId?: string;
   assigneeId?: string;
   labelIds?: string[];
   projectId?: string;
   cycleId?: string;
   dueDate?: string;
}

export interface IssueTemplate {
   id: string;
   workspaceId: string;
   name: string;
   description?: string;
   scope: IssueTemplateScope;
   teamId?: string;
   createdBy: string;
   isDefault: boolean;
   config: IssueTemplateConfig;
   createdAt: string;
   updatedAt: string;
}

export interface CreateIssueTemplatePayload {
   workspaceId: string;
   name: string;
   description?: string;
   scope: IssueTemplateScope;
   teamId?: string;
   isDefault?: boolean;
   config: IssueTemplateConfig;
}

export const issueTemplatesService = {
   getTemplates(workspaceId?: string, teamId?: string) {
      return apiClient<IssueTemplate[]>('/circle/api/issue-templates', {
         params: { workspaceId, teamId },
      });
   },
   createTemplate(payload: CreateIssueTemplatePayload) {
      return apiClient<IssueTemplate>('/circle/api/issue-templates', {
         method: 'POST',
         body: JSON.stringify(payload),
      });
   },
   updateTemplate(id: string, payload: Partial<CreateIssueTemplatePayload>) {
      return apiClient<IssueTemplate>(`/circle/api/issue-templates/${id}`, {
         method: 'PATCH',
         body: JSON.stringify(payload),
      });
   },
   duplicateTemplate(id: string) {
      return apiClient<IssueTemplate>(`/circle/api/issue-templates/${id}/duplicate`, {
         method: 'POST',
      });
   },
   deleteTemplate(id: string) {
      return apiClient<{ success: boolean }>(`/circle/api/issue-templates/${id}`, {
         method: 'DELETE',
      });
   },
};
