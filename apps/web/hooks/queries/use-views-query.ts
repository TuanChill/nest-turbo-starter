import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { viewsService, View, CustomView, CreateViewPayload } from '@/services/views.service';
import { viewKeys } from './keys';
import { toast } from 'sonner';

export type { View, CustomView };

export function useViews(filters?: { teamId?: string; projectId?: string } | string) {
   const parsedFilters = typeof filters === 'string' ? { teamId: filters } : filters;
   return useQuery({
      queryKey: viewKeys.list(parsedFilters),
      queryFn: () => viewsService.getViews(parsedFilters),
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
