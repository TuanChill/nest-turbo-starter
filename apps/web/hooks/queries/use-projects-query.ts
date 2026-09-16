import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
   projectsService,
   Project,
   ProjectUpdatePatchPayload,
   ProjectUpdatePayload,
} from '@/services/projects.service';
import { projectKeys } from './keys';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';
import { useWorkspaces } from './use-workspaces-query';

export function useProjects(teamId?: string, workspaceId?: string) {
   const { orgId } = useParams<{ orgId?: string }>();
   const { data: workspaces = [], isFetched: workspacesFetched } = useWorkspaces();
   const resolvedWorkspaceId =
      workspaceId ||
      workspaces.find((workspace) => workspace.slug === orgId || workspace.id === orgId)?.id;
   const hasRouteWorkspace = Boolean(workspaceId || orgId);
   return useQuery({
      queryKey: projectKeys.list(teamId, resolvedWorkspaceId),
      queryFn: () => projectsService.getProjects(teamId, resolvedWorkspaceId),
      enabled: !hasRouteWorkspace || (workspacesFetched && Boolean(resolvedWorkspaceId)),
   });
}

export function useProject(id: string, enabled = true) {
   return useQuery({
      queryKey: projectKeys.detail(id),
      queryFn: () => projectsService.getProjectById(id),
      enabled: Boolean(id) && enabled,
   });
}

export function useProjectSubscription(id: string, enabled = true) {
   return useQuery({
      queryKey: projectKeys.subscription(id),
      queryFn: () => projectsService.getSubscription(id),
      enabled: Boolean(id) && enabled,
   });
}

export function useToggleProjectSubscription() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: ({ id, subscribed }: { id: string; subscribed: boolean }) =>
         subscribed ? projectsService.subscribe(id) : projectsService.unsubscribe(id),
      onSuccess: (result, { id }) => {
         queryClient.setQueryData(projectKeys.subscription(id), result);
         queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
         queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to update project subscription');
      },
   });
}

export function useProjectMembers(id: string, enabled = true) {
   return useQuery({
      queryKey: projectKeys.members(id),
      queryFn: () => projectsService.getProjectMembers(id),
      enabled: Boolean(id) && enabled,
   });
}

export function useUpdateProjectMembers() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: ({ projectId, memberIds }: { projectId: string; memberIds: string[] }) =>
         projectsService.replaceProjectMembers(projectId, memberIds),
      onSuccess: (members, { projectId }) => {
         queryClient.setQueryData(projectKeys.members(projectId), members);
         queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
         queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
         toast.success('Project members updated');
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to update project members');
      },
   });
}

export function useProjectOverview(id: string, enabled = true) {
   return useQuery({
      queryKey: projectKeys.overview(id),
      queryFn: () => projectsService.getProjectOverview(id),
      enabled: Boolean(id) && enabled,
   });
}

export function useProjectDetail(id: string, enabled = true) {
   return useQuery({
      queryKey: projectKeys.activity(id),
      queryFn: () => projectsService.getProjectDetail(id),
      enabled: Boolean(id) && enabled,
   });
}

export function useCreateProject() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: (payload: Partial<Project>) => projectsService.createProject(payload),
      onSuccess: (newProject) => {
         queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
         toast.success(`Project "${newProject.name}" created`);
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to create project');
      },
   });
}

export function useUpdateProject() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Partial<Project> }) =>
         projectsService.updateProject(id, payload),
      onSuccess: (updated) => {
         queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
         queryClient.invalidateQueries({ queryKey: projectKeys.detail(updated.id) });
         queryClient.invalidateQueries({ queryKey: projectKeys.activity(updated.id) });
         toast.success('Project updated');
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to update project');
      },
   });
}

export function useDeleteProject() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: (id: string) => projectsService.deleteProject(id),
      onSuccess: (_, id) => {
         queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
         queryClient.removeQueries({ queryKey: projectKeys.detail(id) });
         toast.success('Project deleted');
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to delete project');
      },
   });
}

export function usePostProjectUpdate() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: ({ projectId, payload }: { projectId: string; payload: ProjectUpdatePayload }) =>
         projectsService.postProjectUpdate(projectId, payload),
      onSuccess: (_, { projectId }) => {
         queryClient.invalidateQueries({ queryKey: projectKeys.activity(projectId) });
         toast.success('Project update posted');
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to post update');
      },
   });
}

export function useUpdateProjectUpdate() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: ({
         projectId,
         updateId,
         payload,
      }: {
         projectId: string;
         updateId: string;
         payload: ProjectUpdatePatchPayload;
      }) => projectsService.updateProjectUpdate(projectId, updateId, payload),
      onSuccess: (detail, { projectId }) => {
         queryClient.setQueryData(projectKeys.activity(projectId), detail);
         queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
         toast.success('Project update edited');
      },
      onError: (error: Error) => toast.error(error.message || 'Failed to edit project update'),
   });
}

export function useDeleteProjectUpdate() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: ({ projectId, updateId }: { projectId: string; updateId: string }) =>
         projectsService.deleteProjectUpdate(projectId, updateId),
      onSuccess: (detail, { projectId }) => {
         queryClient.setQueryData(projectKeys.activity(projectId), detail);
         queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
         toast.success('Project update deleted');
      },
      onError: (error: Error) => toast.error(error.message || 'Failed to delete project update'),
   });
}

export function useAddMilestone() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: ({
         projectId,
         payload,
      }: {
         projectId: string;
         payload: { name: string; targetDate?: string };
      }) => projectsService.addMilestone(projectId, payload),
      onSuccess: (_, { projectId }) => {
         queryClient.invalidateQueries({ queryKey: projectKeys.activity(projectId) });
         toast.success('Milestone added');
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to add milestone');
      },
   });
}

export function useToggleMilestone() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: ({ projectId, milestoneId }: { projectId: string; milestoneId: string }) =>
         projectsService.toggleMilestone(projectId, milestoneId),
      onSuccess: (_, { projectId }) => {
         queryClient.invalidateQueries({ queryKey: projectKeys.activity(projectId) });
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to update milestone');
      },
   });
}
