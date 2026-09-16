import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { labelsService, LabelGroup, LabelItem } from '@/services/labels.service';
import { labelKeys } from './keys';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';
import { useWorkspaces } from './use-workspaces-query';

export function useLabels(
   scope: 'issue' | 'project' = 'issue',
   teamId?: string,
   includeArchived = false
) {
   const { orgId } = useParams<{ orgId?: string }>();
   const { data: workspaces = [], isFetched: workspacesFetched } = useWorkspaces();
   const workspaceId = workspaces.find(
      (workspace) => workspace.slug === orgId || workspace.id === orgId
   )?.id;
   return useQuery({
      queryKey: [
         ...labelKeys.list(scope, workspaceId, teamId),
         includeArchived ? 'with-archived' : 'active',
      ],
      queryFn: () => labelsService.getLabels(scope, workspaceId, teamId, includeArchived),
      enabled: workspacesFetched && Boolean(workspaceId),
   });
}

export function useLabelGroups(scope: 'issue' | 'project' = 'issue') {
   const { orgId } = useParams<{ orgId?: string }>();
   const { data: workspaces = [], isFetched: workspacesFetched } = useWorkspaces();
   const workspaceId = workspaces.find(
      (workspace) => workspace.slug === orgId || workspace.id === orgId
   )?.id;
   return useQuery({
      queryKey: [...labelKeys.lists(), 'groups', scope, workspaceId],
      queryFn: () => labelsService.getLabelGroups(scope, workspaceId),
      enabled: workspacesFetched && Boolean(workspaceId),
   });
}

export function useCreateLabelGroup() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (payload: Partial<LabelGroup>) => labelsService.createLabelGroup(payload),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: labelKeys.lists() });
         toast.success('Label group created');
      },
      onError: (error: Error) => toast.error(error.message || 'Failed to create label group'),
   });
}

export function useUpdateLabelGroup() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Partial<LabelGroup> }) =>
         labelsService.updateLabelGroup(id, payload),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: labelKeys.lists() });
         toast.success('Label group updated');
      },
      onError: (error: Error) => toast.error(error.message || 'Failed to update label group'),
   });
}

export function useDeleteLabelGroup() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (id: string) => labelsService.deleteLabelGroup(id),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: labelKeys.lists() });
         toast.success('Label group deleted');
      },
      onError: (error: Error) => toast.error(error.message || 'Failed to delete label group'),
   });
}

export function useCreateLabel() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: (payload: Partial<LabelItem>) => labelsService.createLabel(payload),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: labelKeys.lists() });
         toast.success('Label created');
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to create label');
      },
   });
}

export function useUpdateLabel() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Partial<LabelItem> }) =>
         labelsService.updateLabel(id, payload),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: labelKeys.lists() });
         toast.success('Label updated');
      },
      onError: (error: Error) => toast.error(error.message || 'Failed to update label'),
   });
}

export function useDeleteLabel() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (id: string) => labelsService.deleteLabel(id),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: labelKeys.lists() });
         toast.success('Label deleted');
      },
      onError: (error: Error) => toast.error(error.message || 'Failed to delete label'),
   });
}
