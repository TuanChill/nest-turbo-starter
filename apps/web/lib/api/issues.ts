import { apiClient } from './client';
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

export async function fetchIssues(params?: IssueFilterParams): Promise<Issue[]> {
   return apiClient<Issue[]>('/issues', {
      params: params as Record<string, string | string[] | undefined>,
   });
}

export async function fetchIssueById(identifier: string): Promise<Issue> {
   return apiClient<Issue>(`/issues/${identifier}`);
}

export async function fetchIssueDetail(identifier: string): Promise<IssueDetail> {
   return apiClient<IssueDetail>(`/issues/${identifier}/detail`);
}

export async function createIssue(data: CreateIssuePayload): Promise<Issue> {
   return apiClient<Issue>('/issues', {
      method: 'POST',
      body: JSON.stringify(data),
   });
}

export async function updateIssue(identifier: string, data: UpdateIssuePayload): Promise<Issue> {
   return apiClient<Issue>(`/issues/${identifier}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
   });
}

export async function updateIssueRank(
   identifier: string,
   rank: string
): Promise<{ success: boolean }> {
   return apiClient<{ success: boolean }>(`/issues/${identifier}/rank`, {
      method: 'PATCH',
      body: JSON.stringify({ rank }),
   });
}

export async function deleteIssue(identifier: string): Promise<{ success: boolean }> {
   return apiClient<{ success: boolean }>(`/issues/${identifier}`, {
      method: 'DELETE',
   });
}

export async function addIssueComment(
   identifier: string,
   data: { textContent?: string; commentBlocks?: ContentBlock[] }
): Promise<IssueDetail> {
   return apiClient<IssueDetail>(`/issues/${identifier}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
   });
}

export async function addIssueReaction(
   activityId: string,
   emoji: string,
   userId?: string
): Promise<{ id: string; reactions: Array<{ emoji: string; count: number; userIds: string[] }> }> {
   return apiClient<{
      id: string;
      reactions: Array<{ emoji: string; count: number; userIds: string[] }>;
   }>(`/issues/activities/${activityId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji, userId }),
   });
}

export async function addIssueRelation(
   identifier: string,
   targetIdentifier: string,
   relationType: 'blocks' | 'blocked_by' | 'relates_to' | 'duplicate_of'
): Promise<IssueDetail> {
   return apiClient<IssueDetail>(`/issues/${identifier}/relations`, {
      method: 'POST',
      body: JSON.stringify({ targetIdentifier, relationType }),
   });
}
