import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { labelsService, LabelItem } from '@/services/labels.service';
import { labelKeys } from './keys';
import { toast } from 'sonner';

export function useLabels() {
   return useQuery({
      queryKey: labelKeys.lists(),
      queryFn: () => labelsService.getLabels(),
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
