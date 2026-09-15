import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
   CreateProjectTemplatePayload,
   projectTemplatesService,
} from '@/services/project-templates.service';
import { projectKeys, projectTemplateKeys } from './keys';
import { toast } from 'sonner';

export function useProjectTemplates(workspaceId?: string, teamId?: string) {
   return useQuery({
      queryKey: projectTemplateKeys.list(workspaceId, teamId),
      queryFn: () => projectTemplatesService.getTemplates(workspaceId, teamId),
      enabled: Boolean(workspaceId),
   });
}
export function useCreateProjectTemplate() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (payload: CreateProjectTemplatePayload) =>
         projectTemplatesService.createTemplate(payload),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: projectTemplateKeys.lists() });
         toast.success('Project template created');
      },
      onError: (error: Error) => toast.error(error.message || 'Failed to create project template'),
   });
}
export function useUpdateProjectTemplate() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: ({
         id,
         payload,
      }: {
         id: string;
         payload: Partial<CreateProjectTemplatePayload>;
      }) => projectTemplatesService.updateTemplate(id, payload),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: projectTemplateKeys.all });
         toast.success('Project template updated');
      },
      onError: (error: Error) => toast.error(error.message || 'Failed to update project template'),
   });
}
export function useDuplicateProjectTemplate() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (id: string) => projectTemplatesService.duplicateTemplate(id),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: projectTemplateKeys.lists() });
         toast.success('Project template duplicated');
      },
      onError: (error: Error) =>
         toast.error(error.message || 'Failed to duplicate project template'),
   });
}
export function useDeleteProjectTemplate() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (id: string) => projectTemplatesService.deleteTemplate(id),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: projectTemplateKeys.lists() });
         toast.success('Project template deleted');
      },
      onError: (error: Error) => toast.error(error.message || 'Failed to delete project template'),
   });
}
export function useCreateProjectFromTemplate() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: ({
         id,
         name,
         teamId,
         overrides,
      }: {
         id: string;
         name: string;
         teamId: string;
         overrides?: Record<string, unknown>;
      }) => projectTemplatesService.createProjectFromTemplate(id, { name, teamId, overrides }),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
         toast.success('Project created from template');
      },
      onError: (error: Error) =>
         toast.error(error.message || 'Failed to create project from template'),
   });
}
