import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsService, TeamDocument } from '@/services/documents.service';
import { documentKeys } from './keys';
import { toast } from 'sonner';

export function useDocuments(teamId?: string) {
   return useQuery({
      queryKey: documentKeys.list(teamId),
      queryFn: () => documentsService.getDocuments(teamId),
   });
}

export function useDocument(id: string, enabled = true) {
   return useQuery({
      queryKey: documentKeys.detail(id),
      queryFn: () => documentsService.getDocumentById(id),
      enabled: Boolean(id) && enabled,
   });
}

export function useCreateDocument() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: (payload: Partial<TeamDocument> & { folderId?: string; content?: string }) =>
         documentsService.createDocument(payload),
      onSuccess: (newDoc) => {
         queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
         toast.success(`Document "${newDoc.name || 'Untitled'}" created`);
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to create document');
      },
   });
}

export function useCreateDocumentFolder() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: (payload: { name: string; icon?: string; teamId?: string }) =>
         documentsService.createFolder(payload),
      onSuccess: (newFolder) => {
         queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
         toast.success(`Folder "${newFolder.name}" created`);
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to create folder');
      },
   });
}

export function useUpdateDocument() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Partial<TeamDocument> }) =>
         documentsService.updateDocument(id, payload),
      onSuccess: (updated) => {
         queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
         queryClient.invalidateQueries({ queryKey: documentKeys.detail(updated.id) });
         toast.success('Document updated');
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to update document');
      },
   });
}

export function useDeleteDocument() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: (id: string) => documentsService.deleteDocument(id),
      onSuccess: (_, id) => {
         queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
         queryClient.removeQueries({ queryKey: documentKeys.detail(id) });
         toast.success('Document deleted');
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to delete document');
      },
   });
}
