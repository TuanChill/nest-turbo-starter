import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cyclesService, Cycle } from '@/services/cycles.service';
import { cycleKeys } from './keys';
import { toast } from 'sonner';

export function useCycles(teamId?: string) {
   return useQuery({
      queryKey: cycleKeys.list(teamId),
      queryFn: () => cyclesService.getCycles(teamId),
   });
}

export function useCycle(id: string, enabled = true) {
   return useQuery({
      queryKey: cycleKeys.detail(id),
      queryFn: () => cyclesService.getCycleById(id),
      enabled: Boolean(id) && enabled,
   });
}

export function useCreateCycle() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: (payload: Partial<Cycle>) => cyclesService.createCycle(payload),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: cycleKeys.lists() });
         toast.success('Cycle created');
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to create cycle');
      },
   });
}

export function useUpdateCycle() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Partial<Cycle> }) =>
         cyclesService.updateCycle(id, payload),
      onSuccess: (_data, { id }) => {
         queryClient.invalidateQueries({ queryKey: cycleKeys.lists() });
         queryClient.invalidateQueries({ queryKey: cycleKeys.detail(id) });
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to update cycle');
      },
   });
}

export function useDeleteCycle() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: (id: string) => cyclesService.deleteCycle(id),
      onSuccess: (_, id) => {
         queryClient.invalidateQueries({ queryKey: cycleKeys.lists() });
         queryClient.removeQueries({ queryKey: cycleKeys.detail(id) });
         toast.success('Cycle deleted');
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to delete cycle');
      },
   });
}
