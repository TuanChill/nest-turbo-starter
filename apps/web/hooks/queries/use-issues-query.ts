import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
   issuesService,
   IssueFilterParams,
   CreateIssuePayload,
   UpdateIssuePayload,
} from '@/services/issues.service';
import { Issue } from '@/mock-data/issues';
import { ContentBlock, IssueDetail } from '@/mock-data/issue-details';
import { issueKeys } from './keys';
import { toast } from 'sonner';

export function useIssues(params?: IssueFilterParams) {
   return useQuery({
      queryKey: issueKeys.list(params as Record<string, unknown>),
      queryFn: () => issuesService.getIssues(params),
   });
}

export function useIssue(identifier: string, enabled = true) {
   return useQuery({
      queryKey: issueKeys.detail(identifier),
      queryFn: () => issuesService.getIssueById(identifier),
      enabled: Boolean(identifier) && enabled,
   });
}

export function useIssueDetail(identifier: string, enabled = true) {
   return useQuery({
      queryKey: issueKeys.activity(identifier),
      queryFn: () => issuesService.getIssueDetail(identifier),
      enabled: Boolean(identifier) && enabled,
   });
}

export function useCreateIssue() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: (data: CreateIssuePayload) => issuesService.createIssue(data),
      onSuccess: (newIssue) => {
         queryClient.invalidateQueries({ queryKey: issueKeys.all });
         queryClient.invalidateQueries({ queryKey: ['issues'] });
         queryClient.invalidateQueries({ queryKey: ['projects'] });
         toast.success(`Created issue ${newIssue.identifier || newIssue.title}`);
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to create issue');
      },
   });
}

export function useUpdateIssue() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: ({ identifier, data }: { identifier: string; data: UpdateIssuePayload }) =>
         issuesService.updateIssue(identifier, data),
      onSuccess: (updated) => {
         queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
         queryClient.invalidateQueries({ queryKey: issueKeys.detail(updated.identifier) });
         queryClient.invalidateQueries({ queryKey: issueKeys.activity(updated.identifier) });
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to update issue');
      },
   });
}

export function useDeleteIssue() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: (identifier: string) => issuesService.deleteIssue(identifier),
      onSuccess: (_, identifier) => {
         queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
         queryClient.removeQueries({ queryKey: issueKeys.detail(identifier) });
         toast.success(`Deleted issue ${identifier}`);
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to delete issue');
      },
   });
}

export function useAddIssueComment() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: ({
         identifier,
         actorId,
         textContent,
         commentBlocks,
      }: {
         identifier: string;
         actorId: string;
         textContent?: string;
         commentBlocks?: ContentBlock[];
      }) => issuesService.addComment(identifier, { actorId, textContent, commentBlocks }),
      onSuccess: (updatedDetail, { identifier }) => {
         queryClient.setQueryData(issueKeys.activity(identifier), updatedDetail);
         queryClient.invalidateQueries({ queryKey: issueKeys.activity(identifier) });
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to post comment');
      },
   });
}

export function useAddIssueReaction() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: ({
         activityId,
         emoji,
         userId,
         issueIdentifier,
      }: {
         activityId: string;
         emoji: string;
         userId?: string;
         issueIdentifier?: string;
      }) => issuesService.addReaction(activityId, emoji, userId),
      onSuccess: (_, variables) => {
         if (variables.issueIdentifier) {
            queryClient.invalidateQueries({
               queryKey: issueKeys.activity(variables.issueIdentifier),
            });
         }
      },
   });
}

export function useAddIssueRelation() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: ({
         identifier,
         targetIdentifier,
         relationType,
      }: {
         identifier: string;
         targetIdentifier: string;
         relationType: 'blocks' | 'blocked_by' | 'relates_to' | 'duplicate_of';
      }) => issuesService.addRelation(identifier, targetIdentifier, relationType),
      onSuccess: (updatedDetail, { identifier }) => {
         queryClient.setQueryData(issueKeys.activity(identifier), updatedDetail);
         queryClient.invalidateQueries({ queryKey: issueKeys.activity(identifier) });
         toast.success('Relation added');
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to add relation');
      },
   });
}
