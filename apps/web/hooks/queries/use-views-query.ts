import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { viewsService, View, CustomView, CreateViewPayload } from '@/services/views.service';
import { viewKeys } from './keys';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';
import { useWorkspaces } from './use-workspaces-query';

export type { View, CustomView };

export function useViews(
   filters?: { teamId?: string; projectId?: string; workspaceId?: string } | string
) {
   const { orgId } = useParams<{ orgId?: string }>();
   const { data: workspaces = [], isFetched: workspacesFetched } = useWorkspaces();
   const resolvedWorkspaceId =
      (typeof filters === 'object' ? filters?.workspaceId : undefined) ||
      workspaces.find((workspace) => workspace.slug === orgId || workspace.id === orgId)?.id;
   const parsedFilters = {
      ...(typeof filters === 'string' ? { teamId: filters } : filters),
      workspaceId: resolvedWorkspaceId,
   };
   const hasRouteWorkspace = Boolean(
      orgId || (typeof filters === 'object' && filters?.workspaceId)
   );
   return useQuery({
      queryKey: viewKeys.list(parsedFilters),
      queryFn: () => viewsService.getViews(parsedFilters),
      enabled: !hasRouteWorkspace || (workspacesFetched && Boolean(resolvedWorkspaceId)),
   });
}

export function useView(id: string, enabled = true) {
   return useQuery({
      queryKey: viewKeys.detail(id),
      queryFn: () => viewsService.getViewById(id),
      enabled: Boolean(id) && enabled,
   });
}

export function useCreateView() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: (payload: CreateViewPayload) => viewsService.createView(payload),
      onSuccess: (newView) => {
         queryClient.invalidateQueries({ queryKey: viewKeys.lists() });
         toast.success(`View "${newView.name}" created`);
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to create view');
      },
   });
}

export function useUpdateView() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateViewPayload> }) =>
         viewsService.updateView(id, payload),
      onSuccess: (updated) => {
         queryClient.invalidateQueries({ queryKey: viewKeys.lists() });
         queryClient.invalidateQueries({ queryKey: viewKeys.detail(updated.id) });
         toast.success('View updated');
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to update view');
      },
   });
}

export function useDeleteView() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: (id: string) => viewsService.deleteView(id),
      onSuccess: (_, id) => {
         queryClient.invalidateQueries({ queryKey: viewKeys.lists() });
         queryClient.removeQueries({ queryKey: viewKeys.detail(id) });
         toast.success('View deleted');
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to delete view');
      },
   });
}
