import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { initiativesService, Initiative } from '@/services/initiatives.service';
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
      mutationFn: (payload: Partial<Initiative>) => initiativesService.createInitiative(payload),
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
      mutationFn: ({ id, payload }: { id: string; payload: Partial<Initiative> }) =>
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
