import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
   CreateIssueTemplatePayload,
   issueTemplatesService,
} from '@/services/issue-templates.service';
import { issueTemplateKeys } from './keys';

export function useIssueTemplates(workspaceId?: string, teamId?: string) {
   return useQuery({
      queryKey: issueTemplateKeys.list(workspaceId, teamId),
      queryFn: () => issueTemplatesService.getTemplates(workspaceId, teamId),
      enabled: Boolean(workspaceId),
   });
}

export function useCreateIssueTemplate() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (payload: CreateIssueTemplatePayload) =>
         issueTemplatesService.createTemplate(payload),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: issueTemplateKeys.lists() });
         toast.success('Issue template created');
      },
      onError: (error: Error) => toast.error(error.message || 'Failed to create issue template'),
   });
}

export function useUpdateIssueTemplate() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateIssueTemplatePayload> }) =>
         issueTemplatesService.updateTemplate(id, payload),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: issueTemplateKeys.all });
         toast.success('Issue template updated');
      },
      onError: (error: Error) => toast.error(error.message || 'Failed to update issue template'),
   });
}

export function useDuplicateIssueTemplate() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (id: string) => issueTemplatesService.duplicateTemplate(id),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: issueTemplateKeys.lists() });
         toast.success('Issue template duplicated');
      },
      onError: (error: Error) => toast.error(error.message || 'Failed to duplicate issue template'),
   });
}

export function useDeleteIssueTemplate() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (id: string) => issueTemplatesService.deleteTemplate(id),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: issueTemplateKeys.lists() });
         toast.success('Issue template deleted');
      },
      onError: (error: Error) => toast.error(error.message || 'Failed to delete issue template'),
   });
}
