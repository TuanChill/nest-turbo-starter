import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
   initiativesService,
   InitiativeMutationPayload,
   InitiativeUpdatePayload,
} from '@/services/initiatives.service';
import { initiativeKeys } from './keys';
import { toast } from 'sonner';

export function useInitiatives() {
   return useQuery({
      queryKey: initiativeKeys.lists(),
      queryFn: () => initiativesService.getInitiatives(),
   });
}

export function useInitiative(id: string, enabled = true) {
   return useQuery({
      queryKey: initiativeKeys.detail(id),
      queryFn: () => initiativesService.getInitiativeById(id),
      enabled: Boolean(id) && enabled,
   });
}

export function useCreateInitiative() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: (payload: InitiativeMutationPayload) =>
         initiativesService.createInitiative(payload),
      onSuccess: (newInit) => {
         queryClient.invalidateQueries({ queryKey: initiativeKeys.lists() });
         toast.success(`Initiative "${newInit.name}" created`);
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to create initiative');
      },
   });
}

export function useUpdateInitiative() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: InitiativeMutationPayload }) =>
         initiativesService.updateInitiative(id, payload),
      onSuccess: (updated) => {
         queryClient.invalidateQueries({ queryKey: initiativeKeys.lists() });
         queryClient.invalidateQueries({ queryKey: initiativeKeys.detail(updated.id) });
         toast.success('Initiative updated');
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to update initiative');
      },
   });
}

export function useDeleteInitiative() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: (id: string) => initiativesService.deleteInitiative(id),
      onSuccess: (_, id) => {
         queryClient.invalidateQueries({ queryKey: initiativeKeys.lists() });
         queryClient.removeQueries({ queryKey: initiativeKeys.detail(id) });
         toast.success('Initiative deleted');
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to delete initiative');
      },
   });
}

export function usePostInitiativeUpdate() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: InitiativeUpdatePayload }) =>
         initiativesService.postInitiativeUpdate(id, payload),
      onSuccess: (updated) => {
         queryClient.invalidateQueries({ queryKey: initiativeKeys.lists() });
         queryClient.setQueryData(initiativeKeys.detail(updated.id), updated);
         toast.success('Initiative update posted');
      },
      onError: (error: Error) => toast.error(error.message || 'Failed to post initiative update'),
   });
}
