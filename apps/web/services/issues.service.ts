import { apiClient } from './api-client';
import { Issue } from '@/mock-data/issues';
import { ContentBlock, IssueDetail } from '@/mock-data/issue-details';

export interface IssueFilterParams {
   teamId?: string;
   cycleId?: string;
   projectId?: string;
   statusCategories?: string[];
   statusIds?: string[];
   priorityIds?: string[];
   assigneeId?: string;
   labelIds?: string[];
   search?: string;
}

export interface CreateIssuePayload {
   identifier?: string;
   title: string;
   description?: string;
   descriptionBlocks?: ContentBlock[];
   statusId?: string;
   statusCategory?: string;
   priorityId?: string;
   assigneeId?: string;
   creatorId?: string;
   teamId?: string;
   projectId?: string;
   cycleId?: string;
   parentIssueId?: string;
   labelIds?: string[];
   rank?: string;
   dueDate?: string;
   milestone?: string;
}

export interface UpdateIssuePayload {
   title?: string;
   description?: string;
   descriptionBlocks?: ContentBlock[];
   statusId?: string;
   statusCategory?: string;
   priorityId?: string;
   assigneeId?: string | null;
   teamId?: string;
   projectId?: string;
   cycleId?: string;
   parentIssueId?: string;
   labelIds?: string[];
   rank?: string;
   dueDate?: string;
   milestone?: string;
}

export const issuesService = {
   async getIssues(params?: IssueFilterParams): Promise<Issue[]> {
      return apiClient<Issue[]>('/issues', {
         params: params as Record<string, string | string[] | undefined>,
      });
   },

   async getIssueById(identifier: string): Promise<Issue> {
      return apiClient<Issue>(`/issues/${identifier}`);
   },

   async getIssueDetail(identifier: string): Promise<IssueDetail> {
      return apiClient<IssueDetail>(`/issues/${identifier}/detail`);
   },

   async createIssue(data: CreateIssuePayload): Promise<Issue> {
      return apiClient<Issue>('/issues', {
         method: 'POST',
         body: JSON.stringify(data),
      });
   },

   async updateIssue(identifier: string, data: UpdateIssuePayload): Promise<Issue> {
      return apiClient<Issue>(`/issues/${identifier}`, {
         method: 'PATCH',
         body: JSON.stringify(data),
      });
   },

   async updateIssueRank(identifier: string, rank: string): Promise<{ success: boolean }> {
      return apiClient<{ success: boolean }>(`/issues/${identifier}/rank`, {
         method: 'PATCH',
         body: JSON.stringify({ rank }),
      });
   },

   async deleteIssue(identifier: string): Promise<{ success: boolean }> {
      return apiClient<{ success: boolean }>(`/issues/${identifier}`, {
         method: 'DELETE',
      });
   },

   async addComment(
      identifier: string,
      data: { actorId: string; textContent?: string; commentBlocks?: ContentBlock[] }
   ): Promise<IssueDetail> {
      return apiClient<IssueDetail>(`/issues/${identifier}/comments`, {
         method: 'POST',
         body: JSON.stringify(data),
      });
   },

   async addReaction(
      activityId: string,
      emoji: string,
      userId?: string
   ): Promise<{
      id: string;
      reactions: Array<{ emoji: string; count: number; userIds: string[] }>;
   }> {
      return apiClient<{
         id: string;
         reactions: Array<{ emoji: string; count: number; userIds: string[] }>;
      }>(`/issues/activities/${activityId}/reactions`, {
         method: 'POST',
         body: JSON.stringify({ emoji, userId }),
      });
   },

   async addRelation(
      identifier: string,
      targetIdentifier: string,
      relationType: 'blocks' | 'blocked_by' | 'relates_to' | 'duplicate_of'
   ): Promise<IssueDetail> {
      return apiClient<IssueDetail>(`/issues/${identifier}/relations`, {
         method: 'POST',
         body: JSON.stringify({ targetIdentifier, relationType }),
      });
   },

   async deleteRelation(identifier: string, relationId: string): Promise<IssueDetail> {
      return apiClient<IssueDetail>(`/issues/${identifier}/relations/${relationId}`, {
         method: 'DELETE',
      });
   },
};
