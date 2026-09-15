import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { labelsService, LabelGroup, LabelItem } from '@/services/labels.service';
import { labelKeys } from './keys';
import { toast } from 'sonner';

export function useLabels(scope: 'issue' | 'project' = 'issue') {
   return useQuery({
      queryKey: labelKeys.list(scope),
      queryFn: () => labelsService.getLabels(scope),
   });
}

export function useLabelGroups(scope: 'issue' | 'project' = 'issue') {
   return useQuery({
      queryKey: [...labelKeys.lists(), 'groups', scope],
      queryFn: () => labelsService.getLabelGroups(scope),
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
