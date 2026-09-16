import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { uploadsService, type UploadTarget } from '@/services/uploads.service';
import { attachmentKeys } from './keys';

export function useAttachments(target: UploadTarget | undefined) {
   return useQuery({
      queryKey: attachmentKeys.list(target ?? {}),
      queryFn: () => uploadsService.getAttachments(target as UploadTarget),
      enabled: Boolean(target),
   });
}

export function useUploadAttachment() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: ({ target, file }: { target: UploadTarget; file: File }) =>
         uploadsService.upload(target, file),
      onSuccess: (_, { target }) => {
         queryClient.invalidateQueries({ queryKey: attachmentKeys.list(target) });
         toast.success('Attachment uploaded');
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to upload attachment');
      },
   });
}
