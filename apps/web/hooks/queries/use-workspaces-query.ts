import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
   workspacesService,
   Workspace,
   CreateWorkspacePayload,
   JoinWorkspacePayload,
} from '@/services/workspaces.service';
import { workspaceKeys } from './keys';
import { toast } from 'sonner';

export function useWorkspaces() {
   return useQuery({
      queryKey: workspaceKeys.lists(),
      queryFn: () => workspacesService.getWorkspaces(),
   });
}

export function useWorkspace(idOrSlug: string, enabled = true) {
   return useQuery({
      queryKey: workspaceKeys.detail(idOrSlug),
      queryFn: () => workspacesService.getWorkspace(idOrSlug),
      enabled: Boolean(idOrSlug) && enabled,
   });
}

export function useCreateWorkspace() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: (payload: CreateWorkspacePayload) => workspacesService.createWorkspace(payload),
      onSuccess: (newWorkspace) => {
         queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
         toast.success(`Workspace "${newWorkspace.name}" created successfully`);
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to create workspace');
      },
   });
}

export function useJoinWorkspace() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: (payload: JoinWorkspacePayload) => workspacesService.joinWorkspace(payload),
      onSuccess: (joinedWorkspace) => {
         queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
         toast.success(`Joined workspace "${joinedWorkspace.name}"`);
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to join workspace');
      },
   });
}
